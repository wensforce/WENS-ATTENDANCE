const calculateLateCheckIns = (attendances) => {
  return attendances.filter((attendance) => attendance.status === "LATE")
    .length;
};

/** Parse attendance extraTime string ("HH:MM" or "-HH:MM") → total minutes */
const parseExtraTimeToMinutes = (extraTime) => {
  if (!extraTime) return 0;
  const timeString = String(extraTime).replace(/\s*hrs\s*$/i, "").trim();
  const isNegative = timeString.startsWith("-");
  const cleanTimeString = timeString.replace("-", "");
  const [hours, minutes] = cleanTimeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return (hours * 60 + minutes) * (isNegative ? -1 : 1);
};

/** Format minutes → "HH:MM" or "-HH:MM" */
const formatMinutesToExtraTime = (totalMinutes) => {
  const isNegative = totalMinutes < 0;
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return isNegative ? `-${timeString}` : timeString;
};

const calculateTotalExtraTime = (attendances) => {
  const totalMinutes = attendances.reduce(function (total, attendance) {
    if (attendance.extraTime) {
      return total + parseExtraTimeToMinutes(attendance.extraTime);
    }
    return total;
  }, 0);

  return formatMinutesToExtraTime(totalMinutes);
};

/**
 * Net overtime = attendance extra − break extra (both in minutes).
 * breakExtraMins is sum of Break.extraTime for the same period.
 */
const calculateNetExtraTime = (attendances, breakExtraMins = 0) => {
  const attendanceMins = attendances.reduce((total, attendance) => {
    if (attendance.extraTime) {
      return total + parseExtraTimeToMinutes(attendance.extraTime);
    }
    return total;
  }, 0);

  const breakMins = Math.max(0, Number(breakExtraMins) || 0);
  return formatMinutesToExtraTime(attendanceMins - breakMins);
};

export {
  calculateLateCheckIns,
  calculateTotalExtraTime,
  calculateNetExtraTime,
  parseExtraTimeToMinutes,
  formatMinutesToExtraTime,
};
