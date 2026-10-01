import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../modules/login/hooks/useAuth";
import { getHomePath } from "./roleHome";
import OfflineScreen from "../shared/components/OfflineScreen";

const UnprotectedRoute = () => {
  const { isAuthenticated, loading, user, isOffline, verifySession } = useAuth();

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

  // Reload/open offline while on /login — show offline, not the login form
  if (isOffline && !isAuthenticated) {
    return <OfflineScreen onRetry={verifySession} />;
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return <Outlet />;
};

export default UnprotectedRoute;
