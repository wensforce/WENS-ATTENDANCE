import prisma from "../../lib/prisma.js";
import { success, responses } from "../utils/response.js";
import sendNotification from "../services/sendNotification.js";
import { formatForDisplay } from "../utils/dateFormat.js";
import { sendWebhooks } from "../utils/webhook.js";
import { requireTenantId } from "../utils/tenant.js";

const subTypeInclude = {
  subType: {
    select: {
      name: true,
    },
  },
};

const adminLeaveInclude = {
  ...subTypeInclude,
  employees: {
    select: {
      employee: {
        select: {
          id: true,
          employeeName: true,
        },
      },
      leaveId: true,
    },
  },
};

const assertEmployeesAndSubType = async (tenantId, employeeIds, subTypeId) => {
  if (subTypeId) {
    const subType = await prisma.leaveSubType.findFirst({
      where: { id: Number(subTypeId), tenantId },
    });
    if (!subType) {
      return "Invalid leave type for this company";
    }
  }

  if (!employeeIds?.length) {
    return null;
  }

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      id: { in: employeeIds.map((id) => Number(id)) },
    },
    select: { id: true, deviceId: true, employeeId: true },
  });
  if (users.length !== employeeIds.length) {
    return "Invalid employees for this company";
  }
  return users;
};

//return today's leaves and holidays for the user
export const getLeavesAndHolidays = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    let today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the start of the day
    const leaves = await prisma.leaveAndHoliday.findMany({
      where: {
        tenantId,
        AND: [
          {
            employees: {
              some: {
                employeeId: req.user.userId,
              },
            },
          },
          {
            startDate: {
              lte: today, // Leave started on or before today
            },
            endDate: {
              gte: today, // Leave ends today or in the future
            },
          },
        ],
      },
      include: subTypeInclude,
    });
    success(res, 200, "Leaves and holidays fetched successfully", leaves);
  } catch (error) {
    console.error("Error fetching leaves and holidays:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getLeaveAndHolidayById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const leaveAndHoliday = await prisma.leaveAndHoliday.findFirst({
      where: {
        id: parseInt(id),
        tenantId,
        employees: {
          some: {
            employeeId: req.user.userId,
          },
        },
      },
      include: subTypeInclude,
    });
    if (!leaveAndHoliday) {
      return responses.notFound(res, "Leave or holiday not found");
    }
    success(res, 200, "Leave or holiday fetched successfully", leaveAndHoliday);
  } catch (error) {
    console.error("Error fetching leave or holiday by ID:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const createLeaveAndHoliday = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { status, startDate, endDate, reason, employeeIds, subTypeId } =
      req.body;

    const employeesOrError = await assertEmployeesAndSubType(
      tenantId,
      employeeIds,
      subTypeId,
    );
    if (typeof employeesOrError === "string") {
      return responses.badRequest(res, employeesOrError);
    }
    const deviceTokens = employeesOrError || [];

    const newLeaveAndHoliday = await prisma.leaveAndHoliday.create({
      data: {
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        subTypeId,
        tenantId,
        employees: {
          create: employeeIds.map((id) => ({
            employeeId: id,
          })),
        },
      },
    });

    if (deviceTokens.length > 0) {
      const tokens = deviceTokens.map((dt) => dt.deviceId).filter(Boolean);
      if (tokens.length > 0) {
        sendNotification(
          tokens,
          `A new ${status} has been created`,
          `From ${formatForDisplay(new Date(startDate))} to ${formatForDisplay(new Date(endDate))}. Reason: ${reason}`,
        );
      }
    }

    sendWebhooks(
      "leave_added",
      {
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        employeeIds: deviceTokens.map((dt) => dt.employeeId),
      },
      tenantId,
    );

    success(
      res,
      201,
      "Leave or holiday created successfully",
      newLeaveAndHoliday,
    );
  } catch (error) {
    console.error("Error creating leave or holiday:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const updateLeaveAndHoliday = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const { status, startDate, endDate, reason, employeeIds, subTypeId } =
      req.body;

    const existing = await prisma.leaveAndHoliday.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return responses.notFound(res, "Leave or holiday not found");
    }

    const employeesOrError = await assertEmployeesAndSubType(
      tenantId,
      employeeIds,
      subTypeId,
    );
    if (typeof employeesOrError === "string") {
      return responses.badRequest(res, employeesOrError);
    }

    const updatedLeaveAndHoliday = await prisma.leaveAndHoliday.update({
      where: { id: existing.id },
      data: {
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        subTypeId,
        employees: {
          deleteMany: {},
          create: employeeIds.map((empId) => ({
            employeeId: empId,
          })),
        },
      },
    });
    success(
      res,
      200,
      "Leave or holiday updated successfully",
      updatedLeaveAndHoliday,
    );
  } catch (error) {
    console.error("Error updating leave or holiday:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const deleteLeaveAndHoliday = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const leaveAndHoliday = await prisma.leaveAndHoliday.findFirst({
      where: { id: parseInt(id), tenantId },
    });

    if (!leaveAndHoliday) {
      return responses.notFound(res, "Leave or holiday not found");
    }

    await prisma.leaveEmployee.deleteMany({
      where: { leaveId: leaveAndHoliday.id },
    });

    await prisma.leaveAndHoliday.delete({
      where: { id: leaveAndHoliday.id },
    });
    success(res, 204, "Leave or holiday deleted successfully", null);
  } catch (error) {
    console.error("Error deleting leave or holiday:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getLeavesAndHolidaysByDate = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { date, month, year, startDate, endDate } = req.query;
    const assignedToMe = {
      tenantId,
      employees: {
        some: {
          employeeId: req.user.userId,
        },
      },
    };

    let leavesAndHolidays;
    if (date) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          ...assignedToMe,
          startDate: {
            lte: new Date(date),
          },
          endDate: {
            gte: new Date(date),
          },
        },
        include: subTypeInclude,
      });
    } else if (month && year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          ...assignedToMe,
          startDate: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${year}-${parseInt(month) + 1}-01`),
          },
        },
        include: subTypeInclude,
      });
    } else if (year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          ...assignedToMe,
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
        include: subTypeInclude,
      });
    } else if (startDate && endDate) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: assignedToMe,
        include: subTypeInclude,
      });
    } else {
      return responses.badRequest(
        res,
        "Please provide a valid query parameter",
      );
    }

    success(
      res,
      200,
      "Leaves and holidays fetched successfully",
      leavesAndHolidays,
    );
  } catch (error) {
    console.error("Error fetching leaves and holidays by date:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getAllLeavesAndHolidays = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { date, month, year, startDate, endDate } = req.query;
    let leavesAndHolidays;
    if (date) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          tenantId,
          startDate: {
            lte: new Date(date),
          },
          endDate: {
            gte: new Date(date),
          },
        },
        include: adminLeaveInclude,
      });
    } else if (month && year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          tenantId,
          startDate: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${year}-${parseInt(month) + 1}-01`),
          },
        },
        include: adminLeaveInclude,
      });
    } else if (year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          tenantId,
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
        include: adminLeaveInclude,
      });
    } else if (startDate && endDate) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          tenantId,
          startDate: {
            gte: new Date(startDate),
          },
          endDate: {
            lte: new Date(endDate),
          },
        },
        include: adminLeaveInclude,
      });
    } else {
      return responses.badRequest(
        res,
        "Please provide a valid query parameter",
      );
    }

    success(
      res,
      200,
      "Leaves and holidays fetched successfully",
      leavesAndHolidays,
    );
  } catch (error) {
    console.error("Error fetching all leaves and holidays:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getUserAllLeaves = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { userId } = req.params;
    const { month, year } = req.query;
    if (!userId) {
      return responses.badRequest(res, "User ID is required");
    }
    if (!month || !year) {
      return responses.badRequest(res, "Month and year are required");
    }

    const employee = await prisma.user.findFirst({
      where: { id: parseInt(userId), tenantId },
      select: { id: true },
    });
    if (!employee) {
      return responses.notFound(res, "User not found");
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const rangeStart = new Date(yearNum, monthNum - 1, 1);
    const rangeEnd = new Date(yearNum, monthNum, 1);

    // Include any leave overlapping the month, not only those starting in it
    const leaves = await prisma.leaveAndHoliday.findMany({
      where: {
        tenantId,
        employees: {
          some: {
            employeeId: employee.id,
          },
        },
        startDate: { lt: rangeEnd },
        endDate: { gte: rangeStart },
      },
      include: subTypeInclude,
      orderBy: { startDate: "asc" },
    });
    success(res, 200, "Leaves fetched successfully", leaves);
  } catch (error) {
    console.error("Error fetching user all leaves:", error);
    responses.serverError(res, "Internal server error");
  }
};
