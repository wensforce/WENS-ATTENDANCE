import prisma from "../../lib/prisma.js";
import { success, error } from "../utils/response.js";
import { calculateTotalExtraTime } from "../utils/attendanceUtils.js";
import {
  getWorkingDaysInMonth,
  sumTotalWorkHours,
  buildMonthlyUserReportRows,
} from "../utils/reportUtils.js";
import { getStartOfDay, getEndOfDay } from "../utils/dateFormat.js";

/**
 * GET /report/monthly-user-report?month=3&year=2026&page=1&limit=10&search=John
 *
 * Returns a paginated list of all employees with their monthly attendance summary:
 *   - employeeName, employeeId
 *   - totalWorkingHours   (sum of actual worked hours)
 *   - overTimeUndertime   (sum of extraTime; negative value = undertime)
 *   - workingDays         (e.g. "22/25" → attended / totalWorkingDaysInMonth)
 */

export const getMonthlyReport = async (req, res) => {
  try {
    let { month, year, page = 1, limit = 10, search, userType } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Default to current month/year if not provided
    const now = new Date();
    month = month ? parseInt(month) : now.getMonth() + 1;
    year = year ? parseInt(year) : now.getFullYear();

    if (month < 1 || month > 12) {
      return error(res, 400, "Invalid month. Must be between 1 and 12.");
    }

    // Month date range
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Build user filter
    const userWhere = {};
    if (search) {
      userWhere.OR = [
        { employeeName: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }
    if (userType) {
      userWhere.userType = userType;
    }

    // Fetch total count + paginated users + all leave/holiday data for the month in parallel
    const [totalCount, users, allLeaveAndHolidays, allLeaveEmployees] =
      await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.user.findMany({
          where: userWhere,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { employeeName: "asc" },
          select: {
            id: true,
            employeeName: true,
            employeeId: true,
            shift: true,
            weekendOff: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            attendances: {
              where: {
                date: { gte: startDate, lte: endDate },
              },
              select: {
                checkInTime: true,
                checkOutTime: true,
                extraTime: true,
                status: true,
              },
            },
          },
        }),
        // Fetch all LeaveAndHoliday records for the current month
        prisma.leaveAndHoliday.findMany({
          where: {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        }),
        // Fetch all LeaveEmployee records mapped to leave/holidays in the current month
        prisma.leaveEmployee.findMany({
          where: {
            leave: {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          },
          select: {
            id: true,
            employeeId: true,
            leaveId: true,
          },
        }),
      ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Map LeaveEmployee records by employeeId for quick lookup
    const leaveMapByEmployee = {};
    allLeaveEmployees.forEach((le) => {
      if (!leaveMapByEmployee[le.employeeId]) {
        leaveMapByEmployee[le.employeeId] = [];
      }
      leaveMapByEmployee[le.employeeId].push(le.leaveId);
    });

    const report = users.map((user) => {
      const attendances = user.attendances;

      let weekendOff = user.weekendOff;
      if (typeof weekendOff === "string") {
        try {
          weekendOff = JSON.parse(weekendOff);
        } catch {
          weekendOff = [];
        }
      }
      if (!Array.isArray(weekendOff)) weekendOff = [];

      // Get user-specific leave/holiday records
      const userLeaveIds = leaveMapByEmployee[user.id] || [];
      const userLeaveAndHolidays = allLeaveAndHolidays.filter((lh) =>
        userLeaveIds.includes(lh.id),
      );

      const totalWorkingDays = getWorkingDaysInMonth(
        year,
        month,
        weekendOff,
        userLeaveAndHolidays,
      );
      const attendedDays = attendances.filter(
        (a) => a.checkInTime !== null,
      ).length;

      const lateCheckin = attendances.filter((a) => a.status === "LATE").length;
      const totalWorkingHours = sumTotalWorkHours(attendances);
      const overTimeUndertime = calculateTotalExtraTime(attendances);

      return {
        employeeName: user.employeeName ?? "-",
        employeeId: user.employeeId ?? "-",
        department: user.department?.name ?? "-",
        designation: user.designation?.name ?? "-",
        lateCheckin,
        totalWorkingHours,
        overTimeUndertime,
        workingDays: `${attendedDays}/${totalWorkingDays}`,
      };
    });

    return success(res, 200, "Monthly user report fetched successfully", {
      month,
      year,
      report,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Monthly user report error:", err);
    return error(res, 500, "Internal server error");
  }
};


export const getMonthlyReportByUserId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();

    if (month < 1 || month > 12) {
      return error(res, 400, "Invalid month. Must be between 1 and 12.");
    }

    const startDate = getStartOfDay(new Date(year, month - 1, 1));
    const endDate = getEndOfDay(new Date(year, month, 0));
    const monthEnd = getStartOfDay(new Date(year, month, 0));

    // 1) Fetch all needed data
    const [user, attendances, leaveEmployees, oldestAttendance] =
      await Promise.all([
        prisma.user.findUnique({
          where: { employeeId },
          select: {
            id: true,
            employeeName: true,
            employeeId: true,
            weekendOff: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        }),
        prisma.attendance.findMany({
          where: {
            user: { employeeId },
            date: { gte: startDate, lte: endDate },
          },
          select: {
            date: true,
            checkInTime: true,
            checkOutTime: true,
            extraTime: true,
            status: true,
          },
          orderBy: { date: "asc" },
        }),
        prisma.leaveEmployee.findMany({
          where: {
            employee: { employeeId },
            leave: {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          },
          include: { leave: true },
        }),
        prisma.attendance.findFirst({
          where: { user: { employeeId } },
          orderBy: { date: "asc" },
          select: { date: true },
        }),
      ]);

    if (!user) {
      return error(res, 404, "User not found");
    }

    // 2) Build daily rows
    const rows = buildMonthlyUserReportRows({
      startDate,
      monthEnd,
      attendances,
      leaveEmployees,
      weekendOff: user.weekendOff,
      oldestAttendanceDate: oldestAttendance
        ? getStartOfDay(oldestAttendance.date)
        : null,
    });

    // 3) Return response
    return success(res, 200, "Monthly user report fetched successfully", {
      employeeName: user.employeeName ?? "-",
      employeeId: user.employeeId ?? "-",
      department: user.department?.name ?? "-",
      designation: user.designation?.name ?? "-",
      month,
      year,
      totalExtraTime: calculateTotalExtraTime(attendances),
      rows,
    });
  } catch (err) {
    console.error("Monthly user report by userId error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const exportMonthlyReport = async (req, res) => {
  try {
    let { month, year, search, userType } = req.query;

    // Default to current month/year if not provided
    const now = new Date();
    month = month ? parseInt(month) : now.getMonth() + 1;
    year = year ? parseInt(year) : now.getFullYear();

    if (month < 1 || month > 12) {
      return error(res, 400, "Invalid month. Must be between 1 and 12.");
    }

    // Month date range
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Build user filter
    const userWhere = {};
    if (search) {
      userWhere.OR = [
        { employeeName: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }
    if (userType) {
      userWhere.userType = userType;
    }

    // Fetch ALL users + all leave/holiday data for the month in parallel
    const [users, allLeaveAndHolidays, allLeaveEmployees] = await Promise.all(
      [
        prisma.user.findMany({
          where: userWhere,
          orderBy: { employeeName: "asc" },
          select: {
            id: true,
            employeeName: true,
            employeeId: true,
            shift: true,
            weekendOff: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            attendances: {
              where: {
                date: { gte: startDate, lte: endDate },
              },
              select: {
                checkInTime: true,
                checkOutTime: true,
                extraTime: true,
                status: true,
              },
            },
          },
        }),
        // Fetch all LeaveAndHoliday records for the current month
        prisma.leaveAndHoliday.findMany({
          where: {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        }),
        // Fetch all LeaveEmployee records mapped to leave/holidays in the current month
        prisma.leaveEmployee.findMany({
          where: {
            leave: {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          },
          select: {
            id: true,
            employeeId: true,
            leaveId: true,
          },
        }),
      ]
    );

    // Map LeaveEmployee records by employeeId for quick lookup
    const leaveMapByEmployee = {};
    allLeaveEmployees.forEach((le) => {
      if (!leaveMapByEmployee[le.employeeId]) {
        leaveMapByEmployee[le.employeeId] = [];
      }
      leaveMapByEmployee[le.employeeId].push(le.leaveId);
    });

    const report = users.map((user) => {
      const attendances = user.attendances;

      let weekendOff = user.weekendOff;
      if (typeof weekendOff === "string") {
        try {
          weekendOff = JSON.parse(weekendOff);
        } catch {
          weekendOff = [];
        }
      }
      if (!Array.isArray(weekendOff)) weekendOff = [];

      // Get user-specific leave/holiday records
      const userLeaveIds = leaveMapByEmployee[user.id] || [];
      const userLeaveAndHolidays = allLeaveAndHolidays.filter((lh) =>
        userLeaveIds.includes(lh.id)
      );

      const totalWorkingDays = getWorkingDaysInMonth(
        year,
        month,
        weekendOff,
        userLeaveAndHolidays
      );
      const attendedDays = attendances.filter(
        (a) => a.checkInTime !== null
      ).length;

      const lateCheckin = attendances.filter((a) => a.status === "LATE").length;
      const totalWorkingHours = sumTotalWorkHours(attendances);
      const overTimeUndertime = calculateTotalExtraTime(attendances);

      return {
        employeeName: user.employeeName ?? "-",
        employeeId: user.employeeId ?? "-",
        department: user.department?.name ?? "-",
        designation: user.designation?.name ?? "-",
        lateCheckin,
        totalWorkingHours,
        overTimeUndertime,
        workingDays: `${attendedDays}/${totalWorkingDays}`,
      };
    });

    return success(res, 200, "Monthly user report exported successfully", {
      month,
      year,
      totalRecords: report.length,
      report,
    });
  } catch (err) {
    console.error("Export monthly user report error:", err);
    return error(res, 500, "Internal server error");
  }
};
