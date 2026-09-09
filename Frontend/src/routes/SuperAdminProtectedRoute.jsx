import React, { useState, useCallback, memo } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import useAuth from "../modules/login/hooks/useAuth.js";
import Sidebar from "../modules/admin/components/Sidebar.jsx";
import { getHomePath } from "./roleHome";

const PLATFORM_NAV = [
  { label: "Companies", icon: Building2, to: "/platform/tenants" },
];

const PageContent = memo(({ marginLeft }) => (
  <div
    className="flex-1 min-w-0 overflow-auto"
    style={{ marginLeft, transition: "margin-left 300ms ease-in-out" }}
  >
    <Outlet />
  </div>
));
PageContent.displayName = "PageContent";

const SuperAdminProtectedRoute = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleToggle = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.userType !== "SUPERADMIN") {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggle}
        onLogout={handleLogout}
        user={user}
        title="WENS Platform"
        homeTo="/platform/tenants"
        navItems={PLATFORM_NAV}
      />
      <PageContent marginLeft={sidebarCollapsed ? "4rem" : "15rem"} />
    </div>
  );
};

export default SuperAdminProtectedRoute;
