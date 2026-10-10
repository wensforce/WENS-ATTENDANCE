import prisma from "../../lib/prisma.js";
import {
  isBreakAllowedForUser,
  resolveBreakOptionsForUser,
} from "../services/breakAllowed.service.js";
import breakOutReminder from "../services/breakOutReminder.service.js";
import { applyTimeOnDate, getBreakDuration } from "../utils/breakUtils.js";
import { getEndOfDay, getStartOfDay } from "../utils/dateFormat.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";
import { sendWebhooks } from "../utils/webhook.js";

export const getBreakOptions = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const userId = req?.user?.userId;
    if (!userId) return responses.badRequest(res, "User ID is required");

    const breakOptions = await resolveBreakOptionsForUser(tenantId, userId);

    return success(res, 200, "Break options fetched successfully", {
      breakOptions,
    });
  } catch (error) {
    console.error("Error getting break options:", error);
    return responses.serverError(res, "Internal server error");
  }
};

/** Admin: same options logic for a selected employee */
export const getAdminBreakOptions = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const userId = Number(req.params.userId);
    if (!userId) return responses.badRequest(res, "User ID is required");

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) return responses.notFound(res, "User not found");

    const breakOptions = await resolveBreakOptionsForUser(tenantId, userId);

    return success(res, 200, "Break options fetched successfully", {
      breakOptions,
    });
  } catch (error) {
    console.error("Error getting admin break options:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const startBreak = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const userId = req.user?.userId;
    const userRole = req.user?.userType; // was req.user.role
    const { breakConfigId } = req.body;

    if (!breakConfigId)
      return responses.badRequest(res, "Break config ID is required");

    const dayStart = getStartOfDay(new Date());
    const dayEnd = getEndOfDay(new Date());

    // 1) Load config for this tenant
    const breakConfig = await prisma.breakConfig.findFirst({
      where: { id: Number(breakConfigId), tenantId, isActive: true },
    });
    if (!breakConfig) {
      return responses.badRequest(res, "Break config not found");
    }

    // 2) Permission
    const allowed = await isBreakAllowedForUser(userId, userRole, breakConfig);
    if (!allowed) {
      return responses.badRequest(res, "Break is not allowed for this user");
    }

    // 3) Attendance + open break in parallel
    const [attendance, openBreak] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          tenantId,
          userId,
          date: { gte: dayStart, lte: dayEnd }, // prefer `date` if you store day there
        },
        select: { id: true },
      }),
      prisma.break.findFirst({
        where: {
          tenantId,
          userId,
          endTime: null,
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { id: true },
      }),
    ]);

    if (!attendance) {
      return responses.badRequest(
        res,
        "Please check in before starting a break",
      );
    }
    if (openBreak) {
      return responses.badRequest(
        res,
        "One break is already open. End it first",
      );
    }

    // 4) Optional: enforce maxPerDay
    const breaksToday = await prisma.break.count({
      where: {
        tenantId,
        userId,
        breakConfigId: breakConfig.id,
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });
    if (breaksToday >= breakConfig.maxPerDay) {
      return responses.badRequest(res, "Already taken for today");
    }

    // 5) Create
    const breakRecord = await prisma.break.create({
      data: {
        tenantId,
        userId,
        breakConfigId: breakConfig.id,
        attendanceId: attendance.id,
        startTime: new Date(),
      },
      include: {
        breakConfig: true,
        user: {
          select: {
            id: true,
            employeeName: true,
            employeeId: true,
            deviceId: true,
          },
        },
      },
    });

    sendWebhooks(
      "break_started",
      {
        employeeName: breakRecord.user.employeeName,
        employeeId: breakRecord.user.employeeId,
        breakName: breakRecord.breakConfig.label,
        breakStartTime: breakRecord.startTime,
      },
      tenantId,
    );

    breakOutReminder({
      deviceId: breakRecord.user.deviceId,
      breakRecord,
      breakConfig,
    });

    return success(res, 201, "Break started successfully", {
      break: breakRecord,
    });
  } catch (error) {
    console.error("Error starting break:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const endBreak = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const userId = req.user?.userId;
    const { breakId } = req.body;

    if (!breakId) return responses.badRequest(res, "Break ID is required");

    const breakRecord = await prisma.break.findFirst({
      where: { id: Number(breakId), tenantId, userId },
      include: {
        breakConfig: {
          select: { maxDurationMins: true, graceMins: true },
        },
        user: {
          select: { id: true, employeeName: true, employeeId: true },
        },
      },
    });

    if (!breakRecord) {
      return responses.badRequest(res, "Break not found");
    }

    // already ended → stop
    if (breakRecord.endTime) {
      return responses.badRequest(res, "Break is already ended");
    }

    if (!breakRecord.breakConfig) {
      return responses.badRequest(res, "Break config not found");
    }

    const endTime = new Date();
    const { isOverLimit, durationMins, extraTime } = getBreakDuration(
      breakRecord.startTime,
      breakRecord.breakConfig,
      endTime,
    );

    const updatedBreak = await prisma.break.update({
      where: { id: breakRecord.id },
      data: { endTime, isOverLimit, durationMins, extraTime },
    });

    sendWebhooks(
      "break_ended",
      {
        employeeName: breakRecord.user.employeeName,
        employeeId: breakRecord.user.employeeId,
        breakName: breakRecord.breakConfig.label,
        breakDuration: durationMins,
        breakExtraTime: extraTime,
        breakOverLimit: isOverLimit,
        breakStartTime: breakRecord.startTime,
        breakEndTime: endTime,
      },
      tenantId,
    );

    return success(res, 200, "Break ended successfully", {
      break: updatedBreak,
    });
  } catch (error) {
    console.error("Error ending break:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getTodayBreaks = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return responses.badRequest(res, "Tenant ID is required");
    const userId = req.user?.userId;
    if (!userId) return responses.badRequest(res, "User ID is required");
    const dayStart = getStartOfDay(new Date());
    const dayEnd = getEndOfDay(new Date());
    const breaks = await prisma.break.findMany({
      where: {
        tenantId,
        userId,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      include: {
        breakConfig: true,
      },
    });
    return success(res, 200, "Today breaks fetched successfully", {
      breaks,
    });
  } catch (error) {
    console.error("Error getting today breaks:", error);
    return responses.serverError(res, "Internal server error");
  }
};

// admin controllers

export const createBreak = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { date, startTime, endTime, breakConfigId, userId } = req.body;

    if (!date || !startTime || !endTime || !breakConfigId || !userId) {
      return responses.badRequest(
        res,
        "date, startTime, endTime, breakConfigId and userId are required",
      );
    }

    const targetUserId = Number(userId);
    const targetConfigId = Number(breakConfigId);
    if (!targetUserId || !targetConfigId) {
      return responses.badRequest(res, "Invalid userId or breakConfigId");
    }

    if (startTime >= endTime) {
      return responses.badRequest(res, "Start time must be before end time");
    }

    const dayStart = getStartOfDay(date);
    const dayEnd = getEndOfDay(date);

    let startTimeDate;
    let endTimeDate;
    try {
      startTimeDate = applyTimeOnDate(dayStart, startTime);
      endTimeDate = applyTimeOnDate(dayStart, endTime);
    } catch {
      return responses.badRequest(res, "Invalid time. Use HH:mm");
    }

    if (endTimeDate <= startTimeDate) {
      return responses.badRequest(res, "End time must be after start time");
    }

    const user = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      select: { id: true, userType: true },
    });
    if (!user) return responses.notFound(res, "User not found");

    const [breakConfig, attendance] = await Promise.all([
      prisma.breakConfig.findFirst({
        where: { id: targetConfigId, tenantId, isActive: true },
      }),
      prisma.attendance.findFirst({
        where: {
          userId: targetUserId,
          tenantId,
          date: { gte: dayStart, lte: dayEnd },
        },
        select: { id: true },
      }),
    ]);

    if (!breakConfig) {
      return responses.badRequest(res, "Break config not found");
    }

    if (!attendance) {
      return responses.badRequest(
        res,
        "No attendance found for this user on the selected date",
      );
    }

    const allowed = await isBreakAllowedForUser(
      targetUserId,
      user.userType,
      breakConfig,
    );
    if (!allowed) {
      return responses.badRequest(res, "Break is not allowed for this user");
    }

    const { isOverLimit, durationMins, extraTime } = getBreakDuration(
      startTimeDate,
      breakConfig,
      endTimeDate,
    );

    const breakRecord = await prisma.break.create({
      data: {
        tenantId,
        userId: targetUserId,
        breakConfigId: targetConfigId,
        attendanceId: attendance.id,
        startTime: startTimeDate,
        endTime: endTimeDate,
        isOverLimit,
        durationMins,
        extraTime,
      },
      include: {
        breakConfig: true,
        user: {
          select: { id: true, employeeName: true, employeeId: true },
        },
      },
    });

    return success(res, 201, "Break created successfully", {
      break: breakRecord,
    });
  } catch (error) {
    console.error("Error creating break:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getAllBreaks = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const date = String(req.query.date || "").trim();
    const type = String(req.query.type || "all");
    const overLimit = String(req.query.overLimit || "all"); // all | over | ok

    const whereClause = { tenantId };
    const and = [];

    if (userId) {
      whereClause.userId = userId;
    }

    if (search) {
      and.push({
        OR: [
          { breakConfig: { label: { contains: search } } },
          { breakConfig: { breakType: { contains: search } } },
          { user: { employeeName: { contains: search } } },
          { user: { employeeId: { contains: search } } },
        ],
      });
    }

    if (date) {
      and.push({
        startTime: {
          gte: getStartOfDay(new Date(date)),
          lte: getEndOfDay(new Date(date)),
        },
      });
    }

    if (type && type !== "all") {
      and.push({ breakConfig: { breakType: type } });
    }

    if (overLimit === "over") {
      and.push({ isOverLimit: true });
    } else if (overLimit === "ok") {
      and.push({ isOverLimit: false });
    }

    if (and.length) whereClause.AND = and;

    const totalCount = await prisma.break.count({ where: whereClause });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const breaks = await prisma.break.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startTime: "desc" },
      include: {
        breakConfig: true,
        user: {
          select: {
            id: true,
            employeeName: true,
            employeeId: true,
          },
        },
      },
    });

    return success(res, 200, "All breaks fetched successfully", {
      breaks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all breaks:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const updateBreak = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return responses.badRequest(res, "Tenant ID is required");
    const { breakId } = req.params;
    // just hh:mm
    const { startTime, endTime } = req.body;
    if (!breakId) return responses.badRequest(res, "Break ID is required");

    if (!startTime || !endTime) {
      return responses.badRequest(
        res,
        "startTime and endTime (HH:mm) are required",
      );
    }

    const breakRecord = await prisma.break.findFirst({
      where: { id: Number(breakId), tenantId },
      include: {
        breakConfig: {
          select: { maxDurationMins: true, graceMins: true, label: true },
        },
        user: {
          select: { id: true, employeeName: true, employeeId: true },
        },
      },
    });

    if (!breakRecord) return responses.notFound(res, "Break not found");

    if (!breakRecord.breakConfig) {
      return responses.notFound(res, "Break config not found");
    }

    let startTimeDate = null,
      endTimeDate = null;

    try {
      // date from DB break, time from admin payload
      startTimeDate = applyTimeOnDate(breakRecord.startTime, startTime);
      // if break not ended yet, use start date as base for end time
      const endBaseDate = breakRecord.endTime || breakRecord.startTime;
      endTimeDate = applyTimeOnDate(endBaseDate, endTime);
    } catch {
      return responses.badRequest(res, "Invalid time. Use HH:mm");
    }

    if (endTimeDate <= startTimeDate) {
      return responses.badRequest(res, "End time must be after start time");
    }

    const { isOverLimit, durationMins, extraTime } = getBreakDuration(
      startTimeDate,
      breakRecord.breakConfig,
      endTimeDate,
    );

    const updatedBreak = await prisma.break.update({
      where: { id: breakRecord.id },
      data: {
        startTime: startTimeDate,
        endTime: endTimeDate,
        isOverLimit,
        durationMins,
        extraTime,
      },
    });

    if (!breakRecord.endTime) {
      sendWebhooks(
        "admin_ended_break",
        {
          employeeName: breakRecord.user.employeeName,
          employeeId: breakRecord.user.employeeId,
          breakName: breakRecord.breakConfig.label,
          breakDuration: durationMins,
          breakExtraTime: extraTime,
          breakOverLimit: isOverLimit,
          breakStartTime: breakRecord.startTime,
          breakEndTime: endTimeDate,
        },
        tenantId,
      );
    }

    return responses.updated(res, updatedBreak);
  } catch (error) {
    console.error("Error updating break:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const deleteBreak = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return responses.badRequest(res, "Tenant ID is required");
    const { breakId } = req.params;
    if (!breakId) return responses.badRequest(res, "Break ID is required");
    const result = await prisma.break.deleteMany({
      where: { id: Number(breakId), tenantId },
    });
    if (result.count === 0) return responses.notFound(res, "Break not found");
    return responses.deleted(res);
  } catch (error) {
    console.error("Error deleting break:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getBreakById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return responses.badRequest(res, "Tenant ID is required");
    const { breakId } = req.params;
    if (!breakId) return responses.badRequest(res, "Break ID is required");
    const breakRecord = await prisma.break.findFirst({
      where: { id: Number(breakId), tenantId },
      include: {
        breakConfig: true,
        user: {
          select: { id: true, employeeName: true, employeeId: true },
        },
        attendance: true,
      },
    });
    if (!breakRecord) return responses.notFound(res, "Break not found");
    return success(res, 200, "Break fetched successfully", {
      break: breakRecord,
    });
  } catch (error) {
    console.error("Error getting break by ID:", error);
    return responses.serverError(res, "Internal server error");
  }
};
