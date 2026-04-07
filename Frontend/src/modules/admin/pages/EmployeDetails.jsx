import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  MapPin,
  Calendar,
  Shield,
  Hash,
  User,
  CalendarCheck,
  ChevronRight,
  ChevronDown,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { employeesApi } from "../api/employeesApi.js";
import { attendanceApi } from "../api/attendanceApi.js";
import DataTable from "../components/DataTable.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import EmployeePinModal from "../components/employee/EmployeePinModal.jsx";
import useAuth from "../../login/hooks/useAuth.js";
import { formatDate } from "../../../shared/utils/dateUtil.js";
import { parseShiftTime } from "../utils/shiftTimeUtil.js";

// ─── Status Badge ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    PRESENT: { bg: "bg-present-bg", text: "text-present-text", label: "Present" },
    HALF_DAY: { bg: "bg-halfday-bg", text: "text-halfday-text", label: "Half Day" },
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
  };
  const config = map[status] || map.ABSENT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

// ─── Info Row ──────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p className="text-sm text-text-primary font-semibold mt-0.5 wrap-break-word">
        {value || "—"}
      </p>
    </div>
  </div>
);

// ─── Section Card ──────────────────────────────────────────────────────────

const SectionCard = ({ title, children }) => (
  <div className="bg-surface rounded-xl border border-border shadow-sm">
    <div className="px-5 py-4 border-b border-border">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, bg, textColor }) => (
  <div className={`rounded-xl border border-border p-4 flex flex-col gap-1 ${bg}`}>
    <p className="text-xs font-medium text-text-secondary">{label}</p>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
  </div>
);

// ─── Time Cell ─────────────────────────────────────────────────────────────

const TimeCell = ({ time }) => {
  if (!time) return <span className="text-text-muted text-xs">—</span>;
  const d = new Date(time);
  const formatted = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={13} className="text-text-muted shrink-0" />
      <span className="text-xs text-text-secondary">{formatted}</span>
    </div>
  );
};

// ─── Attendance Columns ────────────────────────────────────────────────────

const attendanceColumns = [
  {
    header: "Date",
    key: "date",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-text-muted shrink-0" />
        <span className="text-sm text-text-secondary">{formatDate(row.date)}</span>
      </div>
    ),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Check-In",
    key: "checkInTime",
    render: (row) => <TimeCell time={row.checkInTime} />,
  },
  {
    header: "Check-Out",
    key: "checkOutTime",
    render: (row) => <TimeCell time={row.checkOutTime} />,
  },
  {
    header: "Undertime / Overtime",
    key: "extraTime",
    render: (row) => {
      if (!row.extraTime) return <span className="text-text-muted text-xs">—</span>;
      const isOvertime = !row.extraTime.startsWith("-");
      return (
        <div className={`flex items-center gap-1 ${isOvertime ? "text-present-text" : "text-text-secondary"}`}>
          <Clock size={13} className="shrink-0" />
          <span className="text-xs font-medium">{row.extraTime}</span>
        </div>
      );
    },
  },
  {
    header: "Check-out Outside",
    key: "checkoutOutside",
    render: (row) => (
      <span className="text-xs text-text-secondary">
        {row.checkoutOutside === true ? "Yes" : "No"}
      </span>
    ),
  },
];

// ─── Weekend Day Labels ────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseJson = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const EmployeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [empLoading, setEmpLoading] = useState(true);

  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [attLoading, setAttLoading] = useState(true);

  // Attendance filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  // Reset PIN modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [resetPin, setResetPin] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // ── Fetch employee details
  const fetchEmployee = async () => {
    setEmpLoading(true);
    try {
      const { data } = await employeesApi.getEmployee(id);
      setEmployee(data.employee || data);
    } catch (err) {
      console.error("Failed to fetch employee:", err);
    } finally {
      setEmpLoading(false);
    }
  };

  // ── Fetch attendance for this employee
  const fetchAttendance = async (page = 1) => {
    setAttLoading(true);
    try {
      const { data } = await attendanceApi.fetchAllAttendance(page, {
        userId: id,
        startDate,
        endDate,
        status: selectedStatus,
      });
      setAttendance(data.attendanceRecords || data.data || []);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setAttLoading(false);
    }
  };

  // ── Handle Reset PIN
  const handleResetPin = () => {
    setConfirmModalOpen(true);
  };

  // ── Confirm Reset PIN
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const { data } = await employeesApi.resetEmployeePin({
        email: employee.email,
        phoneNumber: employee.mobileNumber,
      });
      setResetPin(data.tempPin || "N/A");
      setConfirmModalOpen(false);
      setPinModalOpen(true);
      toast.success("PIN reset successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset PIN. Please try again.");
      console.error("Failed to reset PIN:", err);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => { fetchEmployee(); }, [id]);
  useEffect(() => { fetchAttendance(1); }, [id, startDate, endDate, selectedStatus]);

  // ── Derived stats from current page data
  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const overtimeCount = attendance.filter((a) => a.status === "OVERTIME").length;

  const workLocation = parseJson(employee?.workLocation);
  const weekendOff = parseJson(employee?.weekendOff);
  const shiftTime = parseShiftTime(employee?.shift ?? "");

  const initials =
    employee?.employeeName
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate("/admin/employees")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Employee Details
          </h1>
          <p className="text-xs text-text-secondary">
            Full profile and attendance history
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
        {empLoading ? (
          /* ── Employee Skeleton ── */
          <div className="animate-pulse space-y-6">
            <div className="bg-surface rounded-xl border border-border p-6 flex gap-4">
              <div className="w-16 h-16 rounded-full bg-border shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-border rounded w-48" />
                <div className="h-3 bg-border rounded w-32" />
                <div className="h-3 bg-border rounded w-24" />
              </div>
            </div>
          </div>
        ) : employee ? (
          <>
            {/* ── Profile Hero ── */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start justify-between">
              <div className="flex flex-col sm:flex-row gap-5 items-start flex-1 min-w-0">
                <div className="w-16 h-16 rounded-full bg-text-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-text-primary">
                      {employee.employeeName ?? "—"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-holiday-bg text-holiday-text">
                      {employee.userType ?? "EMPLOYEE"}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-3">
                    {(employee.designation?.name ?? employee.designation ?? employee.designationId) || "—"} ·{"\ "}
                    {(employee.department?.name ?? employee.department ?? employee.departmentId) || "—"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Hash size={13} className="text-text-muted" />
                      {employee.employeeId ?? "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Mail size={13} className="text-text-muted" />
                      {employee.email ?? "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Phone size={13} className="text-text-muted" />
                      {employee.mobileNumber ?? "—"}
                    </div>
                    {employee.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Calendar size={13} className="text-text-muted" />
                        Joined {formatDate(employee.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleResetPin}
                  disabled={isResetting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-text-primary text-white hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Reset PIN
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Detail Cards Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Personal Info */}
              <SectionCard title="Personal Info">
                <div className="space-y-4">
                  <InfoRow icon={User} label="Full Name" value={employee.employeeName} />
                  <InfoRow icon={Hash} label="Employee ID" value={employee.employeeId} />
                  <InfoRow icon={Mail} label="Email" value={employee.email} />
                  <InfoRow icon={Phone} label="Mobile" value={employee.mobileNumber} />
                </div>
              </SectionCard>

              {/* Work Info */}
              <SectionCard title="Work Info">
                <div className="space-y-4">
                  <InfoRow icon={Building2} label="Department" value={employee.department?.name ?? employee.department} />
                  <InfoRow icon={Briefcase} label="Designation" value={employee.designation?.name ?? employee.designation} />
                  <InfoRow icon={Shield} label="User Type" value={employee.userType} />
                  <InfoRow
                    icon={Clock}
                    label="Shift"
                    value={
                      shiftTime.startTime && shiftTime.endTime
                        ? `${shiftTime.startTime} – ${shiftTime.endTime}`
                        : employee.shift || null
                    }
                  />
                </div>
              </SectionCard>

              {/* Schedule & Location */}
              <SectionCard title="Schedule & Location">
                <div className="space-y-4">
                  {/* Weekend Off */}
                  <div>
                    <p className="text-xs text-text-muted font-medium mb-2">Weekend Off</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((day, i) => {
                        const isOff = Array.isArray(weekendOff) && weekendOff.includes(i);
                        return (
                          <span
                            key={day}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              isOff
                                ? "bg-absent-bg text-absent-text"
                                : "bg-background text-text-muted border border-border"
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Work Location */}
                  {workLocation ? (
                    <div>
                      <p className="text-xs text-text-muted font-medium mb-1.5 flex items-center gap-1">
                        <MapPin size={13} />
                        Work Location
                      </p>
                      {workLocation.address && (
                        <p className="text-sm text-text-primary font-semibold mb-1">
                          {workLocation.address}
                        </p>
                      )}
                      {workLocation.lat && workLocation.lng && (
                        <p className="text-xs text-text-muted font-mono">
                          {workLocation.lat}, {workLocation.lng}
                        </p>
                      )}
                    </div>
                  ) : (
                    <InfoRow icon={MapPin} label="Work Location" value={null} />
                  )}

                  {/* Timestamps */}
                  <InfoRow
                    icon={Calendar}
                    label="Created"
                    value={employee.createdAt ? formatDate(employee.createdAt) : null}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Last Updated"
                    value={employee.updatedAt ? formatDate(employee.updatedAt) : null}
                  />
                </div>
              </SectionCard>
            </div>

            {/* ── Attendance Stats (from current filtered results) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Present (this view)" value={presentCount} bg="bg-surface" textColor="text-present-text" />
              <StatCard label="Absent (this view)" value={absentCount} bg="bg-surface" textColor="text-absent-text" />
              <StatCard label="Overtime (this view)" value={overtimeCount} bg="bg-surface" textColor="text-overtime-text" />
            </div>
          </>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-text-muted">Employee not found.</p>
          </div>
        )}

        {/* ── Attendance History ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">
                  Attendance History
                </h2>
              </div>
              {(startDate || endDate || selectedStatus) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); setSelectedStatus(""); }}
                  className="sm:ml-auto px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
              >
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="OVERTIME">Overtime</option>
                <option value="HOLIDAY">Holiday</option>
              </select>

              {/* Date Range Toggle */}
              <button
                onClick={() => setDateFilterOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  dateFilterOpen
                    ? "bg-text-primary text-white border-text-primary"
                    : "bg-background border-border text-text-primary hover:border-text-primary"
                }`}
              >
                <Calendar size={13} />
                Date Range
                <ChevronDown
                  size={13}
                  className={`transition-transform ${dateFilterOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Date Pickers */}
            {dateFilterOpen && (
              <div className="bg-background rounded-xl border border-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                  />
                </div>
                {(startDate || endDate) && (
                  <p className="text-xs text-text-muted col-span-full p-3 bg-surface rounded border border-border">
                    {startDate && endDate
                      ? `Showing records from ${startDate} to ${endDate}`
                      : startDate
                      ? `Showing records from ${startDate} onwards`
                      : `Showing records up to ${endDate}`}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 overflow-x-auto">
            <DataTable
              columns={attendanceColumns}
              rows={attendance}
              rowIdKey="id"
              loading={attLoading}
              pagination={pagination}
              onPageChange={(page) => fetchAttendance(page)}
              emptyText={
                startDate || endDate || selectedStatus
                  ? "No attendance records match your filters"
                  : "No attendance records found"
              }
            />
          </div>
        </section>
      </div>

      {/* ── Reset PIN Modals ── */}
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Employee PIN"
        message="Are you sure you want to reset this employee's PIN? They will receive a temporary PIN via email."
        confirmText="Reset PIN"
        cancelText="Cancel"
        isDangerous={true}
        loading={isResetting}
      />

      <EmployeePinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        email={employee?.email}
        pin={resetPin}
        employeeName={employee?.employeeName}
      />
    </main>
  );
};

export default EmployeDetails;
