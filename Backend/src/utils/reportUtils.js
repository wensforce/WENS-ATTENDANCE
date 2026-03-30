import { isTodayWeekOff } from "./dateFormat.js";

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

  console.log(daysInMonth, weekendDays, leaveDays);
  
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


export { getWorkingDaysInMonth, sumTotalWorkHours };
