import {
  isTodayWeekOff,
  formatDateOnly,
  getStartOfDay,
  calculateWorkHours,
} from "./dateFormat.js";

/**
 * Calculates the number of working days in a month for a given user.
 * Working days = Total days - Weekend days - Leave/Holiday days
 */
const getWorkingDaysInMonth = (year, month, weekendOff, holidays) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let weekendDays = 0;
  let leaveDays = 0;

  // Step 1: Count weekend days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (isTodayWeekOff(weekendOff, dayOfWeek)) {
      weekendDays++;
    }
  }

  // Step 2: Count total leave/holiday days that fall in this month
  holidays.forEach((h) => {
    const leaveStart = new Date(h.startDate);
    const leaveEnd = new Date(h.endDate);

    // Normalize to midnight
    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(0, 0, 0, 0);

    // Month boundaries
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 0, 0, 0, 0);

    // Find overlapping days between leave and current month
    const overlapStart = leaveStart > monthStart ? leaveStart : monthStart;
    const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;

    if (overlapStart <= overlapEnd) {
      // Calculate days in the overlap range
      const daysInLeave =
        Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
      leaveDays += daysInLeave;
    }
  });

  // Step 3: Calculate working days
  const baseWorkingDays = daysInMonth - weekendDays;

  return Math.max(0, baseWorkingDays - leaveDays);
};

/**
 * Sums total work hours (checkIn → checkOut) across all attendance records.
 * Returns a string like "HH:MM hrs".
 */
const sumTotalWorkHours = (attendances) => {
  let totalMinutes = 0;
  for (const a of attendances) {
    if (a.checkInTime && a.checkOutTime) {
      const diffMs = new Date(a.checkOutTime) - new Date(a.checkInTime);
      totalMinutes += Math.floor(diffMs / (1000 * 60));
    }
  }
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes} hrs`;
};

const toDateKey = (date) => formatDateOnly(new Date(date));

const formatClock = (time) =>
  time
    ? new Date(time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "-";

/** Build one report row for an attendance day */
const buildAttendanceRow = (date, attendance) => {
  let workingHours = "00:00";
  if (attendance.checkInTime && attendance.checkOutTime) {
    workingHours = calculateWorkHours(
      attendance.checkInTime,
      attendance.checkOutTime,
    );
  }

  return {
    date: toDateKey(date),
    day: date.toLocaleDateString("en-US", { weekday: "long" }),
    checkin: formatClock(attendance.checkInTime),
    checkout: formatClock(attendance.checkOutTime),
    workingHours,
    overTimeUndertime: attendance.extraTime ?? "-",
    status: attendance.status ?? "PRESENT",
  };
};

/** Build one report row for leave / holiday / weekoff / absent */
const buildStatusRow = (date, status) => ({
  date: toDateKey(date),
  day: date.toLocaleDateString("en-US", { weekday: "long" }),
  checkin: "-",
  checkout: "-",
  workingHours: "-",
  overTimeUndertime: "-",
  status,
});

/**
 * Expand leave records into a map:
 *   "YYYY-MM-DD" -> "LEAVE" | "HOLIDAY"
 */
const buildLeaveDateMap = (leaveEmployees) => {
  const leaveDateMap = new Map();

  for (const item of leaveEmployees) {
    const status = item.leave.status === "HOLIDAY" ? "HOLIDAY" : "LEAVE";
    const cursor = getStartOfDay(item.leave.startDate);
    const end = getStartOfDay(item.leave.endDate);

    while (cursor <= end) {
      const key = toDateKey(cursor);
      if (!leaveDateMap.has(key) || status === "HOLIDAY") {
        leaveDateMap.set(key, status);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return leaveDateMap;
};

/**
 * Decide status for a day with no attendance.
 * Priority: LEAVE/HOLIDAY → WEEKOFF → ABSENT
 * Returns null if the day should be skipped (future / before joining).
 */
const getMissingDayStatus = ({
  date,
  leaveStatus,
  weekendOff,
  today,
  todayKey,
  oldestAttendanceDate,
}) => {
  if (leaveStatus) return leaveStatus;

  const isPastOrToday = date <= today;
  const isAfterJoining =
    !oldestAttendanceDate || date >= oldestAttendanceDate;

  if (!isPastOrToday || !isAfterJoining) return null;

  if (isTodayWeekOff(weekendOff, date.getDay())) return "WEEKOFF";

  // Don't mark today as absent when there is no record yet
  if (toDateKey(date) === todayKey) return null;

  return "ABSENT";
};

/**
 * Build full-month report rows.
 * Flow per day:
 *   1. Has attendance? → attendance row
 *   2. Else leave/holiday/weekoff/absent? → status row
 *   3. Else skip (future day / before first attendance)
 */
const buildMonthlyUserReportRows = ({
  startDate,
  monthEnd,
  attendances,
  leaveEmployees,
  weekendOff,
  oldestAttendanceDate,
}) => {
  const attendanceMap = new Map(
    attendances.map((a) => [toDateKey(a.date), a]),
  );
  const leaveDateMap = buildLeaveDateMap(leaveEmployees);

  const today = getStartOfDay(new Date());
  const todayKey = toDateKey(today);
  const rows = [];
  const cursor = new Date(startDate);

  while (cursor <= monthEnd) {
    const key = toDateKey(cursor);
    const attendance = attendanceMap.get(key);

    if (attendance) {
      rows.push(buildAttendanceRow(cursor, attendance));
    } else {
      const status = getMissingDayStatus({
        date: cursor,
        leaveStatus: leaveDateMap.get(key),
        weekendOff,
        today,
        todayKey,
        oldestAttendanceDate,
      });

      if (status) {
        rows.push(buildStatusRow(cursor, status));
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
};

export {
  getWorkingDaysInMonth,
  sumTotalWorkHours,
  buildMonthlyUserReportRows,
};
