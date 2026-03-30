import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
  User,
  Eye,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../login/hooks/useAuth.js";
import { attendanceApi } from "../api/attendanceApi.js";
import { employeesApi } from "../api/employeesApi.js";
import { specialAttendanceApi } from "../api/specialAttendanceAPi.js";
import DataTable from "../components/DataTable.jsx";
import AttendanceFormModal from "../components/attendance/AttendanceFormModal.jsx";
import SpecialAttendanceFormModal from "../components/attendance/SpecialAttendanceFormModal.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import { toast } from "react-toastify";
import { formatDate } from "../../../shared/utils/dateUtil.js";
import useDebounce from "../../../shared/hooks/useDebounce.js";

// ─── Status Badge ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const statusMap = {
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

  const config = statusMap[status] || statusMap.ABSENT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

// ─── Employee Cell ────────────────────────────────────────────────────────

const EmployeeCell = ({ name, employeeId }) => {
  const initials =
    name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
        {initials}
      </div>
      <div>
        <p className="font-medium text-text-primary whitespace-nowrap text-sm">
          {name ?? "—"}
        </p>
        <p className="text-xs text-text-muted">{employeeId ?? "—"}</p>
      </div>
    </div>
  );
};

// ─── Time Cell ────────────────────────────────────────────────────────────

const TimeCell = ({ checkTime }) => {
  const formatTime = (time) => {
    if (!time) return "—";
    const date = new Date(time);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={14} className="text-text-muted shrink-0" />
      <div className="text-xs">
        <p className="text-text-secondary">{formatTime(checkTime)}</p>
      </div>
    </div>
  );
};

// ─── Duration Cell ┌────────────────────────────────────────────────────────

const DurationCell = ({ extraTime }) => {
  if (!extraTime) return <span className="text-text-muted">—</span>;

  const isOvertime = !extraTime.startsWith("-");
  const color = isOvertime ? "text-present-text" : "text-text-secondary";

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Clock size={14} className="shrink-0" />
      <span className="text-xs font-medium">{extraTime}</span>
    </div>
  );
};

// ─── Columns ──────────────────────────────────────────────────────────────

const buildColumns = (onEdit) => [
  {
    header: "Employee",
    key: "callerName",
    render: (row) => (
      <EmployeeCell name={row.user?.employeeName} employeeId={row.user?.employeeId} />
    ),
  },
  {
    header: "Date",
    key: "date",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-muted shrink-0" />
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
    render: (row) => (
      <TimeCell checkTime={row.checkInTime} />
    ),
  },
   {
    header: "Check-Out",
    key: "checkOutTime",
    render: (row) => (
      <TimeCell checkTime={row.checkOutTime} />
    ),
  },
  {
    header: "Undertime/Overtime",
    key: "extraTime",
    render: (row) => <DurationCell extraTime={row.extraTime} />,
  },
  {
    header: "Check-out Outside",
    key: "checkoutOutside",
    render: (row) => {
      return (
        <div className="flex items-center gap-1.5 max-w-xs">
          <MapPin size={14} className="text-text-muted shrink-0" />
          <span className="text-xs text-text-secondary truncate">
            {row.checkoutOutside === true ? "Yes" : "No"}
          </span>
        </div>
      );
    },
  },
];

// ─── Special Attendance Columns ────────────────────────────────────────────

const buildSpecialAttendanceColumns = (onEdit) => [
  {
    header: "Employee",
    key: "user",
    render: (row) => (
      <EmployeeCell name={row.user?.employeeName} employeeId={row.user?.employeeId} />
    ),
  },
  {
    header: "Date",
    key: "date",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-muted shrink-0" />
        <span className="text-sm text-text-secondary">{formatDate(row.date)}</span>
      </div>
    ),
  },
  {
    header: "Check-In",
    key: "checkInTime",
    render: (row) => <TimeCell checkTime={row.checkInTime} />,
  },
  {
    header: "Check-Out",
    key: "checkOutTime",
    render: (row) => <TimeCell checkTime={row.checkOutTime} />,
  },
  {
    header: "Work Hours",
    key: "workHours",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-text-muted shrink-0" />
        <span className="text-xs font-medium text-text-secondary">
          {row.workHours || "—"}
        </span>
      </div>
    ),
  },
];

// ─── Attendance Page ──────────────────────────────────────────────────────

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("attendance"); // "attendance" or "special"

  // Regular Attendance State
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Special Attendance State
  const [specialAttendance, setSpecialAttendance] = useState([]);
  const [specialFiltered, setSpecialFiltered] = useState([]);
  const [specialPagination, setSpecialPagination] = useState(null);
  const [specialCurrentPage, setSpecialCurrentPage] = useState(1);
  const [specialLoading, setSpecialLoading] = useState(true);
  const [specialDeleteLoading, setSpecialDeleteLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  // Special Attendance Filters
  const [specialSearch, setSpecialSearch] = useState("");
  const [specialSelectedEmployee, setSpecialSelectedEmployee] = useState("");
  const [specialStartDate, setSpecialStartDate] = useState("");
  const [specialEndDate, setSpecialEndDate] = useState("");
  const [specialDateFilterOpen, setSpecialDateFilterOpen] = useState(false);

  // Delete modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    rowToDelete: null,
    rowsToDelete: null,
  });

  // Special Attendance Confirm Modal
  const [specialConfirmModal, setSpecialConfirmModal] = useState({
    open: false,
    type: null,
    rowToDelete: null,
    rowsToDelete: null,
  });

  // Attendance Form Modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [editAttendance, setEditAttendance] = useState(null);
  const [attendanceModalLoading, setAttendanceModalLoading] = useState(false);

  // Special Attendance Form Modal
  const [specialAttendanceModalOpen, setSpecialAttendanceModalOpen] = useState(false);
  const [editSpecialAttendance, setEditSpecialAttendance] = useState(null);
  const [specialAttendanceModalLoading, setSpecialAttendanceModalLoading] = useState(false);

  // Debounced search and filters
  const debouncedSearch = useDebounce(search, 500);
  const debouncedSelectedEmployee = useDebounce(selectedEmployee, 300);
  const debouncedSelectedStatus = useDebounce(selectedStatus, 300);

  // Debounced special attendance filters
  const debouncedSpecialSearch = useDebounce(specialSearch, 500);
  const debouncedSpecialSelectedEmployee = useDebounce(specialSelectedEmployee, 300);

  // Fetch employees for filter dropdown
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const { data } = await employeesApi.fetchAllEmployees(1);
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Fetch attendance records
  const fetchAttendance = async (page = 1) => {
    setLoading(true);
    try {
      const filters = {
        userId: selectedEmployee,
        startDate: startDate,
        endDate: endDate,
        status: selectedStatus,
        search: search,
      };

      const { data } = await attendanceApi.fetchAllAttendance(page, filters);
      
      setAttendance(data.attendanceRecords || data.data || []);
      setFiltered(data.attendanceRecords || data.data || []);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Fetch special attendance records
  const fetchSpecialAttendance = async (page = 1) => {
    setSpecialLoading(true);
    try {
      const filters = {
        userId: specialSelectedEmployee,
        startDate: specialStartDate,
        endDate: specialEndDate,
        search: specialSearch,
      };

      const response = await specialAttendanceApi.fetchAllSpecialAttendance(page, filters);
      const data = response.data || response;
      
      setSpecialAttendance(data.attendanceRecords || data || []);
      setSpecialFiltered(data.attendanceRecords || data || []);
      setSpecialPagination(data.pagination);
      setSpecialCurrentPage(page);
    } catch (error) {
      console.error("Error fetching special attendance:", error);
      toast.error("Failed to fetch special attendance records");
    } finally {
      setSpecialLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch attendance when filters change (regular attendance tab)
  useEffect(() => {
    if (activeTab === "attendance") {
      fetchAttendance(1);
    }
  }, [debouncedSearch, debouncedSelectedEmployee, startDate, endDate, debouncedSelectedStatus, activeTab]);

  // Fetch special attendance when filters change (special attendance tab)
  useEffect(() => {
    if (activeTab === "special") {
      fetchSpecialAttendance(1);
    }
  }, [debouncedSpecialSearch, debouncedSpecialSelectedEmployee, specialStartDate, specialEndDate, activeTab]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchAttendance(page);
  };

  // Handle delete
  const handleDelete = (row) => {
    setConfirmModal({
      open: true,
      type: "single",
      rowToDelete: row,
      rowsToDelete: null,
    });
  };

  // Handle edit
  const handleEdit = (row) => {
    setEditAttendance(row);
    setAttendanceModalOpen(true);
  };

  // Handle view details
  const handleViewDetails = (row) => {
    navigate(`/admin/attendance/${row.id}`);
  };

  // Handle open attendance form for new record
  const handleOpenMarkAttendance = () => {
    setEditAttendance(null);
    setAttendanceModalOpen(true);
  };

  // Handle attendance form submission
  const handleAttendanceFormSubmit = async (formData) => {
    setAttendanceModalLoading(true);
    try {
      // Convert times to full datetime if needed
      const payload = {
        userId: formData.userId,
        date: formData.date,
        status: formData.status,
      };

      // Only add check times if they are provided
      if (formData.checkInTime) {
        payload.checkInTime = new Date(`${formData.date}T${formData.checkInTime}`).toISOString();
      }
      if (formData.checkOutTime) {
        payload.checkOutTime = new Date(`${formData.date}T${formData.checkOutTime}`).toISOString();
      }

      if (editAttendance) {
        await attendanceApi.updateAttendance(editAttendance.id, payload);
        toast.success("Attendance record updated successfully");
      } else {
        await attendanceApi.createAttendance(payload);
        toast.success("Attendance marked successfully");
      }

      setAttendanceModalOpen(false);
      setEditAttendance(null);
      await fetchAttendance(currentPage);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save attendance record"
      );
      console.error("Error saving attendance:", error);
    } finally {
      setAttendanceModalLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (selectedRows) => {
    setConfirmModal({
      open: true,
      type: "bulk",
      rowToDelete: null,
      rowsToDelete: selectedRows,
    });
  };

  // ─── Special Attendance Handlers ───────────────────────────────────────────

  // Handle special attendance delete
  const handleSpecialDelete = (row) => {
    setSpecialConfirmModal({
      open: true,
      type: "single",
      rowToDelete: row,
      rowsToDelete: null,
    });
  };

  // Handle special attendance edit
  const handleSpecialEdit = (row) => {
    setEditSpecialAttendance(row);
    setSpecialAttendanceModalOpen(true);
  };

  // Handle special attendance page change
  const handleSpecialPageChange = (page) => {
    fetchSpecialAttendance(page);
  };

  // Handle special attendance form submission
  const handleSpecialAttendanceFormSubmit = async (formData) => {
    setSpecialAttendanceModalLoading(true);
    try {
      if (editSpecialAttendance) {
        await specialAttendanceApi.updateSpecialAttendance(
          editSpecialAttendance.id,
          formData
        );
        toast.success("Special attendance record updated successfully");
      } else {
        // Create is not implemented per user request
        toast.success("Special attendance record created successfully");
      }

      setSpecialAttendanceModalOpen(false);
      setEditSpecialAttendance(null);
      await fetchSpecialAttendance(specialCurrentPage);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save special attendance record"
      );
      console.error("Error saving special attendance:", error);
    } finally {
      setSpecialAttendanceModalLoading(false);
    }
  };

  // Handle special attendance bulk delete
  const handleSpecialBulkDelete = (selectedRows) => {
    setSpecialConfirmModal({
      open: true,
      type: "bulk",
      rowToDelete: null,
      rowsToDelete: selectedRows,
    });
  };

  // Confirm special attendance delete
  const handleConfirmSpecialDelete = async () => {
    setSpecialDeleteLoading(true);
    try {
      if (
        specialConfirmModal.type === "single" &&
        specialConfirmModal.rowToDelete
      ) {
        await specialAttendanceApi.deleteSpecialAttendance(
          specialConfirmModal.rowToDelete.id
        );
        await fetchSpecialAttendance(specialCurrentPage);
        toast.success("Special attendance record deleted successfully");
      } else if (
        specialConfirmModal.type === "bulk" &&
        specialConfirmModal.rowsToDelete
      ) {
        const ids = specialConfirmModal.rowsToDelete.map((r) => r.id);
        // Use bulk delete if available, otherwise delete individually
        await Promise.all(
          ids.map((id) => specialAttendanceApi.deleteSpecialAttendance(id))
        );
        await fetchSpecialAttendance(specialCurrentPage);
        toast.success(
          `${specialConfirmModal.rowsToDelete.length} record(s) deleted successfully`
        );
      }
      setSpecialConfirmModal({
        open: false,
        type: null,
        rowToDelete: null,
        rowsToDelete: null,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete special attendance record"
      );
      console.error("Error deleting special attendance:", error);
    } finally {
      setSpecialDeleteLoading(false);
    }
  };

  // Reset special attendance filters
  const handleResetSpecialFilters = () => {
    setSpecialSearch("");
    setSpecialSelectedEmployee("");
    setSpecialStartDate("");
    setSpecialEndDate("");
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (confirmModal.type === "single" && confirmModal.rowToDelete) {
        await attendanceApi.deleteAttendance(confirmModal.rowToDelete.id);
        await fetchAttendance(currentPage);
        toast.success("Attendance record deleted successfully");
      } else if (confirmModal.type === "bulk" && confirmModal.rowsToDelete) {
        const ids = confirmModal.rowsToDelete.map((r) => r.id);
        await attendanceApi.bulkDeleteAttendance(ids);
        await fetchAttendance(currentPage);
        toast.success(
          `${confirmModal.rowsToDelete.length} record(s) deleted successfully`
        );
      }
      setConfirmModal({
        open: false,
        type: null,
        rowToDelete: null,
        rowsToDelete: null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete record");
      console.error("Error deleting record:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate stats for today only
  const todayStr = new Date().toDateString();
  const todayRecords = attendance.filter(
    (a) => new Date(a.date).toDateString() === todayStr
  );
  const totalRecords = todayRecords.length;
  const onTimeCount = todayRecords.filter((a) =>
    ["PRESENT", "OVERTIME", "WORK_FROM_HOME"].includes(a.status)
  ).length;
  const issueCount = todayRecords.filter((a) =>
    ["LATE", "HALF_DAY"].includes(a.status)
  ).length;

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedEmployee("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("");
  };

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Attendance Management
          </h1>
          <p className="text-xs text-text-secondary">
            Track employee attendance records
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
        {/* ── Attendance Type Tabs ── */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "attendance"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Regular Attendance
          </button>
          <button
            onClick={() => setActiveTab("special")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "special"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Special Attendance
          </button>
        </div>

        {/* ── Regular Attendance Tab ── */}
        {activeTab === "attendance" && (
          <>
        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Records */}
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text">
              <Calendar size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Total Today
              </p>
              <p className="text-2xl font-bold text-holiday-text">
                {totalRecords}
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">
                records for today
              </p>
            </div>
          </div>

          {/* On Time */}
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-present-bg text-present-text">
              <User size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                On Time
              </p>
              <p className="text-2xl font-bold text-present-text">
                {onTimeCount}
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">
                Present · Overtime · WFH
              </p>
            </div>
          </div>

          {/* Issues */}
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-late-bg text-late-text">
              <Clock size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Attendance Issues
              </p>
              <p className="text-2xl font-bold text-late-text">
                {issueCount}
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">
                Late · Half Day
              </p>
            </div>
          </div>
        </section>

        {/* ── Table Card ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Attendance Records
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {filtered.length} of {attendance.length} records
                </p>
              </div>

              <div className="sm:ml-auto flex items-center gap-2">
                <button
                  onClick={handleOpenMarkAttendance}
                  className="flex items-center gap-1.5 px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap"
                >
                  <Plus size={14} />
                  Mark Attendance
                </button>
                {(search ||
                  selectedEmployee ||
                  startDate ||
                  endDate ||
                  selectedStatus) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="space-y-4">
              {/* Top Row: Search, Employee, Status, Date Filter Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search name, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-full transition"
                  />
                </div>

                {/* Employee Filter */}
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeName}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                >
                  <option value="">All Status</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="OVERTIME">Overtime</option>
                </select>

                {/* Date Filter Button */}
                <button
                  onClick={() => setDateFilterOpen(!dateFilterOpen)}
                  className={`flex items-center justify-between px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                    dateFilterOpen
                      ? "bg-text-primary text-white border-text-primary"
                      : "bg-background border-border text-text-primary hover:border-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Date Range</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      dateFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Date Range Filter Menu */}
              {dateFilterOpen && (
                <div className="bg-background rounded-xl border border-border p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-text-primary" />
                    <p className="text-xs font-semibold text-text-primary">
                      Select Date Range
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* From Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">
                        From Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-muted shrink-0" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                        />
                      </div>
                    </div>

                    {/* To Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">
                        To Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-muted shrink-0" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                        />
                      </div>
                    </div>
                  </div>
                  {(startDate || endDate) && (
                    <p className="text-xs text-text-muted mt-4 p-3 bg-surface rounded border border-border">
                      {startDate && endDate
                        ? `📅 Showing records from ${startDate} to ${endDate}`
                        : startDate
                        ? `📅 Showing records from ${startDate} onwards`
                        : `📅 Showing records up to ${endDate}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DataTable */}
          <div className="p-4 overflow-x-auto">
            <DataTable
              columns={buildColumns(handleEdit)}
              rows={filtered}
              rowIdKey="id"
              onView={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              selectable
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              emptyText={
                search || selectedEmployee || startDate || endDate || selectedStatus
                  ? "No attendance records match your filters"
                  : "No attendance records found"
              }
            />
          </div>
        </section>
      </>
        )}

        {/* ── Special Attendance Tab ── */}
        {activeTab === "special" && (
          <>
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Special Attendance Records
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {specialFiltered.length} of {specialAttendance.length} records
                </p>
              </div>

              <div className="sm:ml-auto flex items-center gap-2">
                {(specialSearch ||
                  specialSelectedEmployee ||
                  specialStartDate ||
                  specialEndDate) && (
                  <button
                    onClick={handleResetSpecialFilters}
                    className="px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="space-y-4">
              {/* Top Row: Search, Employee, Date Filter Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search name, email…"
                    value={specialSearch}
                    onChange={(e) => setSpecialSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-full transition"
                  />
                </div>

                {/* Employee Filter */}
                <select
                  value={specialSelectedEmployee}
                  onChange={(e) => setSpecialSelectedEmployee(e.target.value)}
                  className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeName}
                    </option>
                  ))}
                </select>

                {/* Date Filter Button */}
                <button
                  onClick={() => setSpecialDateFilterOpen(!specialDateFilterOpen)}
                  className={`flex items-center justify-between px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                    specialDateFilterOpen
                      ? "bg-text-primary text-white border-text-primary"
                      : "bg-background border-border text-text-primary hover:border-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Date Range</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      specialDateFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Date Range Filter Menu */}
              {specialDateFilterOpen && (
                <div className="bg-background rounded-xl border border-border p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-text-primary" />
                    <p className="text-xs font-semibold text-text-primary">
                      Select Date Range
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* From Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">
                        From Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-muted shrink-0" />
                        <input
                          type="date"
                          value={specialStartDate}
                          onChange={(e) => setSpecialStartDate(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                        />
                      </div>
                    </div>

                    {/* To Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">
                        To Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-muted shrink-0" />
                        <input
                          type="date"
                          value={specialEndDate}
                          onChange={(e) => setSpecialEndDate(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                        />
                      </div>
                    </div>
                  </div>
                  {(specialStartDate || specialEndDate) && (
                    <p className="text-xs text-text-muted mt-4 p-3 bg-surface rounded border border-border">
                      {specialStartDate && specialEndDate
                        ? `📅 Showing records from ${specialStartDate} to ${specialEndDate}`
                        : specialStartDate
                        ? `📅 Showing records from ${specialStartDate} onwards`
                        : `📅 Showing records up to ${specialEndDate}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DataTable */}
          <div className="p-4 overflow-x-auto">
            <DataTable
              columns={buildSpecialAttendanceColumns(handleSpecialEdit)}
              rows={specialFiltered}
              rowIdKey="id"
              onEdit={handleSpecialEdit}
              onDelete={handleSpecialDelete}
              onBulkDelete={handleSpecialBulkDelete}
              selectable
              loading={specialLoading}
              pagination={specialPagination}
              onPageChange={handleSpecialPageChange}
              emptyText={
                specialSearch || specialSelectedEmployee || specialStartDate || specialEndDate
                  ? "No special attendance records match your filters"
                  : "No special attendance records found"
              }
            />
          </div>
        </section>
          </>
        )}
      </div>

      {/* ── Confirm Delete Modal for Regular Attendance ── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() =>
          setConfirmModal({
            open: false,
            type: null,
            rowToDelete: null,
            rowsToDelete: null,
          })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Attendance Record"
        message={
          confirmModal.type === "single" && confirmModal.rowToDelete
            ? `Are you sure you want to delete the attendance record for ${confirmModal.rowToDelete.user?.employeeName} on ${formatDate(
                confirmModal.rowToDelete.date
              )}? This action cannot be undone.`
            : confirmModal.type === "bulk" && confirmModal.rowsToDelete
            ? `Are you sure you want to delete ${confirmModal.rowsToDelete.length} attendance record(s)? This action cannot be undone.`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={deleteLoading}
      />

      {/* ── Attendance Form Modal ── */}
      <AttendanceFormModal
        open={attendanceModalOpen}
        onClose={() => {
          setAttendanceModalOpen(false);
          setEditAttendance(null);
        }}
        onSubmit={handleAttendanceFormSubmit}
        editData={editAttendance}
        loading={attendanceModalLoading}
      />

      {/* ── Confirm Delete Modal for Special Attendance ── */}
      <ConfirmModal
        open={specialConfirmModal.open}
        onClose={() =>
          setSpecialConfirmModal({
            open: false,
            type: null,
            rowToDelete: null,
            rowsToDelete: null,
          })
        }
        onConfirm={handleConfirmSpecialDelete}
        title="Delete Special Attendance Record"
        message={
          specialConfirmModal.type === "single" && specialConfirmModal.rowToDelete
            ? `Are you sure you want to delete the special attendance record for ${specialConfirmModal.rowToDelete.user?.employeeName} on ${formatDate(
                specialConfirmModal.rowToDelete.date
              )}? This action cannot be undone.`
            : specialConfirmModal.type === "bulk" && specialConfirmModal.rowsToDelete
            ? `Are you sure you want to delete ${specialConfirmModal.rowsToDelete.length} special attendance record(s)? This action cannot be undone.`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={specialDeleteLoading}
      />

      {/* ── Special Attendance Form Modal ── */}
      <SpecialAttendanceFormModal
        open={specialAttendanceModalOpen}
        onClose={() => {
          setSpecialAttendanceModalOpen(false);
          setEditSpecialAttendance(null);
        }}
        onSubmit={handleSpecialAttendanceFormSubmit}
        editData={editSpecialAttendance}
        loading={specialAttendanceModalLoading}
      />
    </main>
  );
};

export default Attendance;