import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  Coffee,
  Tag,
  Hash,
  Timer,
  Users,
  Check,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { breakConfigApi } from "../../api/breakConfigApi.js";
import { employeesApi } from "../../api/employeesApi.js";
import useDebounce from "../../../../shared/hooks/useDebounce.js";

const EMPTY_FORM = {
  breakType: "",
  label: "",
  maxDurationMins: "12",
  maxPerDay: "1",
  graceMins: "5",
  isPaid: true,
  isActive: true,
  scope: "ALL",
  userIds: [],
};

const inputClass =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-60 transition-all";

const Toggle = ({ checked, onChange, disabled, label, hint }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-text-primary">{label}</p>
      {hint && <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-1 ${
        checked ? "bg-text-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

/**
 * Create break config modal.
 * SPECIFIC_USERS → debounced API employee search; selected chips kept locally.
 */
const BreakConfigFormModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError("");
    setSearchTerm("");
    setShowDropdown(false);
    setSubmitting(false);
    setSelectedEmployees({});
    setEmployees([]);
  }, [open]);

  // Debounced API search when SPECIFIC_USERS is selected
  useEffect(() => {
    if (!open) return;
    if (form.scope !== "SPECIFIC_USERS") return;

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
            err.response?.data?.message || "Failed to search employees",
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
  }, [open, debouncedSearch, form.scope]);

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

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEmployee = (emp) => {
    const employeeId = emp.id;
    setForm((prev) => {
      const selected = prev.userIds.includes(employeeId);
      return {
        ...prev,
        userIds: selected
          ? prev.userIds.filter((id) => id !== employeeId)
          : [...prev.userIds, employeeId],
      };
    });
    setSelectedEmployees((prev) => {
      if (prev[employeeId]) {
        const next = { ...prev };
        delete next[employeeId];
        return next;
      }
      return { ...prev, [employeeId]: emp };
    });
  };

  const removeSelected = (employeeId) => {
    setForm((prev) => ({
      ...prev,
      userIds: prev.userIds.filter((id) => id !== employeeId),
    }));
    setSelectedEmployees((prev) => {
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const breakType = form.breakType.trim().toUpperCase().replace(/\s+/g, "");
    if (!breakType) {
      setError("Break type is required (uppercase, no spaces)");
      return;
    }
    if (!form.label.trim()) {
      setError("Label is required");
      return;
    }
    if (!form.maxDurationMins || Number(form.maxDurationMins) < 1) {
      setError("Max duration must be at least 1 minute");
      return;
    }
    if (!form.maxPerDay || Number(form.maxPerDay) < 1) {
      setError("Max per day must be at least 1");
      return;
    }
    if (form.graceMins === "" || Number(form.graceMins) < 0) {
      setError("Grace minutes must be 0 or more");
      return;
    }
    if (form.scope === "SPECIFIC_USERS" && form.userIds.length === 0) {
      setError("Select at least one employee for SPECIFIC_USERS scope");
      return;
    }

    const payload = {
      breakType,
      label: form.label.trim(),
      maxDurationMins: Number(form.maxDurationMins),
      maxPerDay: Number(form.maxPerDay),
      graceMins: Number(form.graceMins),
      isPaid: form.isPaid,
      isActive: form.isActive,
      scope: form.scope,
    };

    if (form.scope === "SPECIFIC_USERS") {
      payload.userIds = form.userIds.map(String);
    }

    setSubmitting(true);
    try {
      await breakConfigApi.create(payload);
      toast.success("Break config created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create break config";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg overflow-hidden border border-border max-h-[90vh] flex flex-col">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30 shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            Create Break Config
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

        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 space-y-3 overflow-y-auto flex-1"
        >
          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5" />
              Break type *
            </span>
            <input
              type="text"
              value={form.breakType}
              onChange={(e) =>
                setField(
                  "breakType",
                  e.target.value.replace(/\s+/g, "").toUpperCase(),
                )
              }
              placeholder="LUNCH, TEA, SPECIAL…"
              disabled={submitting}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5" />
              Label *
            </span>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setField("label", e.target.value)}
              placeholder="Display name"
              disabled={submitting}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                <Timer className="w-3.5 h-3.5" />
                Max mins *
              </span>
              <input
                type="number"
                min={1}
                value={form.maxDurationMins}
                onChange={(e) => setField("maxDurationMins", e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                / day *
              </span>
              <input
                type="number"
                min={1}
                value={form.maxPerDay}
                onChange={(e) => setField("maxPerDay", e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                Grace *
              </span>
              <input
                type="number"
                min={0}
                value={form.graceMins}
                onChange={(e) => setField("graceMins", e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Coffee className="w-3.5 h-3.5" />
              Scope *
            </span>
            <select
              value={form.scope}
              onChange={(e) => {
                const scope = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  scope,
                  userIds: scope === "SPECIFIC_USERS" ? prev.userIds : [],
                }));
                if (scope !== "SPECIFIC_USERS") {
                  setShowDropdown(false);
                  setSelectedEmployees({});
                  setSearchTerm("");
                  setEmployees([]);
                }
              }}
              disabled={submitting}
              className={inputClass}
            >
              <option value="ALL">ALL — everyone</option>
              <option value="SPECIFIC_USERS">SPECIFIC_USERS</option>
            </select>
          </label>

          <div className="rounded-xl border border-border bg-background px-3.5 py-3 space-y-3">
            <Toggle
              label="Paid break"
              hint="Counts as paid time"
              checked={form.isPaid}
              onChange={(v) => setField("isPaid", v)}
              disabled={submitting}
            />
            <div className="h-px bg-border" />
            <Toggle
              label="Active"
              hint="Visible to employees when allowed"
              checked={form.isActive}
              onChange={(v) => setField("isActive", v)}
              disabled={submitting}
            />
          </div>

          {form.scope === "SPECIFIC_USERS" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-xs font-semibold text-text-primary">
                  Employees *
                </p>
                <span className="text-[11px] text-text-muted ml-auto">
                  {form.userIds.length} selected
                </span>
              </div>

              <div ref={searchWrapRef} className="relative">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search employees…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    disabled={submitting}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
                  />
                </div>

                {showDropdown && (
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
                      employees.map((emp) => {
                        const selected = form.userIds.includes(emp.id);
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => toggleEmployee(emp)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-background transition-colors text-left border-b border-border last:border-b-0"
                          >
                            <div
                              className={`w-4 h-4 rounded border shrink-0 ${
                                selected
                                  ? "bg-text-primary border-text-primary flex items-center justify-center"
                                  : "border-border"
                              }`}
                            >
                              {selected && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">
                                {emp.employeeName}
                              </p>
                              <p className="text-xs text-text-muted truncate">
                                {emp.employeeId}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {form.userIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.userIds.map((id) => {
                    const emp = selectedEmployees[id];
                    return (
                      <div
                        key={id}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-background border border-border text-xs"
                      >
                        <span className="text-text-primary font-medium">
                          {emp?.employeeName || id}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelected(id)}
                          disabled={submitting}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-absent-text">{error}</p>}

          <div className="flex gap-2 pt-1 sticky bottom-0 bg-surface pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-3 py-2.5 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-background disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 py-2.5 bg-text-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex items-center justify-center gap-2"
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

export default BreakConfigFormModal;
