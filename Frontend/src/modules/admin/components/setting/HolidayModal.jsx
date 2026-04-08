import React, { useEffect, useState, useRef } from "react";
import { X, Loader2, ChevronDown, Check } from "lucide-react";
import { employeesApi } from "../../api/employeesApi.js";

const HolidayModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    status: "HOLIDAY",
    startDate: "",
    endDate: "",
    reason: "",
    employeeIds: [],
  });
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const searchInputRef = useRef(null);
  const modalBodyRef = useRef(null);

  // Fetch employees
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const data = await employeesApi.fetchAllEmployees(1);
      const empList = data.data?.employees || data.employees || [];
      setEmployees(empList);

      const uniqueDepts = [
        ...new Set(empList.map((e) => e.department).filter(Boolean)),
      ];
      const uniqueDesigs = [
        ...new Set(empList.map((e) => e.designation).filter(Boolean)),
      ];
      setDepartments(uniqueDepts);
      setDesignations(uniqueDesigs);
    } catch {
      console.error("Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (initialData) {
        // spread initialData.employees to get only ids
        const employeeIds =
          initialData.employeeIds ||
          (initialData.employees
            ? initialData.employees.map((e) => e.employee.id)
            : []);

        setFormData({
          status: initialData?.status || "HOLIDAY",
          startDate: initialData?.startDate
            ? initialData.startDate.split("T")[0]
            : "",
          endDate: initialData?.endDate
            ? initialData.endDate.split("T")[0]
            : "",
          reason: initialData?.reason || "",
          employeeIds: employeeIds,
        });
      } else {
        setFormData({
          status: "HOLIDAY",
          startDate: "",
          endDate: "",
          reason: "",
          employeeIds: [],
        });
      }
      setShowTypeDropdown(false);
      setErrors({});
      setSearchTerm("");
      setShowEmployeeDropdown(false);
    }
  }, [open, initialData]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showEmployeeDropdown &&
        !e.target.closest("[data-employee-dropdown]")
      ) {
        setShowEmployeeDropdown(false);
      }
      if (showTypeDropdown && !e.target.closest("[data-type-dropdown]")) {
        setShowTypeDropdown(false);
      }
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open, showEmployeeDropdown, showTypeDropdown]);

  // Scroll to search input when focused for accessibility
  const handleSearchFocus = () => {
    setShowEmployeeDropdown(true);
    setTimeout(() => {
      if (searchInputRef.current && modalBodyRef.current) {
        const inputPos = searchInputRef.current.getBoundingClientRect();
        const containerPos = modalBodyRef.current.getBoundingClientRect();
        const scrollOffset =
          inputPos.top - containerPos.top + modalBodyRef.current.scrollTop;
        modalBodyRef.current.scrollTo({
          top: Math.max(0, scrollOffset - 20),
          behavior: "smooth",
        });
      }
    }, 50);
  };

  if (!open) return null;

  const validate = () => {
    const errs = {};
    if (!formData.status) errs.status = "Status is required";
    if (!formData.startDate) errs.startDate = "Start date is required";
    if (!formData.endDate) errs.endDate = "End date is required";
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      errs.endDate = "End date must be after start date";
    }
    if (!formData.reason.trim()) errs.reason = "Reason is required";
    if (!formData.employeeIds || formData.employeeIds.length === 0) {
      errs.employeeIds = "At least one employee must be selected";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.includes(searchTerm),
  );

  const toggleEmployeeSelection = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter((id) => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }));
  };

  const selectAllEmployees = () => {
    setFormData((prev) => ({
      ...prev,
      employeeIds:
        prev.employeeIds.length === employees.length
          ? []
          : employees.map((e) => e.id),
    }));
  };

  const selectByDesignation = (designation) => {
    const filteredByDesig = employees.filter(
      (e) => e.designation === designation,
    );
    const ids = filteredByDesig.map((e) => e.id);
    setFormData((prev) => ({
      ...prev,
      employeeIds: [...new Set([...prev.employeeIds, ...ids])],
    }));
  };

  const selectByDepartment = (department) => {
    const filteredByDept = employees.filter((e) => e.department === department);
    const ids = filteredByDept.map((e) => e.id);
    setFormData((prev) => ({
      ...prev,
      employeeIds: [...new Set([...prev.employeeIds, ...ids])],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden bg-surface my-8">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {initialData ? "Edit Holiday" : "Add Holiday"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {initialData
                ? "Update holiday details"
                : "Add a new holiday/leave event"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          ref={modalBodyRef}
          className="px-6 pb-2 space-y-4 max-h-96 overflow-y-auto"
        >
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Status<span className="text-absent-text ml-0.5">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((p) => ({ ...p, status: e.target.value }))
              }
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
            >
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
            {errors.status && (
              <p className="text-xs text-absent-text">{errors.status}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-primary tracking-wide">
                Start Date<span className="text-absent-text ml-0.5">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startDate: e.target.value }))
                }
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />
              {errors.startDate && (
                <p className="text-xs text-absent-text">{errors.startDate}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-primary tracking-wide">
                End Date<span className="text-absent-text ml-0.5">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, endDate: e.target.value }))
                }
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />
              {errors.endDate && (
                <p className="text-xs text-absent-text">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Reason<span className="text-absent-text ml-0.5">*</span>
            </label>
            <textarea
              placeholder="e.g. Annual leave, Personal leave, Emergency leave"
              value={formData.reason}
              onChange={(e) =>
                setFormData((p) => ({ ...p, reason: e.target.value }))
              }
              disabled={loading}
              rows="3"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50 resize-none"
            />
            {errors.reason && (
              <p className="text-xs text-absent-text">{errors.reason}</p>
            )}
          </div>

          {/* Employees Selection */}
          <div className="flex flex-col gap-1.5" data-employee-dropdown>
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Employees<span className="text-absent-text ml-0.5">*</span>
            </label>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={selectAllEmployees}
                disabled={loading || employeesLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50"
              >
                Select All
              </button>
              <div className="relative" data-type-dropdown>
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  disabled={loading || employeesLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  By Type <ChevronDown size={12} />
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 min-w-max">
                    {departments.length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b border-border text-xs font-semibold text-text-primary">
                          Departments
                        </div>
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              selectByDepartment(dept);
                              setShowTypeDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-background transition-colors border-b border-border last:border-b-0"
                          >
                            {dept}
                          </button>
                        ))}
                      </>
                    )}
                    {designations.length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b border-border text-xs font-semibold text-text-primary">
                          Designations
                        </div>
                        {designations.map((desig) => (
                          <button
                            key={desig}
                            type="button"
                            onClick={() => {
                              selectByDesignation(desig);
                              setShowTypeDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-background transition-colors border-b border-border last:border-b-0"
                          >
                            {desig}
                          </button>
                        ))}
                      </>
                    )}
                    {departments.length === 0 && designations.length === 0 && (
                      <div className="px-3 py-2 text-xs text-text-muted">
                        No options available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative" data-employee-search>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={() =>
                  setTimeout(() => setShowEmployeeDropdown(false), 200)
                }
                disabled={loading || employeesLoading}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />

              {/* Dropdown */}
              {showEmployeeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {employeesLoading ? (
                    <div className="p-3 text-center text-xs text-text-muted">
                      Loading employees...
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-muted">
                      No employees found
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          toggleEmployeeSelection(emp.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-background transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <div
                          className={`w-4 h-4 rounded border ${
                            formData.employeeIds.includes(emp.id)
                              ? "bg-text-primary border-text-primary flex items-center justify-center"
                              : "border-border"
                          }`}
                        >
                          {formData.employeeIds.includes(emp.id) && (
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
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Employees Chips */}
            {formData.employeeIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.employeeIds.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-background border border-border text-xs"
                    >
                      <span className="text-text-primary font-medium">
                        {emp?.employeeName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEmployeeSelection(id)}
                        disabled={loading}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.employeeIds && (
              <p className="text-xs text-absent-text">{errors.employeeIds}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 mt-4 border-t border-border bg-background">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.opacity = "1")
            }
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {initialData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal;
