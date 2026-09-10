import React, { Suspense, useEffect, useState } from "react";
const Calendar = React.lazy(() => import("react-calendar"));
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-calendar/dist/Calendar.css";
const AttendanceDetailsModal = React.lazy(
  () => import("../components/attendance/AttendanceDetailsModal"),
);
const HolydayDeatilsModal = React.lazy(
  () => import("../components/attendance/HolidayDetailsModal"),
);
const AbsentModal = React.lazy(
  () => import("../components/attendance/AbsentModal"),
);
const RegularizeRequestModal = React.lazy(
  () => import("../components/attendance/RegularizeRequestModal"),
);
import { toast } from "react-toastify";
import calenderApi from "../api/attendanceApi";
import { regularizeApi } from "../../../shared/api/regularizeApi";
import useAuth from "../../login/hooks/useAuth";
import { formatDate } from "../../../shared/utils/dateUtil";
import AttendanceDetailsLoading from "../components/attendance/AttendanceDetailsLoading";

const AttendanceHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState(null);
  const [specialDayDetails, setSpecialDayDetails] = useState(null);
  const [holidayDetails, setHolidayDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [regularizeRequests, setRegularizeRequests] = useState([]);
  const [regularizeOpen, setRegularizeOpen] = useState(false);
  const { user } = useAuth();

  // Calculate statistics for future update, currently not used in UI
  // const calculateStats = () => {
  //   const workingDays = attendanceData.filter(
  //     (item) => !["weekoff"].includes(item.status),
  //   ).length;

  //   const presentDays = attendanceData.filter(
  //     (item) => item.status === "PRESENT" || item.status === "PRESENT_SPECIAL" || item.status === "OVERTIME" || item.status === "LATE" || item.status === "WORK_FROM_HOME",
  //   ).length;

  //   const halfDays = attendanceData.filter(
  //     (item) => item.status === "HALF_DAY",
  //   ).length;

  //   const totalPresent = presentDays + halfDays;
  //   console.log(totalPresent,workingDays);

  //   const attendancePercentage =
  //     workingDays > 0 ? ((totalPresent / workingDays) * 100).toFixed(1) : 0;

  //   return {
  //     attendancePercentage,
  //     presentDays: totalPresent,
  //     workingDays,
  //   };
  // };
  // const stats = calculateStats();

  // Get status for a specific date
  const getDateStatus = (date) => {
    const dateString = formatDate(date); // get date month and year in ISO format for comparison
    const record = attendanceData.find(
      (item) => item.date?.split("T")[0] === dateString,
    ); // item.date is in 2026-02-23 16:28:37.903 format, so we need to compare only the date part

    if (record) return record.status;

    // Check if it's a weekend (Saturday or Sunday)
    const day = date.getDay();
    const userWeekOff = user.weekendOff;
    if (userWeekOff?.includes(day)) return "WEEKOFF";
    return null;
  };

  // Get dot color based on status
  const getDotColor = (status) => {
    const colors = {
      PRESENT: "bg-emerald-500",
      ABSENT: "bg-rose-500",
      HALF_DAY: "bg-amber-500",
      WORK_FROM_HOME: "bg-cyan-500",
      LATE: "bg-yellow-400",
      WEEKOFF: "bg-slate-400",
      HOLIDAY: "bg-indigo-500",
      PRESENT_SPECIAL: "bg-violet-500",
      OVERTIME: "bg-green-600",
      MISSING_CHECKOUT: "bg-fuchsia-400",
      REGULARIZE_PENDING: "bg-orange-400",
    };
    return colors[status] || "";
  };

  const toDateKey = (value) => formatDate(value);

  const getRecordForDate = (date) =>
    attendanceData.find((item) => item.date?.split("T")[0] === toDateKey(date));

  const getRequestForDate = (date) =>
    regularizeRequests.find(
      (item) => toDateKey(item.date) === toDateKey(date),
    );

  const getTileStatus = (date) => {
    if (getRequestForDate(date)?.status === "PENDING") return "REGULARIZE_PENDING";
    const record = getRecordForDate(date);
    const isToday = toDateKey(date) === toDateKey(new Date());
    if (!isToday && record?.checkInTime && !record?.checkOutTime) {
      return "MISSING_CHECKOUT";
    }
    return getDateStatus(date);
  };

  const isRegularizeWindow = (date) => {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - day) / 86400000);
    return diffDays >= 1 && diffDays <= 7;
  };

  const canRegularizeSelected = () => {
    if (!selectedDate || !isRegularizeWindow(selectedDate)) return false;
    const request = getRequestForDate(selectedDate);
    if (request?.status === "APPROVED") return false;
    const status = getDateStatus(selectedDate);
    if (status === "ABSENT") return true;
    const dayRecord = getRecordForDate(selectedDate);
    if (dayRecord?.checkInTime && !dayRecord?.checkOutTime) return true;
    if (
      attendanceDetails &&
      attendanceDetails.checkInTime &&
      !attendanceDetails.checkOutTime
    ) {
      return true;
    }
    if (request?.status === "PENDING") return true;
    return false;
  };

  const refreshMonthData = () => {
    const month = selectedMonth.getMonth() + 1;
    const year = selectedMonth.getFullYear();
    calenderApi
      .getSummary(user.id, month, year)
      .then((res) => {
        if (res.data) {
          setAttendanceData(res.data?.attendance);
        }
      })
      .catch((error) => {
        if (error.handled === true) return;
        toast.error(
          error.message ||
            "Error fetching attendance summary. Please try again later.",
        );
      });
    regularizeApi
      .list({ month, year, limit: 50 })
      .then((res) => {
        setRegularizeRequests(res.data?.requests || []);
      })
      .catch(() => {
        setRegularizeRequests([]);
      });
  };

  // Tile content for calendar dots
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const status = getTileStatus(date);
      if (status) {
        return (
          <div className="flex justify-center items-center mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`}
            ></span>
          </div>
        );
      }
    }
    return null;
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    );
  };

  const monthName = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleDayClick = async (date) => {
    const status = getDateStatus(date);
    setAttendanceDetails(null);
    setSpecialDayDetails(null);
    setHolidayDetails(null);
    setRegularizeOpen(false);

    if (status) {
      const findData = attendanceData.find(
        (item) => item.date?.split("T")[0] === formatDate(date),
      );

      // ABSENT has no API call — open immediately
      if (findData?.status === "ABSENT") {
        setAttendanceDetails({
          status: findData.status,
          date: date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        });
        setSelectedDate(date);
        return;
      }

      setDetailsLoading(true);
      setSelectedDate(date);

      try {
        const calls = [];

        if (findData?.id) {
          calls.push(
            calenderApi.getAttendanceDetails(findData.id).then((res) => {
              setAttendanceDetails(res.data);
            }),
          );
        }
        if (findData?.specialId) {
          calls.push(
            calenderApi
              .getSpecialDayAttendance(findData.specialId)
              .then((res) => {
                setSpecialDayDetails(res.data);
              }),
          );
        }
        if (findData?.holidayId) {
          calls.push(
            calenderApi.getHolidayAttendance(findData.holidayId).then((res) => {
              setHolidayDetails(res.data);
            }),
          );
        }

        await Promise.all(calls);
      } catch (error) {
        toast.error(
          error.message ||
            "Error fetching attendance details. Please try again later.",
        );
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshMonthData();
  }, [selectedMonth, user.id]);

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* ── Skeleton shown while API data is loading ── */}
      {detailsLoading && <AttendanceDetailsLoading />}

      {!detailsLoading &&
        !regularizeOpen &&
        attendanceDetails?.status === "ABSENT" && (
        <Suspense fallback={<AttendanceDetailsLoading />}>
          <AbsentModal
            isOpen={selectedDate !== null}
            onClose={() => {
              setSelectedDate(null);
              setAttendanceDetails(null);
            }}
            attendanceData={attendanceDetails}
            loading={detailsLoading}
            canRegularize={canRegularizeSelected()}
            requestStatus={getRequestForDate(selectedDate)?.status}
            onRegularize={() => setRegularizeOpen(true)}
          />
        </Suspense>
      )}

      {!detailsLoading &&
        !regularizeOpen &&
        (attendanceDetails?.status === "PRESENT_SPECIAL" ||
        attendanceDetails?.status === "OVERTIME" ||
        attendanceDetails?.status === "HALF_DAY" ||
        attendanceDetails?.status === "WORK_FROM_HOME" ||
        attendanceDetails?.status === "LATE" ||
        attendanceDetails?.status === "PRESENT") && (
        <Suspense fallback={<AttendanceDetailsLoading />}>
          <AttendanceDetailsModal
            isOpen={selectedDate !== null}
            onClose={() => {
              setSelectedDate(null);
              setAttendanceDetails(null);
              setSpecialDayDetails(null);
            }}
            attendanceData={attendanceDetails}
            specialDayData={specialDayDetails}
            loading={detailsLoading}
            canRegularize={canRegularizeSelected()}
            requestStatus={getRequestForDate(selectedDate)?.status}
            onRegularize={() => setRegularizeOpen(true)}
          />
        </Suspense>
      )}
      {!detailsLoading && (holidayDetails?.status === "HOLIDAY" ||
        holidayDetails?.status === "LEAVE") && (
        <Suspense fallback={<AttendanceDetailsLoading />}>
          <HolydayDeatilsModal
            isOpen={selectedDate !== null}
            onClose={() => {
              setSelectedDate(null);
              setAttendanceDetails(null);
              setHolidayDetails(null);
            }}
            holidayData={holidayDetails}
            loading={detailsLoading}
          />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <RegularizeRequestModal
          isOpen={regularizeOpen}
          onClose={() => setRegularizeOpen(false)}
          date={selectedDate ? formatDate(selectedDate) : ""}
          displayDate={
            selectedDate
              ? selectedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""
          }
          existingCheckIn={attendanceDetails?.checkInTime}
          existingCheckOut={attendanceDetails?.checkOutTime}
          existingRequest={getRequestForDate(selectedDate)}
          onSubmitted={refreshMonthData}
        />
      </Suspense>
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-6 bg-surface mx-4 mt-4 rounded-2xl shadow-xs border border-primary/10">
        <button
          aria-label="Previous month"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-xl font-semibold text-text-primary">{monthName}</h2>
        <button
          aria-label="Next month"
          onClick={handleNextMonth}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-text-primary" />
        </button>
      </div>

      {/* Calendar */}
      <div className="px-4 mt-6">
        <div className="relative bg-surface flex items-center justify-center rounded-2xl shadow-xs border border-primary/10 p-6 calendar-container">
          {detailsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 rounded-2xl backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-border border-t-text-primary rounded-full animate-spin" />
            </div>
          )}
          <Calendar
            value={selectedMonth}
            activeStartDate={selectedMonth}
            calendarType="hebrew"
            tileContent={tileContent}
            onClickDay={handleDayClick}
            showNavigation={false}
            formatShortWeekday={(locale, date) =>
              ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]
            }
            className="w-full border-none text-text-primary"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mx-4 mt-6 bg-surface rounded-2xl shadow-xs border border-primary/10 p-6">
        <h3 className="text-xs font-bold text-text-muted tracking-wider mb-4">
          LEGEND
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-text-primary">Present</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-sm text-text-primary">Absent</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-sm text-text-primary">Half Day</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-600"></span>
            <span className="text-sm text-text-primary">Overtime</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-sm text-text-primary">Late</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
            <span className="text-sm text-text-primary">Work From Home</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span>
            <span className="text-sm text-text-primary">Week Off</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            <span className="text-sm text-text-primary">Holiday</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span>
            <span className="text-sm text-text-primary">Special Day</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-fuchsia-500"></span>
            <span className="text-sm text-text-primary">No check-out</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-400"></span>
            <span className="text-sm text-text-primary">Regularize pending</span>
          </div>
        </div>
      </div>

      {/* Statistics  for future use */}
      {/* <div className="grid grid-cols-2 gap-4 px-4 mt-6">
        <div className="bg-surface rounded-2xl shadow-xs border border-primary/10 p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-muted tracking-wide">
            ATTENDANCE %
          </span>
          <span className="text-3xl font-bold text-text-primary">
            {stats.attendancePercentage}%
          </span>
        </div>
        <div className="bg-surface rounded-2xl shadow-xs border border-primary/10 p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-muted tracking-wide">
            WORKING DAYS
          </span>
          <span className="text-3xl font-bold text-text-primary">
            {stats.presentDays} / {stats.workingDays}
          </span>
        </div>
      </div> */}
    </main>
  );
};

export default AttendanceHistory;
