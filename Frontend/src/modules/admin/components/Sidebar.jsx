import React, { memo } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart2,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  Clock,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Employees", icon: Users, to: "/admin/employees" },
  { label: "Attendance", icon: CalendarCheck, to: "/admin/attendance" },
  { label: "Reports", icon: BarChart2, to: "/admin/reports" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

const Sidebar = memo(({ collapsed, onToggle, onLogout, user }) => {
  return (
  <aside
    className={`
      fixed top-0 left-0 h-screen z-30 flex flex-col
      bg-text-primary text-white
      transition-all duration-300 ease-in-out
      ${collapsed ? "w-16" : "w-60"}
    `}
  >
    {/* Logo Row */}
    <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
      {!collapsed && (
        <Link to="/" className="text-base font-bold tracking-wide whitespace-nowrap overflow-hidden">
          Wens Admin
        </Link>
      )}
      <button
        onClick={onToggle}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors ml-auto"
      >
        {collapsed ? <Menu size={18} /> : <X size={18} />}
      </button>
    </div>

    {/* Nav Links */}
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
             ${
               isActive
                 ? "bg-white text-text-primary"
                 : "text-white/70 hover:bg-white/10 hover:text-white"
             }`
          }
        >
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{label}</span>}
        </NavLink>
      ))}
    </nav>

    {/* User + Logout */}
    <div className="border-t border-white/10 px-3 py-4 shrink-0">
      {!collapsed && (
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold truncate">
            {user?.employeeName ?? "Admin"}
          </p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
      )}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        <LogOut size={18} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  </aside>
  );
});

export default Sidebar;