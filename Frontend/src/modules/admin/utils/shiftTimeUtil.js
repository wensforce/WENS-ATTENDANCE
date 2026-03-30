
/**
 * Parses shift time string in format "HH:MM - HH:MM" into an object
 * @param {string} raw - Raw shift time string (e.g., "10:00 - 19:00")
 * @returns {object} Object with startTime and endTime properties
 */
export const parseShiftTime = (raw) => {
  if (!raw) return { startTime: "", endTime: "" };
  const match = raw.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (match) {
    return { startTime: match[1], endTime: match[2] };
  }
  return { startTime: "", endTime: "" };
};

/**
 * Formats start and end time into "HH:MM - HH:MM" format
 * @param {string} startTime - Start time (e.g., "10:00")
 * @param {string} endTime - End time (e.g., "19:00")
 * @returns {string} Formatted shift time string
 */
export const formatShiftTime = (startTime, endTime) => {
  if (!startTime || !endTime) return "";
  return `${startTime} - ${endTime}`;
};
