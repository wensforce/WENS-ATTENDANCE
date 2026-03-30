import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  ChevronRight,
  ChevronDown,
  Download,
  Filter,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../login/hooks/useAuth.js";
import { usereportApi } from "../api/reportApi.js";
import DataTable from "../components/DataTable.jsx";
import { toast } from "react-toastify";
import exportToExcel from "../components/report/ExportToExcel.jsx";
import exportToPDF from "../components/report/ExportToPDF.jsx";
import useDebounce from "../../../shared/hooks/useDebounce.js";

// ─── Stat Card ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color = "text-text-primary" }) => (
  <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0">
      <Icon size={16} className={color} />
    </div>
    <div>
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p className={`text-lg font-bold ${color} mt-0.5`}>{value}</p>
    </div>
  </div>
);

// ─── Report Columns ───────────────────────────────────────────────────────

const buildReportColumns = () => [
  {
    header: "Employee",
    key: "employeeName",
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-text-primary text-sm">{row.employeeName || "—"}</span>
        <span className="text-xs text-text-muted">{row.employeeId || "—"}</span>
      </div>
    ),
  },
  {
    header: "Department",
    key: "department",
    render: (row) => (
      <span className="text-sm text-text-secondary">{row.department || "—"}</span>
    ),
  },
  {
    header: "Designation",
    key: "designation",
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text">
        {row.designation || "—"}
      </span>
    ),
  },
  {
    header: "Working Days",
    key: "workingDays",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Calendar size={13} className="text-text-muted shrink-0" />
        <span className="text-sm font-medium text-text-secondary">{row.workingDays || "0/0"}</span>
      </div>
    ),
  },
  {
    header: "Total Working Hours",
    key: "totalWorkingHours",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Clock size={13} className="text-text-muted shrink-0" />
        <span className="text-sm font-medium text-text-primary">{row.totalWorkingHours || "0 hrs"}</span>
      </div>
    ),
  },
  {
    header: "Late Check-ins",
    key: "lateCheckin",
    render: (row) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-late-bg text-late-text">
        {row.lateCheckin || 0}
      </span>
    ),
  },
  {
    header: "Overtime / Undertime",
    key: "overTimeUndertime",
    render: (row) => {
      const isOvertime = !row.overTimeUndertime?.startsWith("-");
      return (
        <span
          className={`font-mono text-sm font-medium ${
            isOvertime ? "text-present-text" : "text-text-secondary"
          }`}
        >
          {row.overTimeUndertime || "0 hrs"}
        </span>
      );
    },
  },
];

// ─── Month/Year Selector ──────────────────────────────────────────────────

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const generateYearArray = () => {
  const current = new Date().getFullYear();
  const years = [];
  for (let i = current - 5; i <= current + 1; i++) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
};



// ─── Main Report Page ─────────────────────────────────────────────────────

const Report = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Filters
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [userType, setUserType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const fetchReport = async (page = 1) => {
    setLoading(true);
    try {
      const { data, error } = await usereportApi.getAllUserReport(
        month,
        year,
        page,
        10,
        debouncedSearch,
        userType
      );

      if (error) {
        toast.error(error || "Failed to fetch report");
        setData([]);
        setPagination(null);
      } else {
        setData(data.report || []);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      toast.error("Failed to fetch report");
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(1);
  }, [month, year, userType, debouncedSearch]);

  const handlePageChange = (page) => {
    fetchReport(page);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportToExcel(data, month, year);
    } finally {
      setExporting(false);
      setExportDropdownOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(data, month, year);
    } finally {
      setExporting(false);
      setExportDropdownOpen(false);
    }
  };

  const monthLabel = MONTHS.find((m) => m.value === month)?.label || "Month";

  // Calculate totals for stat cards
  const stats = {
    totalEmployees: data.length,
    totalWorkingDays: data.reduce((sum, emp) => {
      const [worked] = emp.workingDays?.split("/") || [0];
      return sum + (parseInt(worked) || 0);
    }, 0),
    totalLateCheckins: data.reduce((sum, emp) => sum + (emp.lateCheckin || 0), 0),
  };

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Monthly Reports
          </h1>
          <p className="text-xs text-text-secondary">
            Employee attendance & performance summary
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
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Employees"
            value={stats.totalEmployees}
            icon={Calendar}
            color="text-holiday-text"
          />
          <StatCard
            label="Total Working Days"
            value={stats.totalWorkingDays}
            icon={Calendar}
            color="text-present-text"
          />
          <StatCard
            label="Total Late Check-ins"
            value={stats.totalLateCheckins}
            icon={Calendar}
            color="text-late-text"
          />
        </section>

        {/* ── Report Card ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  {monthLabel} {year} Report
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {data.length} employee{data.length !== 1 ? "s" : ""} • {pagination?.totalCount || 0} total
                </p>
              </div>
              
              {/* Export Dropdown */}
              <div className="sm:ml-auto relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  disabled={exporting || data.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed relative"
                >
                  {exporting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  Export
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${exportDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {exportDropdownOpen && !exporting && (
                  <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-background transition-colors flex items-center gap-2 border-b border-border"
                    >
                      <FileText size={14} className="text-green-500" />
                      Export as Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-background transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} className="text-red-500" />
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Month */}
                <div className="relative">
                  <Calendar
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="pl-8 pr-8 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition appearance-none w-full"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="relative">
                  <Calendar
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="pl-8 pr-8 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition appearance-none w-full"
                  >
                    {generateYearArray().map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Type */}
                <div className="relative">
                  <Filter
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="pl-8 pr-8 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition appearance-none w-full"
                  >
                    <option value="">All User Types</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    <option value="BODYGUARD">Bodyguard</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search name, ID, dept…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary transition w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DataTable */}
          <div className="p-4 overflow-x-auto">
            <DataTable
              columns={buildReportColumns()}
              rows={data}
              rowIdKey="employeeId"
              selectable={false}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onView={(row) => navigate(`/admin/reports/${row.employeeId}`, {
                state: { month, year },
              })}
              emptyText={
                search || userType
                  ? "No employees match your filters"
                  : "No report data available for this period"
              }
            />
          </div>
        </section>

        {/* ── Report Info ── */}
        {data.length > 0 && (
          <div className="bg-background rounded-xl border border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-text-muted font-medium">Report Period</p>
                <p className="text-text-primary font-semibold mt-1">
                  {monthLabel} {year}
                </p>
              </div>
              <div>
                <p className="text-text-muted font-medium">Total Employees</p>
                <p className="text-text-primary font-semibold mt-1">
                  {stats.totalEmployees}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Report;
