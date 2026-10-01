import React, { useEffect, useRef, useState } from "react";
import { X, Search, Loader2, Check, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { breakConfigApi } from "../../api/breakConfigApi.js";
import { employeesApi } from "../../api/employeesApi.js";
import useDebounce from "../../../../shared/hooks/useDebounce.js";

/**
 * Add / upsert employee access for a break config.
 * Typical ALL-scope case: allow everyone, then block one user here.
 */
const BreakAccessAddModal = ({
  open,
  onClose,
  breakConfigId,
  scope = "ALL",
  existingAccess = [],
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isAllowed, setIsAllowed] = useState(scope !== "ALL");
  const [submitting, setSubmitting] = useState(false);
  const searchWrapRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!open) return;
    setSearchTerm("");
    setEmployees([]);
    setShowDropdown(false);
    setSelectedEmp(null);
    // ALL → default Block (exception). SPECIFIC_USERS → default Allow.
    setIsAllowed(scope !== "ALL");
    setSubmitting(false);
  }, [open, scope]);

  useEffect(() => {
    if (!open) return;
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
      } catch {
        if (!cancelled) setEmployees([]);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch]);

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

  const handleSelect = (emp) => {
    setSelectedEmp(emp);
    setSearchTerm(`${emp.employeeName} (${emp.employeeId})`);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp?.id) {
      toast.error("Select an employee");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await breakConfigApi.setAccess(selectedEmp.id, {
        breakConfigId: Number(breakConfigId),
        isAllowed,
      });
      toast.success(
        isAllowed
          ? `Access allowed for ${selectedEmp.employeeName}`
          : `Access blocked for ${selectedEmp.employeeName}`,
      );
      onSuccess?.(
        data?.newBreakAccess || {
          userId: selectedEmp.id,
          breakConfigId: Number(breakConfigId),
          isAllowed,
          employeeName: selectedEmp.employeeName,
          employeeId: selectedEmp.employeeId,
        },
        selectedEmp,
      );
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set access");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg overflow-hidden border border-border">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Add employee access
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              {scope === "ALL"
                ? "Everyone is allowed by default — block a specific user here."
                : "Grant or revoke access for a specific employee."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1.5">
              Employee *
            </p>
            <div ref={searchWrapRef} className="relative">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedEmp(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  disabled={submitting}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
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
                    employees.map((emp) => {
                      const existing = existingAccess.find(
                        (a) => a.userId === emp.id,
                      );
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelect(emp)}
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
                              {existing
                                ? existing.isAllowed
                                  ? " · currently allowed"
                                  : " · currently blocked"
                                : ""}
                            </p>
                          </div>
                          {existing && (
                            <Check size={14} className="text-text-muted" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-primary mb-1.5">
              Access *
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsAllowed(true)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${
                  isAllowed
                    ? "bg-present-bg text-present-text border-present-text/30"
                    : "bg-background text-text-muted border-border hover:border-text-primary"
                }`}
              >
                <CheckCircle size={14} />
                Allow
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsAllowed(false)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${
                  !isAllowed
                    ? "bg-absent-bg text-absent-text border-absent-text/30"
                    : "bg-background text-text-muted border-border hover:border-text-primary"
                }`}
              >
                <XCircle size={14} />
                Block
              </button>
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              {isAllowed
                ? "This employee will be allowed to take this break."
                : "This employee will be blocked from this break (even if scope is ALL)."}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
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
              disabled={submitting || !selectedEmp}
              className="flex-1 px-3 py-2.5 bg-text-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakAccessAddModal;
