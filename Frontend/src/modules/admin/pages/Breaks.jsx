import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import useAuth from "../../login/hooks/useAuth.js";

const TABS = [
  { label: "Logs", to: "/admin/breaks/logs" },
  { label: "Configurations", to: "/admin/breaks/configs" },
];

const Breaks = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (pathname === "/admin/breaks" || pathname === "/admin/breaks/") {
    return <Navigate to="/admin/breaks/logs" replace />;
  }

  return (
    <main className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Breaks
          </h1>
          <p className="text-xs text-text-secondary">
            View break logs and manage break configurations
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.employeeName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="text-sm font-medium text-weekoff-text hidden sm:block">
            {user?.employeeName ?? "Admin"}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex gap-1">
          {TABS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-text-primary text-white"
                    : "text-text-secondary hover:bg-background"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </main>
  );
};

export default Breaks;
