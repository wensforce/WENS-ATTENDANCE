// convert this format "00:00" HH:MM to "0hrs 00min"
export const formatOverTime = (data) => {
  const [hours, minutes] = data.split(":").map(Number);
  return `${hours}hrs ${minutes}min`;
};

// convert this format "2026-03-09T09:09:05.152Z" to "5:00pm"
export const formatAttendanceTime = (data) => {
  if (!data) return "N/A";
  const date = new Date(data);
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// convert this format "2026-03-09T09:09:05.152Z" to "March 9, 2026"
export const formatAttendanceDate = (data) => {
  const date = new Date(data);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// parse location JSON and extract address
export const parseLocationAddress = (locationString) => {
  if (!locationString) return "N/A";
  try {
    const parsed = JSON.parse(locationString);
    return parsed.address || "N/A";
  } catch {
    return "N/A";
  }
};
