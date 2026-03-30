import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  User,
  Hash,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  Clock,
  MapPin,
  LocateFixed,
  Navigation,
  ChevronDown,
} from "lucide-react";
import { useDepartmentApi } from "../../api/departmentApi";
import { useDesignationApi } from "../../api/designationApi";
import DepartmentCreateModal from "../DepartmentCreateModal";
import DesignationCreateModal from "../DesignationCreateModal";
import MapPickerModal from "./MapPickerModal";
import { parseShiftTime, formatShiftTime } from "../../utils/shiftTimeUtil";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const USER_TYPES = ["EMPLOYEE", "ADMIN", "BODYGUARD"];

const EMPTY_FORM = {
  employeeName: "",
  email: "",
  mobileNumber: "",
  employeeId: "",
  departmentId: "",
  designationId: "",
  userType: "",
  shift: "",
  workLocation: { lat: "", lng: "", address: "" },
  weekendOff: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseWorkLocation = (raw) => {
  if (!raw) return { lat: "", lng: "", address: "" };
  if (typeof raw === "object")
    return {
      lat: raw.lat ?? "",
      lng: raw.lng ?? "",
      address: raw.address ?? "",
    };
  try {
    const parsed = JSON.parse(raw);
    return {
      lat: parsed.lat ?? "",
      lng: parsed.lng ?? "",
      address: parsed.address ?? "",
    };
  } catch {
    return { lat: "", lng: "", address: "" };
  }
};

const parseWeekendOff = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number);
  try {
    return JSON.parse(raw).map(Number);
  } catch {
    return [];
  }
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

const IconInput = ({ icon: Icon, children }) => (
  <div className="relative">
    <Icon
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
    />
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

const EmployeeFormModal = ({
  open,
  onClose,
  onSubmit,
  editData = null,
  loading = false,
}) => {
  const isEdit = !!editData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [shiftTime, setShiftTime] = useState({ startTime: "", endTime: "" });
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [designationModalOpen, setDesignationModalOpen] = useState(false);
  const [creatingDesignation, setCreatingDesignation] = useState(false);

  useEffect(() => {
    if (editData) {
      console.log(editData);
      
      setForm({
        employeeName: editData.employeeName ?? "",
        email: editData.email ?? "",
        mobileNumber: editData.mobileNumber ?? "",
        employeeId: editData.employeeId ?? "",
        departmentId: editData.departmentId ?? "",
        designationId: editData.designationId ?? "",
        userType: editData.userType ?? "",
        shift: editData.shift ?? "",
        workLocation: parseWorkLocation(editData.workLocation),
        weekendOff: parseWeekendOff(editData.weekendOff),
      });
      setShiftTime(parseShiftTime(editData.shift ?? ""));
    } else {
      setForm(EMPTY_FORM);
      setShiftTime({ startTime: "", endTime: "" });
    }
    setErrors({});
  }, [editData, open]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Fetch departments and designations on modal open
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchDesignations();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const { data } = await useDepartmentApi.fetchDepartment();

      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      setDesignationsLoading(true);
      const { data } = await useDesignationApi.fetchDesignation();
      setDesignations(data.designations || []);
    } catch (error) {
      console.error("Failed to fetch designations:", error);
      setDesignations([]);
    } finally {
      setDesignationsLoading(false);
    }
  };

  const handleCreateDepartment = async (departmentData) => {
    try {
      setCreatingDepartment(true);
      const response = await useDepartmentApi.createDepartment(departmentData);
      // Add new department to list
      if (response.data) {
        fetchDepartments(); // Refresh department list
        // Set the newly created department as selected
        setForm((prev) => ({
          ...prev,
          departmentId: response.data.department._id,
        }));
      }
      setDepartmentModalOpen(false);
    } catch (error) {
      console.error("Failed to create department:", error);
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleCreateDesignation = async (designationData) => {
    try {
      setCreatingDesignation(true);
      const response = await useDesignationApi.createDesignation(designationData);
      // Add new designation to list
      if (response.data) {
        fetchDesignations(); // Refresh designation list
        // Set the newly created designation as selected
        setForm((prev) => ({
          ...prev,
          designationId: response.data.designation._id,
        }));
      }
      setDesignationModalOpen(false);
    } catch (error) {
      console.error("Failed to create designation:", error);
    } finally {
      setCreatingDesignation(false);
    }
  };

  const handleMapLocationConfirm = (locationData) => {
    setForm((prev) => ({
      ...prev,
      workLocation: {
        lat: locationData.lat,
        lng: locationData.lng,
        address: locationData.address,
      },
    }));
    setMapPickerOpen(false);
  };

  if (!open) return null;

  const set = (field) => (e) => {
    const value = e.target.value;

    // Handle department creation modal trigger
    if (field === "departmentId" && value === "__CREATE_NEW__") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      setDepartmentModalOpen(true);
      return;
    }

    // Handle designation creation modal trigger
    if (field === "designationId" && value === "__CREATE_NEW__") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      setDesignationModalOpen(true);
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setShiftTimeField = (timeType) => (e) => {
    const value = e.target.value;
    const updatedShiftTime = { ...shiftTime, [timeType]: value };
    setShiftTime(updatedShiftTime);
    // Update form shift with formatted time
    const formattedShift = formatShiftTime(
      timeType === "startTime" ? value : updatedShiftTime.startTime,
      timeType === "endTime" ? value : updatedShiftTime.endTime
    );
    setForm((prev) => ({ ...prev, shift: formattedShift }));
  };

  const toggleWeekendDay = (dayValue) =>
    setForm((prev) => ({
      ...prev,
      weekendOff: prev.weekendOff.includes(dayValue)
        ? prev.weekendOff.filter((d) => d !== dayValue)
        : [...prev.weekendOff, dayValue],
    }));

  const validate = () => {
    const errs = {};
    if (!form.employeeName.trim()) errs.employeeName = "Name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email address";
    }
    if (!form.employeeId.trim()) errs.employeeId = "Employee ID is required";
    if (!form.mobileNumber.trim()) {
      errs.mobileNumber = "Phone number is required";
    } else if (!/^\d{7,15}$/.test(form.mobileNumber)) {
      errs.mobileNumber = "Enter a valid phone number";
    }
    if (!form.departmentId) errs.department = "Department is required";
    if (!form.designationId) errs.designation = "Designation is required";
    if (!form.userType) errs.userType = "User type is required";
    if (!shiftTime.startTime || !shiftTime.endTime)
      errs.shift = "Shift timing is required";
    if (
      !form.workLocation.address ||
      !form.workLocation.lat ||
      !form.workLocation.lng
    )
      errs.workLocationAddress = "Work location is required";
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-surface">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {isEdit ? "Edit Employee" : "New Employee"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit
                ? "Update the details for this employee"
                : "Fill in the information to add a new team member"}
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
          className="flex-1 overflow-y-auto px-7 pb-6 space-y-6"
          id="employee-form"
        >
          {/* Personal */}
          <Divider label="Personal" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Full Name" required error={errors.employeeName}>
              <IconInput icon={User}>
                <input
                  type="text"
                  placeholder="Syed Talmin"
                  value={form.employeeName}
                  onChange={set("employeeName")}
                  className={cls(errors.employeeName)}
                />
              </IconInput>
            </Field>

            <Field label="Employee ID" required error={errors.employeeId}>
              <IconInput icon={Hash}>
                <input
                  type="text"
                  placeholder="WF001"
                  value={form.employeeId}
                  onChange={set("employeeId")}
                  className={cls(errors.employeeId)}
                />
              </IconInput>
            </Field>

            <Field label="Email Address" required error={errors.email}>
              <IconInput icon={Mail}>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={set("email")}
                  className={cls(errors.email)}
                />
              </IconInput>
            </Field>

            <Field label="Mobile Number" required error={errors.mobileNumber}>
              <IconInput icon={Phone}>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={form.mobileNumber}
                  onChange={set("mobileNumber")}
                  className={cls(errors.mobileNumber)}
                />
              </IconInput>
            </Field>
          </div>

          {/* Work */}
          <Divider label="Work" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Department" required error={errors.department}>
              <div className="relative">
                <Building2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <select
                  value={form.departmentId}
                  onChange={set("departmentId")}
                  disabled={departmentsLoading}
                  className={`${cls(errors.department)} pr-8 appearance-none`}
                >
                  <option value="">
                    {departmentsLoading ? "Loading..." : "Select department…"}
                  </option>
                  {departments.map((dept) => (
                    
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                      {console.log(dept)
                      }
                    </option>
                  ))}
                  <option value="__CREATE_NEW__" className="font-semibold">
                    + Create New Department
                  </option>
                </select>
              </div>
            </Field>

            <Field label="Designation" required error={errors.designation}>
              <div className="relative">
                <Briefcase
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <select
                  value={form.designationId}
                  onChange={set("designationId")}
                  disabled={designationsLoading}
                  className={`${cls(errors.designation)} pr-8 appearance-none`}
                >
                  <option value="">
                    {designationsLoading ? "Loading..." : "Select designation…"}
                  </option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>
                      {desig.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__" className="font-semibold">
                    + Create New Designation
                  </option>
                </select>
              </div>
            </Field>

            <Field label="User Type" required error={errors.userType}>
              <div className="relative">
                <ShieldCheck
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <select
                  value={form.userType}
                  onChange={set("userType")}
                  className={`${cls(errors.userType)} pr-8 appearance-none`}
                >
                  <option value="">Select type…</option>
                  {USER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Shift Timing" required error={errors.shift}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                  />
                  <input
                    type="time"
                    placeholder="Start time"
                    value={shiftTime.startTime}
                    onChange={setShiftTimeField("startTime")}
                    className={`${cls(errors.shift)} pl-9`}
                  />
                </div>
                <span className="text-text-muted font-semibold">-</span>
                <div className="relative flex-1">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                  />
                  <input
                    type="time"
                    placeholder="End time"
                    value={shiftTime.endTime}
                    onChange={setShiftTimeField("endTime")}
                    className={`${cls(errors.shift)} pl-9`}
                  />
                </div>
              </div>
            </Field>
          </div>

          {/* Location */}
          <Divider label="Work Location" />
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMapPickerOpen(true)}
              className="w-full px-4 py-3 text-xs font-semibold rounded-xl border-2 border-dashed border-border bg-background text-text-secondary hover:border-text-primary hover:bg-surface transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              {form.workLocation.address ? "Edit Location" : "Select Location on Map"}
            </button>

            {form.workLocation.address && (
              <div className="p-3 rounded-lg bg-background border border-border space-y-2">
                <p className="text-xs text-text-muted">
                  <span className="font-semibold">Address:</span>{" "}
                  {form.workLocation.address}
                </p>
                <p className="text-xs text-text-muted">
                  <span className="font-semibold">Coordinates:</span>{" "}
                  {form.workLocation.lat}, {form.workLocation.lng}
                </p>
              </div>
            )}

            {errors.workLocationAddress && (
              <p className="text-xs text-absent-text flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-absent-text inline-block" />
                {errors.workLocationAddress}
              </p>
            )}
          </div>

          {/* Weekend Off */}
          <Divider label="Weekend Off" />
          <div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = form.weekendOff.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekendDay(day.value)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: "var(--color-primary)",
                            color: "var(--color-primary-foreground)",
                            borderColor: "var(--color-primary)",
                          }
                        : {
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-text-secondary)",
                            borderColor: "var(--color-border)",
                          }
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            {form.weekendOff.length > 0 && (
              <p className="text-xs text-text-muted mt-2.5">
                Off on:{" "}
                <span className="font-medium text-text-secondary">
                  {form.weekendOff
                    .sort((a, b) => a - b)
                    .map((d) => DAYS.find((day) => day.value === d)?.label)
                    .join(", ")}
                </span>
              </p>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-7 py-4 shrink-0 border-t border-border bg-background">
          <p className="text-xs text-text-muted">
            <span className="text-absent-text">*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
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
              {isEdit ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </div>
      </div>

      {/* Department Create Modal */}
      <DepartmentCreateModal
        open={departmentModalOpen}
        onClose={() => setDepartmentModalOpen(false)}
        onSubmit={handleCreateDepartment}
        loading={creatingDepartment}
      />

      {/* Designation Create Modal */}
      <DesignationCreateModal
        open={designationModalOpen}
        onClose={() => setDesignationModalOpen(false)}
        onSubmit={handleCreateDesignation}
        loading={creatingDesignation}
      />

      {/* Map Picker Modal */}
      <MapPickerModal
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={handleMapLocationConfirm}
        loading={false}
      />
    </div>
  );
};

export default EmployeeFormModal;
