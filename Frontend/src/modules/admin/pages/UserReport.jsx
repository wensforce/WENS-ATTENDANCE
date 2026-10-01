import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  User,
  Building2,
  Briefcase,
  Info,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { usereportApi } from "../api/reportApi.js";
import useAuth from "../../login/hooks/useAuth.js";
import DataTable from "../components/DataTable.jsx";
import { toast } from "react-toastify";

// ─── Month Constants ──────────────────────────────────────────────────────

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

// ─── Stat Card ────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon: Icon,
  valueColor = "text-text-primary",
}) => (
  <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0">
      <Icon size={18} className="text-text-muted" />
    </div>
    <div>
      <p className="text-xs font-medium text-text-secondary mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  </div>
);

// ─── Info Row ──────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p className="text-sm text-text-primary font-semibold mt-0.5">
        {value || "—"}
      </p>
    </div>
  </div>
);

// ─── Section Card ──────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-surface rounded-xl border border-border shadow-sm">
    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
      {Icon && <Icon size={15} className="text-text-muted" />}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="bg-surface rounded-xl border border-border p-6 flex gap-4">
      <div className="w-14 h-14 rounded-full bg-border shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-5 bg-border rounded w-56" />
        <div className="h-3 bg-border rounded w-40" />
        <div className="h-3 bg-border rounded w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-background rounded-xl border border-border p-5 h-20"
        />
      ))}
    </div>
  </div>
);

// ─── Daily Columns ───────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const statusMap = {
    PRESENT: {
      bg: "bg-present-bg",
      text: "text-present-text",
      label: "Present",
    },
    HALF_DAY: {
      bg: "bg-halfday-bg",
      text: "text-halfday-text",
      label: "Half Day",
    },
    LATE: { bg: "bg-late-bg", text: "text-late-text", label: "Late" },
    OVERTIME: {
      bg: "bg-overtime-bg",
      text: "text-overtime-text",
      label: "Overtime",
    },
    WORK_FROM_HOME: {
      bg: "bg-wfh-bg",
      text: "text-wfh-text",
      label: "Work From Home",
    },
    ABSENT: {
      bg: "bg-absent-bg",
      text: "text-absent-text",
      label: "Absent",
    },
    LEAVE: {
      bg: "bg-absent-bg",
      text: "text-absent-text",
      label: "Leave",
    },
    HOLIDAY: {
      bg: "bg-holiday-bg",
      text: "text-holiday-text",
      label: "Holiday",
    },
    WEEKOFF: {
      bg: "bg-holiday-bg",
      text: "text-holiday-text",
      label: "Week Off",
    },
  };

  const config = statusMap[status] || {
    bg: "bg-background",
    text: "text-text-muted",
    label: status || "—",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

const buildDailyColumns = () => [
  {
    header: "Date",
    key: "date",
    render: (row) => (
      <span className="text-sm font-medium text-text-primary">
        {row.date || "—"}
      </span>
    ),
  },
  {
    header: "Day",
    key: "day",
    render: (row) => (
      <span className="text-sm text-text-secondary">{row.day || "—"}</span>
    ),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Check-in",
    key: "checkin",
    render: (row) => <TimeCell time={row.checkin} />,
  },
  {
    header: "Check-out",
    key: "checkout",
    render: (row) => (
      <TimeCell time={row.checkout} isDash={row.checkout === "-"} />
    ),
  },
  {
    header: "Working Hours",
    key: "workingHours",
    render: (row) => (
      <span className="text-sm font-medium text-text-primary">
        {row.workingHours || "—"}
      </span>
    ),
  },
  {
    header: "Overtime / Undertime",
    key: "overTimeUndertime",
    render: (row) => {
      const isOT =
        row.overTimeUndertime && !row.overTimeUndertime.startsWith("-");
      return (
        <span
          className={`text-sm font-mono font-medium ${
            isOT ? "text-present-text" : "text-text-secondary"
          }`}
        >
          {row.overTimeUndertime || "—"}
        </span>
      );
    },
  },
  {
    header: "Break Extra",
    key: "breakExtraTime",
    render: (row) => {
      const val = row.breakExtraTime;
      if (!val || val === "-" || val === "00:00") {
        return <span className="text-sm text-text-muted">—</span>;
      }
      return (
        <span className="text-sm font-mono font-medium text-absent-text">
          {val}
        </span>
      );
    },
  },
  {
    header: "Net OT / UT",
    key: "netExtraTime",
    render: (row) => {
      const isOT = row.netExtraTime && !row.netExtraTime.startsWith("-");
      return (
        <span
          className={`text-sm font-mono font-semibold ${
            isOT ? "text-present-text" : "text-text-secondary"
          }`}
        >
          {row.netExtraTime || "—"}
        </span>
      );
    },
  },
];

// ─── Time Cell ────────────────────────────────────────────────────────────

const TimeCell = ({ time, isDash = false }) => {
  if (isDash || !time || time === "-") {
    return <span className="text-text-muted text-sm">—</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={13} className="text-text-muted shrink-0" />
      <span className="text-sm text-text-secondary font-medium">{time}</span>
    </div>
  );
};

// ─── Export Functions ─────────────────────────────────────────────────────

const exportToExcel = async (data, employeeName, month, year) => {
  try {
    const XLSX = await import("xlsx");

    const worksheetData = [
      [`Monthly Report - ${employeeName}`],
      [`${MONTHS.find((m) => m.value === month)?.label || "Month"} ${year}`],
      [],
      [
        "Date",
        "Day",
        "Status",
        "Check-in",
        "Check-out",
        "Working Hours",
        "Attendance OT / UT",
        "Break Extra",
        "Net OT / UT",
      ],
    ];

    data.forEach((record) => {
      worksheetData.push([
        record.date || "—",
        record.day || "—",
        record.status || "—",
        record.checkin || "—",
        record.checkout || "—",
        record.workingHours || "—",
        record.overTimeUndertime || "—",
        record.breakExtraTime || "—",
        record.netExtraTime || "—",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");

    const filename = `${employeeName}_Report_${MONTHS.find((m) => m.value === month)?.label || "Month"}_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);

    toast.success("Excel file downloaded successfully");
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    toast.error("Failed to export Excel file");
  }
};

const exportToPDF = async (
  data,
  employeeName,
  month,
  year,
  { totalExtraTime, breakExtraTime, netExtraTime } = {},
) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const pdf = new jsPDF("landscape");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    const monthLabel = MONTHS.find((m) => m.value === month)?.label || "Month";
    const title = `Monthly Report - ${employeeName}`;
    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, 15, { align: "center" });

    // Add metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Period: ${monthLabel} ${year}`, 14, 25);
    pdf.text(`Attendance OT/UT: ${totalExtraTime || "00:00"}`, 14, 32);
    pdf.text(`Break Extra: ${breakExtraTime || "00:00"}`, 80, 32);
    pdf.text(`Net OT/UT: ${netExtraTime || "00:00"}`, 140, 32);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 39);
    pdf.setTextColor(0);

    // Add table
    autoTable(pdf, {
      head: [
        [
          "Date",
          "Day",
          "Status",
          "Check-in",
          "Check-out",
          "Working Hours",
          "Att OT/UT",
          "Break Extra",
          "Net OT/UT",
        ],
      ],
      body: data.map((record) => [
        record.date || "—",
        record.day || "—",
        record.status || "—",
        record.checkin || "—",
        record.checkout || "—",
        record.workingHours || "—",
        record.overTimeUndertime || "—",
        record.breakExtraTime || "—",
        record.netExtraTime || "—",
      ]),
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [13, 27, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    const filename = `${employeeName}_Report_${monthLabel}_${year}.pdf`;
    pdf.save(filename);

    toast.success("PDF file downloaded successfully");
  } catch (err) {
    console.error("Error exporting to PDF:", err);
    toast.error("Failed to export PDF file");
  }
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const UserReport = () => {
  const { employeeId } = useParams();
  const location = useLocation();

  const { month: initialMonth, year: initialYear } = location.state || {};
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Filters
  const [month, setMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(initialYear || new Date().getFullYear());

  const fetchReport = async (m = month, y = year) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await usereportApi.getUserReportById(employeeId, m, y);
      setReport(data);
    } catch (err) {
      console.error("Failed to fetch user report:", err);
      setError("User report not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [employeeId]);

  useEffect(() => {
    if (
      month !== new Date().getMonth() + 1 ||
      year !== new Date().getFullYear()
    ) {
      fetchReport(month, year);
    }
  }, [month, year]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportToExcel(report.rows || [], report.employeeName, month, year);
    } finally {
      setExporting(false);
      setExportDropdownOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(report.rows || [], report.employeeName, month, year, {
        totalExtraTime: report.totalExtraTime,
        breakExtraTime: report.breakExtraTime,
        netExtraTime: report.netExtraTime,
      });
    } finally {
      setExporting(false);
      setExportDropdownOpen(false);
    }
  };

  const monthLabel = MONTHS.find((m) => m.value === month)?.label || "Month";
  const initials =
    report?.employeeName
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  // Determine color for net / attendance extra time
  const isExtraTimePositive = !report?.totalExtraTime?.startsWith("-");
  const extraTimeColor = isExtraTimePositive
    ? "text-present-text"
    : "text-text-secondary";
  const isNetPositive = !report?.netExtraTime?.startsWith("-");
  const netExtraTimeColor = isNetPositive
    ? "text-present-text"
    : "text-text-secondary";
  const hasBreakExtra =
    report?.breakExtraTime &&
    report.breakExtraTime !== "00:00" &&
    report.breakExtraTime !== "-";

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate("/admin/reports")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            User Report
          </h1>
          <p className="text-xs text-text-secondary">
            Monthly attendance breakdown
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
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <Info size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">{error}</p>
          </div>
        ) : report ? (
          <>
            {/* ── Hero ── */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-14 h-14 rounded-full bg-text-primary text-white flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-text-primary mb-1">
                  {report.employeeName ?? "—"}
                </h2>
                <p className="text-sm text-text-muted mb-3">
                  {report.employeeId ?? "—"} · {report.department ?? "—"} ·{" "}
                  {report.designation ?? "—"}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">Report Period</p>
                    <p className="text-text-primary font-semibold mt-0.5">
                      {monthLabel} {year}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">
                      Total Daily Records
                    </p>
                    <p className="text-text-primary font-semibold mt-0.5">
                      {report.rows?.length || 0} days
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">
                      Attendance OT / UT
                    </p>
                    <p
                      className={`font-mono font-semibold mt-0.5 ${extraTimeColor}`}
                    >
                      {report.totalExtraTime || "00:00"}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">Break Extra</p>
                    <p
                      className={`font-mono font-semibold mt-0.5 ${
                        hasBreakExtra ? "text-absent-text" : "text-text-muted"
                      }`}
                    >
                      {report.breakExtraTime || "00:00"}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">Net OT / UT</p>
                    <p
                      className={`font-mono font-semibold mt-0.5 ${netExtraTimeColor}`}
                    >
                      {report.netExtraTime || "00:00"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Working Days"
                value={report.rows?.length || 0}
                icon={Calendar}
                valueColor="text-text-primary"
              />
              <StatCard
                label="Attendance OT / UT"
                value={report.totalExtraTime || "00:00"}
                icon={Clock}
                valueColor={extraTimeColor}
              />
              <StatCard
                label="Break Extra"
                value={report.breakExtraTime || "00:00"}
                icon={Clock}
                valueColor={hasBreakExtra ? "text-absent-text" : "text-text-muted"}
              />
              <StatCard
                label="Net OT / UT"
                value={report.netExtraTime || "00:00"}
                icon={Clock}
                valueColor={netExtraTimeColor}
              />
            </div>

            {/* ── Employee Info ── */}
            <SectionCard title="Employee Details" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={report.employeeName}
                />
                <InfoRow
                  icon={Calendar}
                  label="Employee ID"
                  value={report.employeeId}
                />
                <InfoRow
                  icon={Building2}
                  label="Department"
                  value={report.department}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Designation"
                  value={report.designation}
                />
              </div>
            </SectionCard>

            {/* ── Daily Records Table ── */}
            <section className="bg-surface rounded-xl border border-border shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-text-primary">
                  Daily Attendance Records
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {report.rows?.length || 0} working day
                  {report.rows?.length !== 1 ? "s" : ""}
                </p>
              </div>
              {/* ── Filters ── */}

              <div className="flex py-4 px-6 flex-col sm:flex-row gap-3">
                <div className="based flex-1 sm:flex-initial">
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                    Month
                  </label>
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
                </div>

                <div className="flex-1 sm:flex-initial">
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                    Year
                  </label>
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
                </div>

                <div className="sm:ml-auto relative mt-auto">
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    disabled={exporting || !report.rows?.length}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

              <div className="p-4 overflow-x-auto">
                <DataTable
                  columns={buildDailyColumns()}
                  rows={report.rows || []}
                  rowIdKey="date"
                  selectable={false}
                  emptyText="No attendance records found for this period"
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};

export default UserReport;
