/**
 * Standardized Date Format Utility
 * Format: YYYY-MM-DD (ISO 8601 format for easy comparison and database storage)
 * Time Format: HH:mm:ss (24-hour format)
 */

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Date in format YYYY-MM-DD
 */
export const getToday = () => {
  const today = new Date();
  return formatDateOnly(today);
};

/**
 * Get current date and time in ISO format
 * @returns {string} DateTime in format YYYY-MM-DDTHH:mm:ss (ISO 8601)
 */
export const getNow = () => {
  return new Date().toISOString().slice(0, 19); // Returns YYYY-MM-DDTHH:mm:ss
};

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date YYYY-MM-DD
 */

export const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format a date to YYYY-MM-DD HH:mm:ss
 * @param {Date} date - Date object to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (date) => {
  const dateStr = formatDateOnly(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format a date to ISO format YYYY-MM-DDTHH:mm:ss
 * @param {Date} date - Date object to format
 * @returns {string} ISO formatted datetime
 */
export const formatISO = (date) => {
  const dateStr = formatDateOnly(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${dateStr}T${hours}:${minutes}:${seconds}`;
};

/**
 * Get start of day (00:00:00) for a given date
 * @param {Date} date - Date object (defaults to today)
 * @returns {Date} Start of day
 */
export const getStartOfDay = (date = new Date()) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Get end of day (23:59:59.999) for a given date
 * @param {Date} date - Date object (defaults to today)
 * @returns {Date} End of day
 */
export const getEndOfDay = (date = new Date()) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Compare two dates (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const formatted1 = formatDateOnly(d1);
  const formatted2 = formatDateOnly(d2);

  if (formatted1 < formatted2) return -1;
  if (formatted1 > formatted2) return 1;
  return 0;
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  return formatDateOnly(date1) === formatDateOnly(date2);
};

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Add days to a date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Get difference between two dates in days
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in days
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = getStartOfDay(date1);
  const d2 = getStartOfDay(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Format a date for display (e.g., "17-06-2024")
 * @param {Date} date - Date object
 * @returns {string} Display format DD-MM-YYYY
 */
export const formatForDisplay = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Get attendance status based on shift timings
 * @param {string} shift - Shift timings in format "HH:MM AM/PM - HH:MM AM/PM"
 * @returns {string} Attendance status ("PRESENT" or "LATE")
 */

const parseShiftTime = (timeStr) => {
  // Extract hours and minutes from time string
  const timeParts = timeStr.match(/(\d+):(\d+)/);
  if (!timeParts) return { hours: 0, minutes: 0 };

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);

  // Check if it's 12-hour format (has AM/PM)
  const isPM = timeStr.toLowerCase().includes("pm");
  const isAM = timeStr.toLowerCase().includes("am");

  if (isPM || isAM) {
    // Handle 12-hour format
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }
  // Otherwise assume 24-hour format - use hours as-is

  return { hours, minutes };
};

export const isTodayWeekOff = (weekOff, day) => {
  const today = day !== undefined ? day : new Date().getDay();
  if (typeof weekOff === "string") {
    weekOff = JSON.parse(weekOff);
  }
  return weekOff ? weekOff.includes(today) : false;
};

export const getAttendanceStatus = (shift) => {
  // shift is in format "9:00 AM - 5:00 PM", we need to extract start time and compare with current time
  const [startShift, endShift] = shift.split(" - ");

  const shiftStart = parseShiftTime(startShift);

  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Calculate shift start time in minutes
  const shiftStartInMinutes = shiftStart.hours * 60 + shiftStart.minutes;

  // Add 15-minute grace period
  const graceDeadlineInMinutes = shiftStartInMinutes + 15;

  // Calculate current time in minutes
  const currentTimeInMinutes = currentHour * 60 + currentMinutes;

  // Check if check-in time exceeds the grace deadline
  if (currentTimeInMinutes > graceDeadlineInMinutes) {
    return "LATE";
  }
  return "PRESENT";
};

export const extraTime = (
  checkInTime,
  checkOutTime,
  shift,
  isHoliday,
  weekOff,
  isHalfDay,
  day
) => {
  const checkInDate = new Date(checkInTime);
  const checkOutDate = new Date(checkOutTime);

  // Calculate actual time difference in milliseconds
  const diffTime = checkOutDate - checkInDate;

  // if half day, then use shift time / 2 as shift time for overtime calculation

  const shiftTimeInMinutes = getUserShiftTimeInMinutes(shift);
  const effectiveShiftTimeInMinutes = isHalfDay
    ? Math.floor(shiftTimeInMinutes / 2)
    : shiftTimeInMinutes;

  // Convert to total minutes
  const workedMinutes = Math.floor(diffTime / (1000 * 60));
  
  
  let extraMinutes = 0;
  if (isHoliday || isTodayWeekOff(weekOff,day)) {
    extraMinutes = workedMinutes;
  } else {
    extraMinutes = workedMinutes - effectiveShiftTimeInMinutes;
  }
  const hours = String(Math.floor(extraMinutes / 60)).padStart(2, "0");
  const minutes = String(Math.abs(extraMinutes % 60)).padStart(2, "0");

  return `${hours}:${minutes} hrs`;
};

export const getUserShiftTimeInMinutes = (shift) => {
  // shift is in format "13:53 - 15:54", we need to extract end time and convert to minutes
  const [startShift, endShift] = shift.split(" - ");
  const shiftStart = parseShiftTime(startShift);
  const shiftEnd = parseShiftTime(endShift);
  const shiftStartInMinutes = shiftStart.hours * 60 + shiftStart.minutes;
  const shiftEndInMinutes = shiftEnd.hours * 60 + shiftEnd.minutes;
  return shiftEndInMinutes - shiftStartInMinutes;
};

/**
 * Calculate work hours between check-in and check-out times
 * Handles multi-day shifts correctly (e.g., 52 hours across multiple days)
 * @param {Date} checkInTime - Check-in time
 * @param {Date} checkOutTime - Check-out time
 * @returns {string} Work hours in format "HH:mm" (e.g., "08:30", "52:15")
 */
export const calculateWorkHours = (checkInTime, checkOutTime) => {
  const checkInDate = new Date(checkInTime);
  const checkOutDate = new Date(checkOutTime);

  // Calculate total milliseconds difference
  const diffTime = checkOutDate - checkInDate;

  // Convert to total minutes, then to hours and minutes
  const totalMinutes = Math.abs(Math.floor(diffTime / (1000 * 60)));
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return `${hours}:${minutes} hrs`;
};
