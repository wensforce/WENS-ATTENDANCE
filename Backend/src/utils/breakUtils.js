export const getBreakDuration = (startTime, breakConfig, endTime) => {
  const durationMins = Math.max(
    0,
    Math.floor((endTime - startTime) / 60000),
  );
  const maxDurationMins = breakConfig.maxDurationMins ?? 0;
  const graceMins = breakConfig.graceMins ?? 0;
  const allowedMins = maxDurationMins + graceMins;

  // Minutes beyond allowed window (max + grace)
  const extraTime = Math.max(0, durationMins - allowedMins);
  const isOverLimit = extraTime > 0;

  return { durationMins, extraTime, isOverLimit };
};

// helper: keep existing date, replace only HH:mm
export const applyTimeOnDate = (existingDate, timeStr) => {
  if (!existingDate || !timeStr) return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Invalid time. Use HH:mm");
  }

  const updated = new Date(existingDate); // clone existing date
  updated.setHours(hours, minutes, 0, 0);
  return updated;
};
