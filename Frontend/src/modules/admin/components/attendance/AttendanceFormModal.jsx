import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  User,
  Calendar,
  Clock,
  CheckCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { employeesApi } from "../../api/employeesApi.js";
import useDebounce from "../../../../shared/hooks/useDebounce";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "OVERTIME", label: "Overtime" },
  { value: "WORK_FROM_HOME", label: "Work From Home" },
  { value: "HALF_DAY", label: "Half Day" },
];

const EMPTY_FORM = {
  userId: "",
  date: "",
  checkInTime: "",
  checkOutTime: "",
  status: "PRESENT",
};

// ─── Field Component ──────────────────────────────────────────────────────────

const Field = ({ label, required, error, children, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-text-primary tracking-wide">
      {label}
      {required && <span className="text-absent-text ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-absent-text flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-absent-text inline-block" />
        {error}
      </p>
    )}
  </div>
);

// ─── Input class helpers ──────────────────────────────────────────────────────

const inputBase =
  "w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all";
const inputNormal = `${inputBase} border-border focus:border-text-primary focus:ring-2 focus:ring-black/8`;
const inputError = `${inputBase} border-absent-text focus:border-absent-text focus:ring-2 focus:ring-absent-text/15`;

const cls = (err) => (err ? inputError : inputNormal);

// ─── Icon Input Wrapper ───────────────────────────────────────────────────────

const IconInput = ({ icon: Icon, children, selectMode = false }) => (
  <div className="relative">
    <Icon
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
    />
    {selectMode && (
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    )}
    {children}
  </div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────

const Divider = ({ label }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AttendanceFormModal = ({
  open,
  onClose,
  onSubmit,
  editData = null,
  loading = false,
}) => {
  const isEdit = !!editData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const debouncedSearch = useDebounce(employeeSearch, 300);

  // Initialize form with edit data or empty form
  useEffect(() => {
    if (editData) {
      const employeeId = editData.userId ?? editData.user?.id ?? "";
      const employeeName = editData.user?.employeeName ?? "";
      setForm({
        userId: employeeId,
        date: formatDateForInput(editData.date),
        checkInTime: editData.checkInTime ? formatTimeForInput(editData.checkInTime) : "",
        checkOutTime: editData.checkOutTime ? formatTimeForInput(editData.checkOutTime) : "",
        status: editData.status ?? "PRESENT",
      });
      setSelectedEmployeeName(employeeName);
      setEmployeeSearch(employeeName);
    } else {
      setForm(EMPTY_FORM);
      setSelectedEmployeeName("");
      setEmployeeSearch("");
    }
    setErrors({});
    setShowEmployeeSuggestions(false);
  }, [editData, open]);

  // Handle Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setShowEmployeeSuggestions(false);
        onClose();
      }
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Fetch employees when modal opens
  useEffect(() => {
    if (open && !debouncedSearch.trim()) {
      fetchEmployees("");
    }
  }, [open]);

  // Fetch employees based on search query
  useEffect(() => {
    if (open && debouncedSearch.trim()) {
      fetchEmployees(debouncedSearch);
    } else if (open && !debouncedSearch.trim()) {
      fetchEmployees("");
    }
  }, [debouncedSearch, open]);

  const fetchEmployees = async (search = "") => {
    try {
      setEmployeesLoading(true);
      const { data } = await employeesApi.fetchAllEmployees({ page: 1, search });
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const formatTimeForInput = (timeStr) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const getFilteredEmployees = () => {
    return employees.slice(0, 5);
  };

  const handleEmployeeSelect = (emp) => {
    // Use emp.id or emp._id for userId (whichever exists in the employee object)
    console.log("employe select");
    
    const empId = emp.id;
    setForm((prev) => ({ ...prev, userId: empId }));
    setSelectedEmployeeName(emp.employeeName);
    setEmployeeSearch(emp.employeeName);
    setShowEmployeeSuggestions(false);
    setErrors((prev) => ({ ...prev, userId: "" })); // Clear userId error on selection
  };

  const handleEmployeeSearchChange = (e) => {
    const value = e.target.value;
    setEmployeeSearch(value);
    // Only clear userId if user is actively searching/changing
    if (value !== selectedEmployeeName) {
      setForm((prev) => ({ ...prev, userId: "" }));
    }
    setShowEmployeeSuggestions(true);
  };

  if (!open) return null;

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    
    if (!form.userId) {
      errs.userId = "Employee is required";
    }

    if (!form.date.trim()) {
      errs.date = "Date is required";
    }

    if (!form.status) {
      errs.status = "Status is required";
    }

    // Only require check-in time if status is not ABSENT or HOLIDAY
    if (form.status !== "ABSENT" && form.status !== "HOLIDAY") {
      if (!form.checkInTime.trim()) {
        errs.checkInTime = "Check-in time is required";
      }
      if (!form.checkOutTime.trim()) {
        errs.checkOutTime = "Check-out time is required";
      }

      // Validate that check-out time is after check-in time
      if (form.checkInTime && form.checkOutTime) {
        const checkIn = new Date(`2000-01-01 ${form.checkInTime}`);
        const checkOut = new Date(`2000-01-01 ${form.checkOutTime}`);
        if (checkOut <= checkIn) {
          errs.checkOutTime = "Check-out time must be after check-in time";
        }
      }
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    onSubmit(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowEmployeeSuggestions(false);
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-surface">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5 shrink-0 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {isEdit ? "Edit Attendance" : "Mark Attendance"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit
                ? "Update the attendance record"
                : "Record attendance for an employee"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors disabled:opacity-40 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6 space-y-5"
          id="attendance-form"
        >
          {/* Employee Selection */}
          <Field label="Employee" required error={errors.userId}>
            <div className="relative">
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search employee name or ID…"
                  value={employeeSearch}
                  onChange={handleEmployeeSearchChange}
                  onFocus={() => setShowEmployeeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEmployeeSuggestions(false), 150)}
                  className={`${cls(errors.userId)} pr-3.5`}
                  autoComplete="off"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showEmployeeSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                  {employeesLoading ? (
                    <div className="px-4 py-3 text-center text-xs text-text-muted">
                      Loading employees...
                    </div>
                  ) : getFilteredEmployees().length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto">
                      {getFilteredEmployees().map((emp, idx) => (
                        <li key={emp.id || emp._id || idx}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleEmployeeSelect(emp);
                            }}
                            className={`w-full px-4 py-2.5 text-xs text-left hover:bg-background transition-colors flex items-center gap-3 ${
                              String(form.userId) === String(emp.id || emp._id || emp.employeeId)
                                ? "bg-background border-l-2 border-present-text"
                                : ""
                            } ${
                              idx !== getFilteredEmployees().length - 1
                                ? "border-b border-border"
                                : ""
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-text-primary/10 text-text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {String(form.userId) === String(emp.id || emp._id || emp.employeeId) ? (
                                <Check size={14} />
                              ) : (
                                emp.employeeName
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((w) => w[0]?.toUpperCase())
                                  .join("")
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text-primary truncate">
                                {emp.employeeName}
                              </p>
                              <p className="text-xs text-text-muted truncate">
                                {emp.employeeId}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-text-muted">
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>

          {/* Date Selection */}
          <Field label="Date" required error={errors.date}>
            <IconInput icon={Calendar}>
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                className={cls(errors.date)}
              />
            </IconInput>
          </Field>

          {/* Status Selection */}
          <Field label="Attendance Status" required error={errors.status}>
            <IconInput icon={CheckCircle} selectMode={true}>
              <select
                value={form.status}
                onChange={set("status")}
                className={`${cls(errors.status)} pr-8 appearance-none`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </IconInput>
          </Field>

          {/* Check-in and Check-out Times (only if status is not ABSENT or HOLIDAY) */}
          {form.status !== "ABSENT" && form.status !== "HOLIDAY" && (
            <>
              <Divider label="Check Times" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Check-in Time" required error={errors.checkInTime}>
                  <IconInput icon={Clock}>
                    <input
                      type="time"
                      value={form.checkInTime}
                      onChange={set("checkInTime")}
                      className={cls(errors.checkInTime)}
                    />
                  </IconInput>
                </Field>

                <Field label="Check-out Time" required error={errors.checkOutTime}>
                  <IconInput icon={Clock}>
                    <input
                      type="time"
                      value={form.checkOutTime}
                      onChange={set("checkOutTime")}
                      className={cls(errors.checkOutTime)}
                    />
                  </IconInput>
                </Field>
              </div>
            </>
          )}

          {/* Status Note */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <p className="text-xs text-text-muted">
              <span className="font-semibold text-text-secondary">Current Status:</span>{" "}
              {STATUS_OPTIONS.find((opt) => opt.value === form.status)?.label}
            </p>
            {(form.status === "ABSENT" || form.status === "HOLIDAY") && (
              <p className="text-xs text-text-muted mt-1">
                Check-in and check-out times are not required for this status.
              </p>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-border shrink-0 bg-background">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-text-primary border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="attendance-form"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update" : "Mark"} Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFormModal;
