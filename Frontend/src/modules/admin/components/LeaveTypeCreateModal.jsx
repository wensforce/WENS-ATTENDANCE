import React, { useEffect, useState } from "react";
import { X, Loader2, CalendarDays } from "lucide-react";

const SUGGESTIONS = {
  LEAVE: [
    "Casual Leave",
    "Sick Leave",
    "Paid Leave",
    "Unpaid Leave",
    "Maternity Leave",
  ],
  HOLIDAY: [
    "Week Off",
    "National Holiday",
    "Festival Holiday",
    "Optional Holiday",
    "Company Shutdown",
  ],
};

const LeaveTypeCreateModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData = null,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("LEAVE");
  const [error, setError] = useState("");

  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setType(initialData?.type || "LEAVE");
      setError("");
    }
  }, [open, initialData]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!name.trim()) {
      setError("Sub type name is required");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), type });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-surface">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {isEdit ? "Edit Sub Type" : "New Sub Type"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit
                ? "Update sub type details"
                : "Create a leave or holiday sub type"}
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
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Used For
              <span className="text-absent-text ml-0.5">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
            >
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
            <p className="text-xs text-text-muted">
              {type === "LEAVE"
                ? "Shown when adding a leave entry"
                : "Shown when adding a holiday entry"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Sub Type Name
              <span className="text-absent-text ml-0.5">*</span>
            </label>
            <div className="relative">
              <CalendarDays
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder={
                  type === "LEAVE" ? "e.g. Casual Leave" : "e.g. Week Off"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-all border-border focus:border-text-primary focus:ring-2 focus:ring-black/8 disabled:opacity-50"
              />
            </div>
            {error && (
              <p className="text-xs text-absent-text flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-absent-text inline-block" />
                {error}
              </p>
            )}
          </div>

          {!isEdit && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[type].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setName(s)}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-text-secondary hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Footer */}
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
            {isEdit ? "Update Sub Type" : "Create Sub Type"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeCreateModal;
