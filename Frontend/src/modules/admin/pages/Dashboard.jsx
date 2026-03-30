import React, { useEffect } from "react";
import { Users, UserCheck, UserX, Clock, ChevronRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import useAuth from "../../login/hooks/useAuth.js";
import { useDashboardApi } from "../api/dashboardAPi.js";
import { formatDate } from "../../../shared/utils/dateUtil.js";

const getCSSVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const PIE_COLORS = [
  getCSSVar("--color-present-dot"),
  getCSSVar("--color-halfday-dot"),
  getCSSVar("--color-absent-dot"),
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusColorScheme = {
  PRESENT: {
    bg: "var(--color-present-bg)",
    text: "var(--color-present-text)",
    dot: "var(--color-present-dot)",
  },
  Absent: {
    bg: "var(--color-absent-bg)",
    text: "var(--color-absent-text)",
    dot: "var(--color-absent-dot)",
  },
  Late: {
    bg: "var(--color-late-bg)",
    text: "var(--color-late-text)",
    dot: "var(--color-late-dot)",
  },
  HALF_DAY: {
    bg: "var(--color-halfday-bg)",
    text: "var(--color-halfday-text)",
    dot: "var(--color-halfday-dot)",
  },
  WORK_FROM_HOME: {
    bg: "var(--color-wfh-bg)",
    text: "var(--color-wfh-text)",
    dot: "var(--color-wfh-dot)",
  },
  WEEKOFF: {
    bg: "var(--color-weekoff-bg)",
    text: "var(--color-weekoff-text)",
    dot: "var(--color-weekoff-dot)",
  },
  HOLIDAY: {
    bg: "var(--color-holiday-bg)",
    text: "var(--color-holiday-text)",
    dot: "var(--color-holiday-dot)",
  },
  PRESENT_SPECIAL: {
    bg: "var(--color-special-bg)",
    text: "var(--color-special-text)",
    dot: "var(--color-special-dot)",
  },
  OVERTIME: {
    bg: "var(--color-overtime-bg)",
    text: "var(--color-overtime-text)",
    dot: "var(--color-overtime-dot)",
  },
};

const StatusBadge = ({ status }) => {
  const colors = statusColorScheme[status] || statusColorScheme.Absent;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {status}
    </span>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = React.useState({
    totalUsers: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [pieData, setPieData] = React.useState([]);
  const [barData, setBarData] = React.useState([]);
  const [deptData, setDeptData] = React.useState([]);
  const [attendanceRows, setAttendanceRows] = React.useState([]);

  const fetchData = async () => {
    try {
      const { data } = await useDashboardApi.fetchDashboardData();
      setCardData({
        totalUsers: data.totalUsers,
        presentToday: data.presentToday,
        absentToday: data.notCheckedIn,
        lateToday: data.lateCheckIns,
      });
      setAttendanceRows(data.todayAttendance);
      setPieData(data.pieData);
      setBarData(data.barData);
      setDeptData(data.deptRows);
      console.log("Dashboard Data:", data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="flex-1 min-w-0">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Dashboard
          </h1>
          <p className="text-xs text-text-secondary">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.employeeName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="text-sm font-medium text-weekoff-text hidden sm:block">
            {user?.employeeName}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text`}
            >
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Total Users
              </p>
              <p className={`text-2xl font-bold text-text-primary`}>
                {cardData.totalUsers}
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-present-bg text-present-text`}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Present Today
              </p>
              <p className={`text-2xl font-bold text-present-text`}>
                {cardData.presentToday}
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-absent-bg text-absent-text`}
            >
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Absent Today
              </p>
              <p className={`text-2xl font-bold text-absent-text`}>
                {cardData.absentToday}
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-halfday-bg text-halfday-text`}
            >
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Late Today
              </p>
              <p className={`text-2xl font-bold text-halfday-text`}>
                {cardData.lateToday}
              </p>
            </div>
          </div>
        </section>

        {/* ── Attendance Overview Table ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Attendance Overview
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Today's employee attendance at a glance
              </p>
            </div>
            <span className="text-xs font-medium bg-weekoff-bg text-weekoff-text px-3 py-1 rounded-full">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {[
                    "Name",
                    "Department",
                    "Role",
                    "Check In",
                    "Check Out",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-weekoff-bg">
                {attendanceRows.map((row) => (
                  <tr
                    key={row.user?.employeeName}
                    className="hover:bg-background transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-text-primary whitespace-nowrap">
                      {row.user?.employeeName}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary whitespace-nowrap">
                      {row.user?.department || "N/A"}
                    </td>
                    <td className="px-6 py-3.5 text-weekoff-text whitespace-nowrap">
                      {row.user?.userType || "N/A"}
                    </td>
                    <td className="px-6 py-3.5 text-weekoff-text whitespace-nowrap">
                      {formatDate(row.checkInTime) || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-weekoff-text whitespace-nowrap">
                      {formatDate(row.checkOut) || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Charts ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-0.5">
              Attendance Breakdown
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              Present vs Absent vs Late – Today
            </p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2.5 shrink-0">
                {pieData.map((item, i) => (
                  <li
                    key={item.status}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i] }}
                    />
                    <span className="text-text-secondary">{item.status}</span>
                    <span className="font-semibold text-text-primary ml-auto pl-3">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-0.5">
              Weekly Attendance Trend
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              Last 7 days – Present vs Absent
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="present"
                  name="Present"
                  fill={getCSSVar("--color-present-dot")}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  fill={getCSSVar("--color-absent-dot")}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ── Department Summary ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              Department Attendance Summary
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Breakdown by department for today
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Department", "Present", "Absent", "Attendance Rate"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-weekoff-bg">
                {deptData.map((row) => {
                  const total = row.present + row.absent;
                  const rate = Math.round((row.present / total) * 100);
                  return (
                    <tr
                      key={row.dept}
                      className="hover:bg-background transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-text-primary">
                        {row.dept}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-present-text font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-present-dot" />{" "}
                          {row.present}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-absent-text font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-absent-dot" />{" "}
                          {row.absent}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-weekoff-bg rounded-full overflow-hidden max-w-30">
                            <div
                              className="h-full bg-present-dot rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-weekoff-text w-8 text-right">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
