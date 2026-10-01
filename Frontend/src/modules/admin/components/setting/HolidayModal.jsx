import React, { useEffect, useState, useRef } from "react";
import { X, Loader2, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";
import { employeesApi } from "../../api/employeesApi.js";
import { useLeaveSubtypeApi } from "../../api/leaveSubtypeApi.js";
import { useDepartmentApi } from "../../api/departmentApi.js";
import { useDesignationApi } from "../../api/designationApi.js";
import useDebounce from "../../../../shared/hooks/useDebounce.js";

const HolidayModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    status: "HOLIDAY",
    subTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    employeeIds: [],
  });
  const [errors, setErrors] = useState({});
  const [subTypes, setSubTypes] = useState([]);
  const [subTypesLoading, setSubTypesLoading] = useState(false);

  // Search suggestions (paginated / debounced)
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Selected employees for chips (id → emp), kept even when search list changes
  const [selectedMap, setSelectedMap] = useState({});
  const [bulkSelecting, setBulkSelecting] = useState(false);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

  const searchInputRef = useRef(null);
  const modalBodyRef = useRef(null);

  const fetchSubTypes = async (type) => {
    setSubTypesLoading(true);
    try {
      const { data } = await useLeaveSubtypeApi.fetchLeaveSubtypes(type);
      const list = data?.leaveSubTypes || data;
      setSubTypes(Array.isArray(list) ? list : []);
    } catch {
      setSubTypes([]);
    } finally {
      setSubTypesLoading(false);
    }
  };

  const fetchDeptAndDesig = async () => {
    setTypesLoading(true);
    try {
      const [deptRes, desigRes] = await Promise.all([
        useDepartmentApi.fetchDepartment(),
        useDesignationApi.fetchDesignation(),
      ]);
      setDepartments(deptRes?.data?.departments || []);
      setDesignations(desigRes?.data?.designations || []);
    } catch {
      setDepartments([]);
      setDesignations([]);
    } finally {
      setTypesLoading(false);
    }
  };

  /** Fetch all matching employees from DB (tenant-scoped via API). */
  const fetchEmployeesFromDb = async (filters = {}) => {
    const { data } = await employeesApi.fetchAllEmployees({
      idsOnly: true,
      ...filters,
    });
    return data?.employees || [];
  };

  useEffect(() => {
    if (open) fetchSubTypes(formData.status);
  }, [open, formData.status]);

  useEffect(() => {
    if (!open) return;

    fetchDeptAndDesig();

    if (initialData) {
      const employeeIds =
        initialData.employeeIds ||
        (initialData.employees
          ? initialData.employees.map((e) => e.employee.id)
          : []);

      const map = {};
      (initialData.employees || []).forEach((row) => {
        const emp = row.employee || row;
        if (emp?.id != null) {
          map[emp.id] = {
            id: emp.id,
            employeeName: emp.employeeName,
            employeeId: emp.employeeId,
          };
        }
      });

      setFormData({
        status: initialData?.status || "HOLIDAY",
        subTypeId: initialData?.subTypeId ?? initialData?.subType?.id ?? "",
        startDate: initialData?.startDate
          ? initialData.startDate.split("T")[0]
          : "",
        endDate: initialData?.endDate
          ? initialData.endDate.split("T")[0]
          : "",
        reason: initialData?.reason || "",
        employeeIds,
      });
      setSelectedMap(map);
    } else {
      setFormData({
        status: "HOLIDAY",
        subTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
        employeeIds: [],
      });
      setSelectedMap({});
    }

    setShowTypeDropdown(false);
    setErrors({});
    setSearchTerm("");
    setShowEmployeeDropdown(false);
  }, [open, initialData]);

  // Default list when empty; debounced API search when typing
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
  }, [open, debouncedSearch]);

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
    onSubmit({
      ...formData,
      subTypeId: formData.subTypeId ? Number(formData.subTypeId) : null,
    });
  };

  const toggleEmployeeSelection = (emp) => {
    const employeeId = emp.id;
    setFormData((prev) => {
      const exists = prev.employeeIds.includes(employeeId);
      return {
        ...prev,
        employeeIds: exists
          ? prev.employeeIds.filter((id) => id !== employeeId)
          : [...prev.employeeIds, employeeId],
      };
    });
    setSelectedMap((prev) => {
      if (prev[employeeId]) {
        const next = { ...prev };
        delete next[employeeId];
        return next;
      }
      return {
        ...prev,
        [employeeId]: {
          id: emp.id,
          employeeName: emp.employeeName,
          employeeId: emp.employeeId,
        },
      };
    });
  };

  const removeSelected = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.filter((id) => id !== employeeId),
    }));
    setSelectedMap((prev) => {
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
  };

  const mergeEmployeesIntoSelection = (list) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: [
        ...new Set([...prev.employeeIds, ...list.map((e) => e.id)]),
      ],
    }));
    setSelectedMap((prev) => {
      const next = { ...prev };
      list.forEach((emp) => {
        next[emp.id] = {
          id: emp.id,
          employeeName: emp.employeeName,
          employeeId: emp.employeeId,
        };
      });
      return next;
    });
  };

  const selectAllEmployees = async () => {
    setBulkSelecting(true);
    try {
      const list = await fetchEmployeesFromDb();
      if (list.length === 0) {
        toast.info("No employees found");
        return;
      }
      // Toggle: if already all selected, clear; else select all from DB
      const allIds = list.map((e) => e.id);
      const alreadyAll =
        formData.employeeIds.length === allIds.length &&
        allIds.every((id) => formData.employeeIds.includes(id));

      if (alreadyAll) {
        setFormData((prev) => ({ ...prev, employeeIds: [] }));
        setSelectedMap({});
      } else {
        setFormData((prev) => ({ ...prev, employeeIds: allIds }));
        const map = {};
        list.forEach((emp) => {
          map[emp.id] = {
            id: emp.id,
            employeeName: emp.employeeName,
            employeeId: emp.employeeId,
          };
        });
        setSelectedMap(map);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to select employees");
    } finally {
      setBulkSelecting(false);
    }
  };

  const selectByDepartment = async (dept) => {
    setBulkSelecting(true);
    setShowTypeDropdown(false);
    try {
      const list = await fetchEmployeesFromDb({ departmentId: dept.id });
      if (list.length === 0) {
        toast.info(`No employees in ${dept.name}`);
        return;
      }
      mergeEmployeesIntoSelection(list);
      toast.success(`Added ${list.length} from ${dept.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load employees");
    } finally {
      setBulkSelecting(false);
    }
  };

  const selectByDesignation = async (desig) => {
    setBulkSelecting(true);
    setShowTypeDropdown(false);
    try {
      const list = await fetchEmployeesFromDb({ designationId: desig.id });
      if (list.length === 0) {
        toast.info(`No employees with ${desig.name}`);
        return;
      }
      mergeEmployeesIntoSelection(list);
      toast.success(`Added ${list.length} with ${desig.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load employees");
    } finally {
      setBulkSelecting(false);
    }
  };

  const busy = loading || bulkSelecting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden bg-surface my-8">
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
            disabled={busy}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={modalBodyRef}
          className="px-6 pb-2 space-y-4 max-h-96 overflow-y-auto"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Status<span className="text-absent-text ml-0.5">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  status: e.target.value,
                  subTypeId: "",
                }))
              }
              disabled={busy}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
            >
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
            {errors.status && (
              <p className="text-xs text-absent-text">{errors.status}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              {formData.status === "LEAVE" ? "Leave Type" : "Holiday Type"}
            </label>
            <select
              value={formData.subTypeId}
              onChange={(e) =>
                setFormData((p) => ({ ...p, subTypeId: e.target.value }))
              }
              disabled={busy || subTypesLoading || subTypes.length === 0}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
            >
              <option value="">
                {subTypesLoading
                  ? "Loading types..."
                  : subTypes.length === 0
                    ? "No types configured"
                    : "Select a type (optional)"}
              </option>
              {subTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
            {!subTypesLoading && subTypes.length === 0 && (
              <p className="text-xs text-text-muted">
                Add sub types from Settings → Leave Types first.
              </p>
            )}
          </div>

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
                disabled={busy}
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
                disabled={busy}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />
              {errors.endDate && (
                <p className="text-xs text-absent-text">{errors.endDate}</p>
              )}
            </div>
          </div>

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
              disabled={busy}
              rows="3"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50 resize-none"
            />
            {errors.reason && (
              <p className="text-xs text-absent-text">{errors.reason}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5" data-employee-dropdown>
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Employees<span className="text-absent-text ml-0.5">*</span>
            </label>

            <div className="mb-2" data-type-dropdown>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllEmployees}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkSelecting && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  disabled={busy || typesLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  By Type <ChevronDown size={12} />
                </button>
              </div>

              {showTypeDropdown && (
                <div className="mt-1.5 w-full bg-surface border border-border rounded-xl shadow-sm max-h-44 overflow-y-auto">
                  {typesLoading ? (
                    <div className="px-3 py-2 text-xs text-text-muted">
                      Loading…
                    </div>
                  ) : (
                    <>
                      {departments.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-border text-xs font-semibold text-text-primary">
                            Departments
                          </div>
                          {departments.map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => selectByDepartment(dept)}
                              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-background transition-colors border-b border-border last:border-b-0"
                            >
                              {dept.name}
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
                              key={desig.id}
                              type="button"
                              onClick={() => selectByDesignation(desig)}
                              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-background transition-colors border-b border-border last:border-b-0"
                            >
                              {desig.name}
                            </button>
                          ))}
                        </>
                      )}
                      {departments.length === 0 &&
                        designations.length === 0 && (
                          <div className="px-3 py-2 text-xs text-text-muted">
                            No options available
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div data-employee-search>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onFocus={handleSearchFocus}
                disabled={busy}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />

              {showEmployeeDropdown && (
                <div className="mt-1 w-full bg-surface border border-border rounded-xl shadow-sm max-h-48 overflow-y-auto">
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
                        onClick={() => toggleEmployeeSelection(emp)}
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

            {formData.employeeIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.employeeIds.map((id) => {
                  const emp = selectedMap[id];
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-background border border-border text-xs"
                    >
                      <span className="text-text-primary font-medium">
                        {emp?.employeeName || `Employee #${id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSelected(id)}
                        disabled={busy}
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

        <div className="flex items-center justify-end gap-3 px-6 py-4 mt-4 border-t border-border bg-background">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
            onMouseEnter={(e) =>
              !busy && (e.currentTarget.style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              !busy && (e.currentTarget.style.opacity = "1")
            }
          >
            {(loading || bulkSelecting) && (
              <Loader2 size={13} className="animate-spin" />
            )}
            {initialData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal;
