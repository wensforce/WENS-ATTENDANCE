import React, { useEffect, useState } from "react";
import useAuth from "../../login/hooks/useAuth.js";
import { Clock, Clock1, LogIn, LogOut, ToggleLeft } from "lucide-react";
const CameraModal = React.lazy(() => import("../components/CameraModal.jsx"));
import { useAttendanceApi, useDashboardApi } from "../api/homeApi.js";
import { formatAttendanceTime } from "../../../shared/utils/dashboard.utils.js";
import StatsCards from "../components/home/StatsCards.jsx";
import CheckInButton from "../components/home/CheckInButton.jsx";
import { fetchLocation } from "../utils/fetchCurrentLocation.js";
import { base64ToBlob } from "../../../shared/utils/fileConvert.js";
import { toast } from "react-toastify";
import SpinLoading from "../../../shared/components/SpinLoading.jsx";
import SkeletonLoading from "../../../shared/components/SkeletonLoading.jsx";

const Home = () => {
  const { user, loading } = useAuth();
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSpecialDuty, setIsSpecialDuty] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [dashboardDataloading, setDashboardDataloading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  // Get current date
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Handle special duty toggle
  const handleSpecialDutyToggle = () => {
    setIsSpecialDuty(!isSpecialDuty);
  };

  // Toast notification configuration
  const TOAST_CONFIG = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  };

  // Get current attendance data based on mode (special duty or normal)
  const getAttendanceData = () => {
    return isSpecialDuty
      ? dashboardData.specialDuty
      : dashboardData.todayAttendance;
  };

  // Determine which API to use based on mode
  const getAttendanceApi = () => {
    return {
      checkIn: isSpecialDuty
        ? useAttendanceApi.specialCheckIn
        : useAttendanceApi.checkIn,
      checkOut: isSpecialDuty
        ? useAttendanceApi.specialCheckOut
        : useAttendanceApi.checkOut,
    };
  };

  // Handle attendance API call with toast notification
  const performAttendanceAction = async (
    apiMethod,
    imageDataUrl,
    isCheckIn,
  ) => {
    try {
      const formData = new FormData();
      const attendanceLocation = await fetchLocation();

      formData.append("lat", attendanceLocation?.latitude);
      formData.append("lng", attendanceLocation?.longitude);
      formData.append(
        "address",
        attendanceLocation?.address || "Address not available",
      );

      const imageBlob = base64ToBlob(imageDataUrl);
      const imageFieldName = isCheckIn ? "checkInImage" : "checkOutImage";
      formData.append(imageFieldName, imageBlob);

      const res = await apiMethod(formData);

      await loadDashboardData();

      if (res.data) {
        const message = isCheckIn
          ? "Check-in successful!"
          : "Check-out successful!";
        toast.success(message, TOAST_CONFIG);
      }
    } catch (error) {
      toast.error( error.message || "Failed to process attendance. Please try again.",);
      return Promise.reject(error);
    }
  };

  // Handle camera modal
  const handleCheckInClick = () => {
    setIsCameraModalOpen(true);
  };

  // Handle camera capture and attendance processing
  const handleCameraCapture = async (imageDataUrl) => {
    try {
      if (!imageDataUrl) return;
      setCheckInLoading(true);
      // Validate special duty check-in requirements
      if (
        isSpecialDuty &&
        !dashboardData.specialDuty?.checkInTime &&
        dashboardData.todayAttendance?.checkInTime &&
        !dashboardData.todayAttendance?.checkOutTime
      ) {
        toast.error(
           "You must check out from regular attendance before checking in to special duty!",
        );
        setIsCameraModalOpen(false);
        return;
      }

      const attendanceData = getAttendanceData();
      const { checkIn, checkOut } = getAttendanceApi();

      if (!attendanceData?.checkInTime) {
        await performAttendanceAction(checkIn, imageDataUrl, true).then(() => {
          setJustCheckedIn(true);
        });
      } else if (!attendanceData?.checkOutTime) {
        await performAttendanceAction(checkOut, imageDataUrl, false);
      } else {
        toast.info(
          "You have already checked in and out for today!",
          TOAST_CONFIG,
        );
      }
    } catch (error) {
      console.error("Camera capture error:", error);
    } finally {
      setIsCameraModalOpen(false);
      setCheckInLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setDashboardDataloading(true);
      const res = await useDashboardApi.fetchDashboardData();
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setDashboardDataloading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchLocation()
      .then((location) => {
        setCurrentLocation(location);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (justCheckedIn) {
      const timer = setTimeout(() => {
        setJustCheckedIn(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [justCheckedIn]);

  if (dashboardDataloading || loading) {
    return <SkeletonLoading />;
  }

  return (
    <main className="w-full p-4 bg-background min-h-screen">
      {/* Main Content */}

      {/* Loading Overlay */}
      {checkInLoading && <SpinLoading />}

      {/* Header with Greeting and Special Duty Toggle */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-text-primary">
            {getGreeting()}, {user?.employeeName?.toUpperCase() || "USER"}
          </h2>
          <p className="text-base text-text-secondary">{currentDate}</p>
        </div>

        {/* Special Duty Toggle */}
        {user.userType === "BODYGUARD" && (
          <button
            aria-label="special duty toggle"
            onClick={handleSpecialDutyToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isSpecialDuty
                ? "bg-indigo-500/20 border border-indigo-500/50"
                : "bg-surface border border-border"
            }`}
            title="Toggle Special Duty Mode"
          >
            <ToggleLeft
              className={`w-4 h-4 ${isSpecialDuty ? "text-indigo-500" : "text-text-secondary"}`}
            />
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isSpecialDuty ? "text-indigo-500" : "text-text-secondary"
              }`}
            >
              {isSpecialDuty ? "Special Duty" : "Normal"}
            </span>
          </button>
        )}
      </div>

      {/* Notification Message */}
      {isSpecialDuty && (
        <div
          className={`mb-4 p-3 bg-indigo-500/10 border-indigo-500/50 text-indigo-500 rounded-lg border transition-all animate-pulse`}
        >
          <p className="text-sm font-semibold text-center ">
            ✓ Special Duty Activated
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards
        totalExtraTime={dashboardData.totalExtraTime}
        lateCheckIns={dashboardData.lateCheckIns}
        isUndertime={
          dashboardData.totalExtraTime
            ? dashboardData.totalExtraTime.includes("-")
              ? true
              : false
            : false
        }
      />

      {/* Check In Button */}
      {justCheckedIn ? (
        <div className="text-center my-6 py-4 px-6 bg-green-200/10 border-green-500/50 border rounded-lg">
          <p className="text-sm font-medium text-green-700">
            Check-in successful.
          </p>
        </div>
      ) : !dashboardData.todayAttendance?.checkOutTime ||
        (isSpecialDuty && !dashboardData.specialDuty?.checkOutTime) ? (
        <CheckInButton
          isCheckedIn={
            !isSpecialDuty
              ? !!dashboardData.todayAttendance?.checkInTime
              : !!dashboardData.specialDuty?.checkInTime
          }
          handleCheckInClick={handleCheckInClick}
        />
      ) : (
        <div className="text-center my-6 py-4 px-6 bg-green-200/10 border-green-500/50 border rounded-lg">
          <p className="text-sm font-medium text-green-700">
            Attendance completed for today.
          </p>
        </div>
      )}
      {/* Current Location */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.4"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-sm font-medium uppercase tracking-wider text-text-primary">
            Current Location
          </p>
        </div>
        <p className="text-sm px-8 text-text-secondary">
          {currentLocation?.address || "Address not available"}
        </p>
      </div>

      {/* Special Duty Summary - Only shown when special duty is active */}
      {isSpecialDuty && (
        <>
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-2xl font-bold text-text-primary">
              Special Duty Summary
            </h3>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-600">
              ACTIVE
            </span>
          </div>

          {/* Special Duty Summary Card */}
          <div className="border py-3 px-8 border-border shadow-md rounded-2xl bg-surface">
            {/* Placeholder content */}
            <div className="py-5 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background">
                  <LogIn
                    strokeWidth={2.5}
                    className="w-5 h-5 text-text-secondary"
                  />
                </div>
                <p className="text-base font-medium text-text-secondary uppercase">
                  Check In
                </p>
              </div>
              <h5 className="text-lg font-bold text-text-primary">
                {dashboardData.specialDuty?.checkInTime
                  ? formatAttendanceTime(dashboardData.specialDuty.checkInTime)
                  : "---"}
              </h5>
            </div>
            <hr className="border-border" />
            {/* Placeholder content */}
            <div className="py-5 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background">
                  <LogOut
                    strokeWidth={2.5}
                    className="w-5 h-5 text-text-secondary"
                  />
                </div>
                <p className="text-base font-medium text-text-secondary uppercase">
                  Check Out
                </p>
              </div>
              <h5 className="text-lg font-bold text-text-primary">
                {dashboardData.specialDuty?.checkOutTime
                  ? formatAttendanceTime(dashboardData.specialDuty.checkOutTime)
                  : "---"}
              </h5>
            </div>
            <hr className="border-border" />
            {/* Placeholder content */}
            <div className="py-5 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary">
                  <Clock1
                    strokeWidth={2.5}
                    className="w-5 h-5 text-primary-foreground"
                  />
                </div>
                <p className="text-lg font-medium text-text-secondary uppercase">
                  Working Hours
                </p>
              </div>
              <h5 className="text-lg font-bold text-text-primary">
                {dashboardData.specialDuty?.workHours || "---"}
              </h5>
            </div>
          </div>
        </>
      )}

      {/* Today's Summary */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-2xl font-bold text-text-primary">
          Today's Summary
        </h3>
        <span
          className="p-2 rounded-lg"
          style={{ backgroundColor: "var(--border)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
          </svg>
        </span>
      </div>
      {/* Summary Card Placeholder */}
      <div className="border py-3 px-8 border-border shadow-md rounded-2xl bg-surface">
        {/* Placeholder content */}
        <div className="py-5 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background">
              <LogIn
                strokeWidth={2.5}
                className="w-5 h-5 text-text-secondary"
              />
            </div>
            <p className="text-base font-medium text-text-secondary uppercase">
              Check In
            </p>
          </div>
          <h5 className="text-lg font-bold text-text-primary">
            {dashboardData.todayAttendance?.checkInTime
              ? formatAttendanceTime(dashboardData.todayAttendance.checkInTime)
              : "---"}
          </h5>
        </div>
        <hr className="border-border" />
        {/* Placeholder content */}
        <div className="py-5 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background">
              <LogOut
                strokeWidth={2.5}
                className="w-5 h-5 text-text-secondary"
              />
            </div>
            <p className="text-base font-medium text-text-secondary uppercase">
              Check Out
            </p>
          </div>
          <h5 className="text-lg font-bold text-text-primary">
            {dashboardData.todayAttendance?.checkOutTime
              ? formatAttendanceTime(dashboardData.todayAttendance.checkOutTime)
              : "---"}
          </h5>
        </div>
        <hr className="border-border" />
        {/* Placeholder content */}
        <div className="py-5 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary">
              <Clock1
                strokeWidth={2.5}
                className="w-5 h-5 text-primary-foreground"
              />
            </div>
            <p className="text-lg font-medium text-text-secondary uppercase">
              {dashboardData.todayAttendance?.extraTime
                ? dashboardData.todayAttendance.extraTime.includes("-")
                  ? "UnderTime"
                  : "OverTime"
                : "Overtime"}
            </p>
          </div>
          <h5 className="text-lg font-bold text-text-primary">
            {dashboardData.todayAttendance?.extraTime || "---"}
          </h5>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </main>
  );
};

export default Home;
