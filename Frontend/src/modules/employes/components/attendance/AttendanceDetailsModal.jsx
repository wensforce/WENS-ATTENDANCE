import React, { useState } from "react";
import { X, Clock, Hourglass, Info } from "lucide-react";
import {
  formatAttendanceTime,
  formatAttendanceDate,
  parseLocationAddress,
  formatOverTime,
} from "../../../../shared/utils/dashboard.utils";
const AttendanceDetailsModal = ({ isOpen, onClose, attendanceData, specialDayData, loading }) => {
  const [activeTab, setActiveTab] = useState("attendance");

  // Map status to CSS custom property names
  const getStatusColorVars = (status) => {
    const colorMap = {
      PRESENT: "present",
      ABSENT: "absent",
      HALF_DAY: "halfday",
      WORK_FROM_HOME: "wfh",
      LATE: "late",
      WEEKOFF: "weekoff",
      HOLIDAY: "holiday",
      PRESENT_SPECIAL: "special",
      OVERTIME: "overtime",
      "SPECIAL DUTY": "special",
    };
    return colorMap[status] || "absent";
  };

  if (!isOpen) return null;

  // Helper function to calculate logged hours
  const calculateLoggedHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "N/A";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(diffHours).padStart(2, "0")}:${String(diffMinutes).padStart(2, "0")}`;
  };

  const isSpecialTab = activeTab === "special" && specialDayData;

  const data = isSpecialTab
    ? {
        status: "SPECIAL DUTY",
        date: formatAttendanceDate(specialDayData?.date),
        timeIn: formatAttendanceTime(specialDayData?.checkInTime),
        timeOut: formatAttendanceTime(specialDayData?.checkOutTime),
        timeInLocation: parseLocationAddress(specialDayData?.checkInLocation),
        timeOutLocation: parseLocationAddress(specialDayData?.checkOutLocation),
        loggedHours: specialDayData?.workHours || "N/A",
        checkInImageUrl: specialDayData?.photos?.[specialDayData?.checkInPhoto] || null,
        checkOutImageUrl: specialDayData?.photos?.[specialDayData?.checkOutPhoto] || null,
        undertime: null,
      }
    : {
        status: attendanceData?.status || "N/A",
        date: formatAttendanceDate(attendanceData?.date),
        timeIn: formatAttendanceTime(attendanceData?.checkInTime),
        timeOut: formatAttendanceTime(attendanceData?.checkOutTime),
        timeInLocation: parseLocationAddress(attendanceData?.checkInLocation),
        timeOutLocation: parseLocationAddress(attendanceData?.checkOutLocation),
        loggedHours: calculateLoggedHours(attendanceData?.checkInTime, attendanceData?.checkOutTime),
        checkInImageUrl: attendanceData?.photos?.[attendanceData?.checkInPhoto] || null,
        checkOutImageUrl: attendanceData?.photos?.[attendanceData?.checkOutPhoto] || null,
        undertime: attendanceData?.extraTime || "N/A",
      };
  


  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-white">Loading...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <h2 className="text-base font-semibold text-text-primary">
            Attendance
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        {/* Tab Toggle — only shown when specialDayData exists */}
        {specialDayData && (
          <div className="flex mx-5 mt-3 rounded-lg bg-background p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "attendance"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("special")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "special"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Special Duty
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh] px-5 py-4">
          {/* Status and Date */}
          <div className="mb-4 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: `var(--color-${getStatusColorVars(data.status)}-dot)`,
                }}
              />
              <span
                className="text-xs font-semibold"
              >
                {data.status}
              </span>
            </div>
            <p className="text-xl font-bold text-text-primary">{data.date}</p>
          </div>

          {/* Time In and Time Out */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Time In */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Time In
              </p>
              <p className="text-base font-bold text-text-primary mb-2">
                {data.timeIn}
              </p>
              <div className="relative w-20 aspect-square rounded-lg bg-background overflow-hidden border-2 border-green-500/50 mb-1.5">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                  </div>
                ) : data.checkInImageUrl ? (
                  <img
                    loading="lazy"
                    src={data.checkInImageUrl}
                    alt="Time In"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-text-secondary/30"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9.5" cy="9.5" r="1.5" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0l-.858.858-2.16-2.16a2 2 0 0 0-2.83 0l-5.007 5.007A2 2 0 0 0 3 19.172V21a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-secondary line-clamp-2">
                {data.timeInLocation}
              </p>
            </div>

            {/* Time Out */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide ">
                Time Out
              </p>
              <p className="text-base font-bold text-text-primary mb-2">
                {data.timeOut}
              </p>
              <div className="relative w-20 aspect-square rounded-lg bg-background overflow-hidden border-2 border-primary/50 mb-1.5">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : data.checkOutImageUrl ? (
                  <img
                    loading="lazy"
                    src={data.checkOutImageUrl}
                    alt="Time Out"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-600 to-gray-800">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-white/25"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S10.33 8 9.5 8 8 8.67 8 9.5 8.67 11 9.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H7.89c.8 2.04 2.78 3.5 5.11 3.5" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-secondary line-clamp-2">
                {data.timeOutLocation}
              </p>
            </div>
          </div>

          {/* Shift Details */}
          <div className="space-y-2">
            {/* Logged Hours */}
            <div className={`flex items-center justify-between py-2 ${data.undertime !== null ? "border-b border-border/30" : ""}`}>
              <div className="flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-primary" />
                <span className="text-xs text-text-primary font-medium">
                  Logged Hours
                </span>
              </div>
              <span className="text-xs font-semibold text-text-primary">
                {data.loggedHours}
              </span>
            </div>

            {/* Undertime/Extra Time — hidden on special duty tab */}
            {data.undertime !== null && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-xs text-text-primary font-medium">
                  Extra Time
                </span>
              </div>
              <span
                className={`text-xs font-semibold ${data.undertime.includes("-") ? "text-red-600" : "text-green-600"}`}
              >
                {data.undertime}
              </span>
            </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsModal;
