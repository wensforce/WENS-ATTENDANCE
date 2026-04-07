import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer, Bounce, toast } from "react-toastify";

const Home = lazy(() => import("./modules/employes/pages/Home"));
const AttendanceHistory = lazy(
  () => import("./modules/employes/pages/AttendanceHistory"),
);
const Profile = lazy(() => import("./modules/employes/pages/Profile"));
const Dashboard = lazy(() => import("./modules/admin/pages/Dashboard"));
const Login = lazy(() => import("./modules/login/pages/Login"));
const Employes = lazy(() => import("./modules/admin/pages/Employes"));
const EmployeDetails = lazy(
  () => import("./modules/admin/pages/EmployeDetails"),
);
const AdminAttendance = lazy(() => import("./modules/admin/pages/Attendance"));
const AttendanceDetails = lazy(
  () => import("./modules/admin/pages/AttendanceDetails"),
);
const Report = lazy(() => import("./modules/admin/pages/Report"));
const UserReport = lazy(() => import("./modules/admin/pages/UserReport"));
const Setting = lazy(() => import("./modules/admin/pages/Setting"));

import UserProtectedRoute from "./routes/UserProtectedRoute";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import UnprotectedRoute from "./routes/UnprotectedRoute";
import {
  onForegroundMessage,
} from "./shared/hooks/usePushNotification";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);
const App = () => {
  useEffect(() => {
    // Handle foreground (app open) notifications
    const unsubscribe = onForegroundMessage((payload) => {
      console.log("Foreground notification:", payload);
      toast(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes (guest-only) */}
          <Route element={<UnprotectedRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Employee Routes */}
          <Route element={<UserProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/attendance" element={<AttendanceHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employes />} />
            <Route path="employees/:id" element={<EmployeDetails />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="attendance/:id" element={<AttendanceDetails />} />
            <Route path="reports" element={<Report />} />
            <Route path="reports/:employeeId" element={<UserReport />} />
            <Route path="settings" element={<Setting />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
