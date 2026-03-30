import prisma from "../../lib/prisma.js";
import {
  formatDateOnly,
  getEndOfDay,
  getStartOfDay,
} from "../utils/dateFormat.js";
import {
  calculateLateCheckIns,
  calculateTotalExtraTime,
} from "../utils/attendanceUtils.js";
import { responses, success } from "../utils/response.js";

export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    const [todayAttendance, monthAttendance, specialDuty] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          userId,
          checkInTime: {
            gte: getStartOfDay(),
            lte: getEndOfDay(),
          },
        },
      }),
      prisma.attendance.findMany({
        where: {
          userId,
          checkInTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: {
          status: true,
          extraTime: true,
        },
      }),
      userType === "BODYGUARD"
        ? prisma.specialAttendance.findFirst({
            where: {
              userId,
              date: {
                gte: getStartOfDay(),
                lte: getEndOfDay(),
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const lateCheckIns =
      calculateLateCheckIns(monthAttendance) + "/" + monthAttendance.length;
    const totalExtraTime = calculateTotalExtraTime(monthAttendance);

    return success(res, 200, "Dashboard data fetched successfully", {
      todayAttendance,
      lateCheckIns,
      totalExtraTime,
      specialDuty,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return responses.serverError(res, "Failed to fetch dashboard data");
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();
    const sixDaysAgo = new Date(new Date().setDate(now.getDate() - 6));
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // ── Single batch: all DB queries ──
    const [
      totalUsers,
      todayAttendance,
      weekAttendance,
      deptUsers,
      departments,
    ] = await Promise.all([
      prisma.user.count(),

      // Today's attendance with user info
      prisma.attendance.findMany({
        where: {
          checkInTime: { gte: startOfDay, lte: endOfDay },
        },
        select: {
          checkInTime: true,
          checkOutTime: true,
          status: true,
          user: {
            select: {
              employeeName: true,
              userType: true,
              departmentId: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // Last 7 days attendance
      prisma.attendance.findMany({
        where: {
          checkInTime: { gte: sixDaysAgo, lte: now },
        },
        select: { checkInTime: true },
      }),

      // Users grouped by department
      prisma.user.groupBy({
        by: ["departmentId"],
        _count: { id: true },
      }),

      // Fetch all departments for mapping
      prisma.department.findMany({
        select: { id: true, name: true },
      }),
    ]);

    // ── Stats from today's attendance (no extra queries needed) ──
    const presentToday = todayAttendance.filter(
      (a) => a.status === "PRESENT" || a.status === "WORK_FROM_HOME" || a.status === "HALF_DAY" || a.status === "SPECIAL_DUTY" || a.status === "OVERTIME",
    ).length;
    const lateToday = todayAttendance.filter((a) => a.status === "LATE").length;
    const absentToday = totalUsers - todayAttendance.length;

    // ── Pie Chart ──
    const pieData = [
      { status: "Present", count: presentToday },
      { status: "Late", count: lateToday },
      { status: "Absent", count: absentToday },
    ];

    // ── Bar Chart (last 7 days) ──
    const presentByDate = {};
    weekAttendance.forEach((r) => {
      const key = formatDateOnly(r.checkInTime);
      presentByDate[key] = (presentByDate[key] || 0) + 1;
    });

    const barData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - i));
      const present = presentByDate[formatDateOnly(date)] || 0;
      return {
        day: dayNames[date.getDay()],
        present,
        absent: totalUsers - present,
      };
    });

    // ── Department Table ──
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const presentByDept = {};
    todayAttendance.forEach((r) => {
      const deptId = r.user?.departmentId;
      presentByDept[deptId] = (presentByDept[deptId] || 0) + 1;
    });

    const deptRows = deptUsers
      .filter((d) => d.departmentId !== null)
      .map((d) => {
        const present = presentByDept[d.departmentId] || 0;
        const deptName = deptMap[d.departmentId];
        return {
          dept: deptName,
          present,
          absent: d._count.id - present,
        };
      });


     const attendanceTable = todayAttendance.map((a) => ({
        ...a,
        user: {
          ...a.user,
          department: a.user.department ? a.user.department.name : null,
        },
      }));

    // ── Response ──
    return success(res, 200, "Admin dashboard data fetched successfully", {
      totalUsers,
      todayAttendance: attendanceTable,
      presentToday: todayAttendance.length,
      lateCheckIns: lateToday,
      notCheckedIn: absentToday,
      pieData,
      barData,
      deptRows,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return responses.serverError(res, "Failed to fetch admin dashboard data");
  }
};
