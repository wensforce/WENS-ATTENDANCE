import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Clock,
  Calendar,
  Coffee,
  Loader2,
  User,
  Search,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { breakApi } from "../../api/breakApi.js";
import { employeesApi } from "../../api/employeesApi.js";
import useDebounce from "../../../../shared/hooks/useDebounce.js";

const todayStr = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/**
 * Admin create break:
 * 1) Search/select user (default list + debounced API search)
 * 2) Select break option
 * 3) Date + start/end time (type=time → HH:mm)
 */
const BreakCreateModal = ({ open, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const searchWrapRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [breakOptions, setBreakOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [breakConfigId, setBreakConfigId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userId = selectedEmp?.id ? String(selectedEmp.id) : "";

  const resetForm = () => {
    setSelectedEmp(null);
    setSearchTerm("");
    setShowDropdown(false);
    setBreakOptions([]);
    setBreakConfigId("");
    setDate(todayStr());
    setStartTime("");
    setEndTime("");
    setError("");
    setSubmitting(false);
  };

  // Reset + default employee list when opened
  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open]);

  // Default list when search empty; debounced API search when typing
  useEffect(() => {
    if (!open) return;
    // Don't refetch while a selection is locked into the input
    if (selectedEmp) return;

    let cancelled = false;
    const load = async () => {
      setEmployeesLoading(true);
      try {
        const { data } = await employeesApi.fetchAllEmployees({
          page: 1,
          limit: 20,
          search: debouncedSearch.trim(),
        });
        if (!cancelled) setEmployees(data?.employees || []);
      } catch (err) {
        if (!cancelled) {
          setEmployees([]);
          toast.error(
            err.response?.data?.message || "Failed to load employees",
          );
        }
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, selectedEmp]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open || !userId) {
      setBreakOptions([]);
      setBreakConfigId("");
      return;
    }

    let cancelled = false;
    const loadOptions = async () => {
      setOptionsLoading(true);
      setBreakConfigId("");
      setError("");
      try {
        const { data } = await breakApi.fetchAdminBreakOptions(userId);
        if (!cancelled) {
          setBreakOptions(data?.breakOptions || []);
        }
      } catch (err) {
        if (!cancelled) {
          setBreakOptions([]);
          toast.error(
            err.response?.data?.message || "Failed to load break options",
          );
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    setSearchTerm(
      `${emp.employeeName}${emp.employeeId ? ` (${emp.employeeId})` : ""}`,
    );
    setShowDropdown(false);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSelectedEmp(null);
    setShowDropdown(true);
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedEmp?.id) {
      setError("Please select an employee");
      return;
    }
    if (!breakConfigId) {
      setError("Please select a break type");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start and end times are required");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    setSubmitting(true);
    try {
      await breakApi.createBreak({
        userId: Number(selectedEmp.id),
        breakConfigId: Number(breakConfigId),
        date,
        startTime,
        endTime,
      });
      toast.success("Break created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create break";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden border border-border">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <h2 className="text-base font-semibold text-text-primary">
            Create Break
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5" />
              Employee *
            </span>
            <div ref={searchWrapRef} className="relative">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search employee…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (!selectedEmp) setShowDropdown(true);
                  }}
                  disabled={submitting}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
                />
              </div>

              {showDropdown && !selectedEmp && (
                <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-xl shadow-sm max-h-48 overflow-y-auto">
                  {employeesLoading ? (
                    <div className="p-3 text-center text-xs text-text-muted">
                      Searching…
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-muted">
                      No employees found
                    </div>
                  ) : (
                    employees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-background transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-text-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {emp.employeeName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {emp.employeeName}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {emp.employeeId}
                          </p>
                        </div>
                        {String(selectedEmp?.id) === String(emp.id) && (
                          <Check size={14} className="text-text-muted" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedEmp && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmp(null);
                  setSearchTerm("");
                  setShowDropdown(true);
                }}
                disabled={submitting}
                className="mt-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors"
              >
                Change employee
              </button>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Coffee className="w-3.5 h-3.5" />
              Break type
            </span>
            <select
              value={breakConfigId}
              onChange={(e) => setBreakConfigId(e.target.value)}
              disabled={!userId || optionsLoading || submitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
            >
              <option value="">
                {!userId
                  ? "Select employee first"
                  : optionsLoading
                    ? "Loading options…"
                    : breakOptions.length === 0
                      ? "No break options available"
                      : "Select break type"}
              </option>
              {breakOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label || opt.breakType}
                  {opt.maxDurationMins != null
                    ? ` · ${opt.maxDurationMins} min`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Start time
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              End time
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
            />
          </label>

          {error && <p className="text-xs text-absent-text">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-background disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !userId || !breakConfigId}
              className="flex-1 px-3 py-2 bg-text-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakCreateModal;
