import prisma from "../../lib/prisma.js";
import { success, responses } from "../utils/response.js";

//return today's leaves and holidays for the user
export const getLeavesAndHolidays = async (req, res) => {
  try {
    let today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the start of the day
    const leaves = await prisma.leaveAndHoliday.findMany({
      where: {
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
    });
    success(res, 200, "Leaves and holidays fetched successfully", leaves);
  } catch (error) {
    console.error("Error fetching leaves and holidays:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getLeaveAndHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveAndHoliday = await prisma.leaveAndHoliday.findFirst({
      where: {
        id: parseInt(id),
        employees: {
          some: {
            employeeId: req.user.userId,
          },
        },
      },
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
    const { type, startDate, endDate, reason, employeeIds } = req.body;
    const newLeaveAndHoliday = await prisma.leaveAndHoliday.create({
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        employees: {
          create: employeeIds.map((id) => ({
            employeeId: id,
          })),
        },
      },
    });

    // send notification to all employees affected by the new leave or holiday, withput blocking the response

    if (employeeIds.length > 0) {
      // fetch device tokens of the affected employees
      const deviceTokens = await prisma.user.findMany({
        where: {
          id: {
            in: employeeIds,
          },
        },
        select: {
          deviceId: true,
        },
      });
      // send notifications to the affected employees
      const tokens = deviceTokens.map((dt) => dt.deviceToken).filter(Boolean);
      if (tokens.length > 0) {
        sendNotification(
          tokens,
          `A new ${type} has been created`,
          `From ${startDate} to ${endDate}. Reason: ${reason}`,
        );
      }
    }

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
    const { id } = req.params;
    const { type, startDate, endDate, reason, employeeIds } = req.body;
    const updatedLeaveAndHoliday = await prisma.leaveAndHoliday.update({
      where: { id: parseInt(id) },
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        employees: {
          deleteMany: {},
          create: employeeIds.map((id) => ({
            employeeId: id,
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
    const { id } = req.params;
    const leaveAndHoliday = await prisma.leaveAndHoliday.findUnique({
      where: { id: parseInt(id) },
    });

    if (!leaveAndHoliday) {
      return responses.notFound(res, "Leave or holiday not found");
    }

    await prisma.leaveEmployee.deleteMany({
      where: { leaveId: parseInt(id) },
    });

    await prisma.leaveAndHoliday.delete({
      where: { id: parseInt(id) },
    });
    success(res, 204, "Leave or holiday deleted successfully", null);
  } catch (error) {
    console.error("Error deleting leave or holiday:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getLeavesAndHolidaysByDate = async (req, res) => {
  try {
    const { date, month, year, startDate, endDate } = req.query;
    let leavesAndHolidays;
    if (date) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          employees: {
            some: {
              employeeId: req.user.userId,
            },
          },
          startDate: {
            lte: new Date(date),
          },
          endDate: {
            gte: new Date(date),
          },
        },
      });
    } else if (month && year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          employees: {
            some: {
              employeeId: req.user.userId,
            },
          },
          startDate: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${year}-${parseInt(month) + 1}-01`),
          },
        },
      });
    } else if (year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          employees: {
            some: {
              employeeId: req.user.userId,
            },
          },
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
      });
    } else if (startDate && endDate) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          employees: {
            some: {
              employeeId: req.user.userId,
            },
          },
        },
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
    const { date, month, year, startDate, endDate } = req.query;
    let leavesAndHolidays;
    if (date) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          startDate: {
            lte: new Date(date),
          },
          endDate: {
            gte: new Date(date),
          },
        },
        include: {
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
        },
      });
    } else if (month && year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          startDate: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${year}-${parseInt(month) + 1}-01`),
          },
        },
        include: {
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
        },
      });
    } else if (year) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
        include: {
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
        },
      });
    } else if (startDate && endDate) {
      leavesAndHolidays = await prisma.leaveAndHoliday.findMany({
        where: {
          startDate: {
            gte: new Date(startDate),
          },
          endDate: {
            lte: new Date(endDate),
          },
        },
        include: {
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
        },
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
