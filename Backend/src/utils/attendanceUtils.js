const calculateLateCheckIns = (attendances) => {
  return attendances.filter((attendance) => attendance.status === "LATE")
    .length;
};

const calculateTotalExtraTime = (attendances) => {
  
  const totalMinutes = attendances.reduce(function (total, attendance) {
    if (attendance.extraTime) {
      // Remove " hrs" suffix and trim, then parse the time string
      const timeString = attendance.extraTime.replace(/\s*hrs\s*$/i, "").trim();
      
      // Check if it's negative (undertime)
      const isNegative = timeString.startsWith("-");
      
      // Remove the minus sign if present for parsing
      const cleanTimeString = timeString.replace("-", "");
      
      const [hours, minutes] = cleanTimeString.split(":").map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn("Invalid extraTime format:", attendance.extraTime);
        return total;
      }
      
      // Calculate minutes, apply negative if needed
      const minutesToAdd = (hours * 60 + minutes) * (isNegative ? -1 : 1);
      
      return total + minutesToAdd;
    }
    return total;
  }, 0);


  // Handle negative total (undertime)
  const isNegative = totalMinutes < 0;
  const absTotalMinutes = Math.abs(totalMinutes);
  
  const hours = Math.floor(absTotalMinutes / 60);
  const minutes = absTotalMinutes % 60;
  
  const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  
  return isNegative ? `-${timeString}` : timeString;
};

export { calculateLateCheckIns, calculateTotalExtraTime };
