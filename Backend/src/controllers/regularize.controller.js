import prisma from "../../lib/prisma.js";
import { success, error, responses } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";
import {
  getStartOfDay,
  getEndOfDay,
  extraTime,
  getAttendanceStatusAtTime,
  isTodayWeekOff,
  SHIFT_TIME_REQUIRED_MESSAGE,
} from "../utils/dateFormat.js";
import sendNotification from "../services/sendNotification.js";
import { sendWebhooks } from "../utils/webhook.js";

const MAX_LOOKBACK_DAYS = 7;

const respondIfShiftMissing = (res, err) => {
  if (err?.message === SHIFT_TIME_REQUIRED_MESSAGE) {
    return error(res, 400, SHIFT_TIME_REQUIRED_MESSAGE);
  }
  return null;
};

const requestInclude = {
  user: {
    select: {
      id: true,
      employeeName: true,
      employeeId: true,
      shift: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      employeeName: true,
    },
  },
};

const notify = (tokens, title, body) => {
  const valid = (tokens || []).filter(Boolean);
  if (valid.length > 0) {
    sendNotification(valid, title, body);
  }
};

const findAttendanceForDate = (userId, tenantId, dateStart, dateEnd) =>
  prisma.attendance.findFirst({
    where: {
      userId,
      tenantId,
      date: { gte: dateStart, lte: dateEnd },
    },
  });

const findLeaveForDate = (userId, tenantId, dateStart, dateEnd) =>
  prisma.leaveEmployee.findFirst({
    where: {
      employeeId: userId,
      leave: {
        tenantId,
        startDate: { lte: dateEnd },
        endDate: { gte: dateStart },
      },
    },
    include: { leave: { select: { status: true } } },
  });

const eligibilityError = async ({ user, tenantId, dateStart, dateEnd }) => {
  const todayStart = getStartOfDay(new Date());
  if (dateStart.getTime() >= todayStart.getTime()) {
    return "You can only regularize past days, not today or future dates";
  }

  const oldest = new Date(todayStart);
  oldest.setDate(oldest.getDate() - MAX_LOOKBACK_DAYS);
  if (dateStart.getTime() < oldest.getTime()) {
    return `You can only regularize the last ${MAX_LOOKBACK_DAYS} days`;
  }

  if (user.joinDate && dateStart < getStartOfDay(user.joinDate)) {
    return "Cannot regularize a date before your joining date";
  }

  if (isTodayWeekOff(user.weekendOff, dateStart.getDay())) {
    return "Cannot regularize a week-off day";
  }

  const leave = await findLeaveForDate(user.id, tenantId, dateStart, dateEnd);
  if (leave) {
    return leave.leave?.status === "HOLIDAY"
      ? "Cannot regularize a holiday"
      : "Cannot regularize a leave day";
  }

  const attendance = await findAttendanceForDate(
    user.id,
    tenantId,
    dateStart,
    dateEnd,
  );
  if (attendance?.checkInTime && attendance?.checkOutTime) {
    return "Attendance for this date is already complete. Ask admin to edit it";
  }

  return null;
};

const applyToAttendance = async ({
  tenantId,
  user,
  dateStart,
  checkInTime,
  checkOutTime,
  existingAttendance,
}) => {
  const setting = await prisma.attendanceSetting.findFirst({
    where: { tenantId },
  });
  const computedStatus = getAttendanceStatusAtTime(
    user.shift,
    checkInTime,
    setting?.lateBufferMinutes ?? 15,
  );
  const overTime = extraTime(
    checkInTime,
    checkOutTime,
    user.shift,
    false,
    user.weekendOff,
    false,
    dateStart.getDay(),
  );

  if (existingAttendance) {
    const keepStatus = ["HALF_DAY", "WORK_FROM_HOME", "OVERTIME"].includes(
      existingAttendance.status,
    )
      ? existingAttendance.status
      : computedStatus;

    return prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkInTime,
        checkOutTime,
        extraTime: overTime,
        status: keepStatus,
      },
    });
  }

  return prisma.attendance.create({
    data: {
      userId: user.id,
      tenantId,
      date: dateStart,
      checkInTime,
      checkOutTime,
      status: computedStatus,
      extraTime: overTime,
    },
  });
};

export const createRegularization = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    if (req.user.userType === "ADMIN" || req.user.userType === "SUPERADMIN") {
      return error(res, 403, "Admins should edit attendance directly");
    }

    const userId = req.user.userId;
    const { date, checkInTime, checkOutTime, reason } = req.body;
    const dateStart = getStartOfDay(date);
    const dateEnd = getEndOfDay(date);
    const requestedCheckIn = new Date(checkInTime);
    const requestedCheckOut = new Date(checkOutTime);

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        employeeName: true,
        employeeId: true,
        shift: true,
        weekendOff: true,
        joinDate: true,
      },
    });
    if (!user) {
      return error(res, 404, "User not found");
    }

    const blocked = await eligibilityError({
      user,
      tenantId,
      dateStart,
      dateEnd,
    });
    if (blocked) {
      return error(res, 400, blocked);
    }

    const pending = await prisma.attendanceRegularization.findFirst({
      where: {
        userId,
        tenantId,
        date: { gte: dateStart, lte: dateEnd },
        status: "PENDING",
      },
    });
    if (pending) {
      return error(res, 409, "A pending regularization already exists for this date");
    }

    const request = await prisma.attendanceRegularization.create({
      data: {
        userId,
        tenantId,
        date: dateStart,
        requestedCheckIn,
        requestedCheckOut,
        reason: reason.trim(),
      },
      include: requestInclude,
    });

    const admins = await prisma.user.findMany({
      where: { tenantId, userType: "ADMIN" },
      select: { deviceId: true },
    });
    notify(
      admins.map((a) => a.deviceId),
      "Regularization request",
      `${user.employeeName || "An employee"} requested attendance regularization`,
    );

    sendWebhooks(
      "regularize_requested",
      {
        employeeName: user.employeeName,
        employeeId: user.employeeId,
        date: dateStart,
        reason: reason.trim(),
      },
      tenantId,
    );

    return success(res, 201, "Regularization request submitted", request);
  } catch (err) {
    console.error("Create regularization error:", err);
    return responses.serverError(res, "Internal server error");
  }
};

export const listRegularizations = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const {
      page = 1,
      limit = 20,
      status,
      month,
      year,
      userId,
    } = req.query;
    const isAdmin = req.user.userType === "ADMIN";

    const where = { tenantId };
    if (!isAdmin) {
      where.userId = req.user.userId;
    } else if (userId) {
      where.userId = parseInt(userId, 10);
    }
    if (status) {
      where.status = status;
    }
    if (month && year) {
      where.date = {
        gte: getStartOfDay(new Date(Number(year), Number(month) - 1, 1)),
        lte: getEndOfDay(new Date(Number(year), Number(month), 0)),
      };
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [records, totalCount] = await Promise.all([
      prisma.attendanceRegularization.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.attendanceRegularization.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take) || 1;

    return success(res, 200, "Regularization requests retrieved", {
      requests: records,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalCount,
        limit: take,
        hasNextPage: parseInt(page, 10) < totalPages,
        hasPreviousPage: parseInt(page, 10) > 1,
      },
    });
  } catch (err) {
    console.error("List regularizations error:", err);
    return responses.serverError(res, "Internal server error");
  }
};

export const getRegularizationById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const id = parseInt(req.params.id, 10);
    const isAdmin = req.user.userType === "ADMIN";

    const request = await prisma.attendanceRegularization.findFirst({
      where: {
        id,
        tenantId,
        ...(!isAdmin ? { userId: req.user.userId } : {}),
      },
      include: requestInclude,
    });
    if (!request) {
      return error(res, 404, "Regularization request not found");
    }

    const currentAttendance = await findAttendanceForDate(
      request.userId,
      tenantId,
      getStartOfDay(request.date),
      getEndOfDay(request.date),
    );

    return success(res, 200, "Regularization request retrieved", {
      ...request,
      currentAttendance,
    });
  } catch (err) {
    console.error("Get regularization error:", err);
    return responses.serverError(res, "Internal server error");
  }
};

export const approveRegularization = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const id = parseInt(req.params.id, 10);
    const request = await prisma.attendanceRegularization.findFirst({
      where: { id, tenantId },
    });
    if (!request) {
      return error(res, 404, "Regularization request not found");
    }
    if (request.status !== "PENDING") {
      return error(res, 400, "Only pending requests can be approved");
    }

    const checkInTime = new Date(req.body.checkInTime || request.requestedCheckIn);
    const checkOutTime = new Date(
      req.body.checkOutTime || request.requestedCheckOut,
    );
    if (checkOutTime <= checkInTime) {
      return error(res, 400, "Check-out time must be after check-in time");
    }

    const user = await prisma.user.findFirst({
      where: { id: request.userId, tenantId },
      select: {
        id: true,
        employeeName: true,
        employeeId: true,
        shift: true,
        weekendOff: true,
        deviceId: true,
      },
    });
    if (!user) {
      return error(res, 404, "User not found");
    }

    const dateStart = getStartOfDay(request.date);
    const dateEnd = getEndOfDay(request.date);
    const existingAttendance = await findAttendanceForDate(
      user.id,
      tenantId,
      dateStart,
      dateEnd,
    );

    const attendance = await applyToAttendance({
      tenantId,
      user,
      dateStart,
      checkInTime,
      checkOutTime,
      existingAttendance,
    });

    const updated = await prisma.attendanceRegularization.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        requestedCheckIn: checkInTime,
        requestedCheckOut: checkOutTime,
        adminNote: req.body.adminNote?.trim() || request.adminNote,
        reviewedById: req.user.userId,
        reviewedAt: new Date(),
        attendanceId: attendance.id,
      },
      include: requestInclude,
    });

    notify(
      [user.deviceId],
      "Regularization approved",
      "Your attendance regularization request was approved",
    );

    sendWebhooks(
      "regularize_approved",
      {
        employeeName: user.employeeName,
        employeeId: user.employeeId,
        date: dateStart,
        checkInTime,
        checkOutTime,
      },
      tenantId,
    );

    return success(res, 200, "Regularization approved", updated);
  } catch (err) {
    if (respondIfShiftMissing(res, err)) return;
    console.error("Approve regularization error:", err);
    return responses.serverError(res, "Internal server error");
  }
};

export const rejectRegularization = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const id = parseInt(req.params.id, 10);
    const request = await prisma.attendanceRegularization.findFirst({
      where: { id, tenantId },
    });
    if (!request) {
      return error(res, 404, "Regularization request not found");
    }
    if (request.status !== "PENDING") {
      return error(res, 400, "Only pending requests can be rejected");
    }

    const updated = await prisma.attendanceRegularization.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        adminNote: req.body.adminNote?.trim() || null,
        reviewedById: req.user.userId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });

    const employee = await prisma.user.findFirst({
      where: { id: request.userId, tenantId },
      select: { deviceId: true, employeeName: true },
    });
    notify(
      [employee?.deviceId],
      "Regularization rejected",
      req.body.adminNote?.trim() ||
        "Your attendance regularization request was rejected",
    );

    return success(res, 200, "Regularization rejected", updated);
  } catch (err) {
    console.error("Reject regularization error:", err);
    return responses.serverError(res, "Internal server error");
  }
};

export const cancelRegularization = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const id = parseInt(req.params.id, 10);
    const request = await prisma.attendanceRegularization.findFirst({
      where: { id, tenantId, userId: req.user.userId },
    });
    if (!request) {
      return error(res, 404, "Regularization request not found");
    }
    if (request.status !== "PENDING") {
      return error(res, 400, "Only pending requests can be cancelled");
    }

    await prisma.attendanceRegularization.delete({ where: { id: request.id } });
    return success(res, 200, "Regularization request cancelled");
  } catch (err) {
    console.error("Cancel regularization error:", err);
    return responses.serverError(res, "Internal server error");
  }
};
