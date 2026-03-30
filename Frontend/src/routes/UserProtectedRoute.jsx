import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../modules/login/hooks/useAuth";
import BottomNavigation from "../modules/employes/components/BottomNavigation";
import Navbar from "../modules/employes/components/Navbar";
import { requestNotificationPermission } from "../shared/hooks/usePushNotification";

const UserProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render child routes
  return (
    <div className="w-full max-w-lg mx-auto relative h-screen overflow-y-auto">
      <Navbar />
      <Outlet />
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default UserProtectedRoute;
