import React, { useEffect, useState } from "react";
import { X, Loader2, Building2, User, Mail, Phone, Hash } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  employeeName: "",
  email: "",
  mobileNumber: "",
  employeeId: "ADMIN",
  status: "active",
  bodyguardEnabled: false,
};

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
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

const inputClass =
  "w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50";

const TenantFormModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  editData = null,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(editData);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setForm({
        ...EMPTY_FORM,
        name: editData.name ?? "",
        status: editData.status ?? "active",
        bodyguardEnabled: Boolean(editData.bodyguardEnabled),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, editData]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Company name is required";
    if (!isEdit) {
      if (!form.employeeName.trim()) next.employeeName = "Admin name is required";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        next.email = "Valid admin email is required";
      }
      if (!/^\d{10}$/.test(form.mobileNumber.trim())) {
        next.mobileNumber = "Enter a 10-digit mobile number";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isEdit) {
      onSubmit({
        name: form.name.trim(),
        status: form.status,
        bodyguardEnabled: form.bodyguardEnabled,
      });
      return;
    }
    onSubmit({
      name: form.name.trim(),
      bodyguardEnabled: form.bodyguardEnabled,
      admin: {
        employeeName: form.employeeName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        employeeId: form.employeeId.trim() || "ADMIN",
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-surface max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {isEdit ? "Edit company" : "New company"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit
                ? "Update the company name or status"
                : "Creates the company and its first admin in one step"}
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

        <form onSubmit={handleSubmit} className="px-6 pb-2 space-y-4 overflow-y-auto">
          <Field label="Company name" required error={errors.name}>
            <div className="relative">
              <Building2
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="e.g. Acme Pvt Ltd"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </Field>

          {isEdit && (
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary border-border focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          )}

          <label className="flex items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.bodyguardEnabled}
              onChange={(e) => setField("bodyguardEnabled", e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 accent-text-primary"
            />
            <span>
              <span className="text-xs font-semibold text-text-primary">
                Bodyguard service
              </span>
              <span className="block text-xs text-text-muted mt-0.5">
                Lets this company add bodyguards and special duty attendance
              </span>
            </span>
          </label>

          {!isEdit && (
            <>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide pt-1">
                First admin
              </p>
              <Field label="Admin name" required error={errors.employeeName}>
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Ravi Kumar"
                    value={form.employeeName}
                    onChange={(e) => setField("employeeName", e.target.value)}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </Field>
              <Field label="Admin email" required error={errors.email}>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="email"
                    placeholder="e.g. ravi@acme.com"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </Field>
              <Field label="Admin mobile" required error={errors.mobileNumber}>
                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={form.mobileNumber}
                    onChange={(e) =>
                      setField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </Field>
              <Field label="Employee ID">
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="ADMIN"
                    value={form.employeeId}
                    onChange={(e) => setField("employeeId", e.target.value)}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </Field>
            </>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-border bg-background">
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
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-text-primary text-white hover:opacity-85"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create company"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantFormModal;
