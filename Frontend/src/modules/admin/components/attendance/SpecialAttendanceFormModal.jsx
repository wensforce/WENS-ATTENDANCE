import React, { useEffect, useState } from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { specialAttendanceApi } from "../../api/specialAttendanceAPi";
import { employeesApi } from "../../api/employeesApi";
import SpinLoading from "../../../../shared/components/SpinLoading.jsx";

const SpecialAttendanceFormModal = ({
  open,
  onClose,
  onSubmit,
  editData,
  loading,
}) => {
  const [formData, setFormData] = useState({
    userId: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    workHours: "",
  });

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const response = await employeesApi.fetchAllEmployees(1);
        setEmployees(response.data?.employees || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setEmployeesLoading(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // Populate form with edit data
  useEffect(() => {
    if (editData) {
      const date = new Date(editData.date);
      const formattedDate = date.toISOString().split("T")[0];

      const checkInTime = editData.checkInTime
        ? new Date(editData.checkInTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "";

      const checkOutTime = editData.checkOutTime
        ? new Date(editData.checkOutTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "";

      setFormData({
        userId: editData.userId || "",
        date: formattedDate,
        checkInTime,
        checkOutTime,
        workHours: editData.workHours || "",
      });
    } else {
      setFormData({
        userId: "",
        date: "",
        checkInTime: "",
        checkOutTime: "",
        workHours: "",
      });
    }
    setErrors({});
  }, [editData, open]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId) newErrors.userId = "Employee is required";
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      userId: parseInt(formData.userId),
      date: formData.date,
    };

    // Only add times if provided
    if (formData.checkInTime) {
      payload.checkInTime = new Date(
        `${formData.date}T${formData.checkInTime}`
      ).toISOString();
    }
    if (formData.checkOutTime) {
      payload.checkOutTime = new Date(
        `${formData.date}T${formData.checkOutTime}`
      ).toISOString();
    }

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-surface rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {editData ? "Edit Special Attendance" : "Add Special Attendance"}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {editData
                ? "Update the special attendance record details"
                : "Create a new special attendance record"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Employee *
            </label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              disabled={employeesLoading || loading}
              className={`w-full px-4 py-2.5 text-sm bg-background border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary transition ${
                errors.userId
                  ? "border-red-500"
                  : "border-border hover:border-text-primary"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.userId}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Date *
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted shrink-0" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 text-sm bg-background border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary transition ${
                  errors.date
                    ? "border-red-500"
                    : "border-border hover:border-text-primary"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.date}
              </p>
            )}
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Check-In Time */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Check-In Time
              </label>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-muted shrink-0" />
                <input
                  type="time"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary transition hover:border-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Check-Out Time */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Check-Out Time
              </label>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-muted shrink-0" />
                <input
                  type="time"
                  name="checkOutTime"
                  value={formData.checkOutTime}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary transition hover:border-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Work Hours (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Work Hours (Auto-calculated)
            </label>
            <input
              type="text"
              value={formData.workHours}
              disabled
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg text-text-muted cursor-not-allowed"
              placeholder="Will be calculated automatically"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || employeesLoading}
              className="ml-auto px-6 py-2.5 text-sm font-medium text-white bg-text-primary rounded-lg hover:opacity-85 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <SpinLoading />}
              <span>{editData ? "Update" : "Create"} Special Attendance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpecialAttendanceFormModal;
