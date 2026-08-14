import React, { useEffect, useState } from "react";
import { X, Link, Zap } from "lucide-react";

const WEBHOOK_EVENTS = ["check_in", "check_out", "leave_added", "user_registered"];

const EMPTY = { url: "", event: WEBHOOK_EVENTS[0] };

const WebhookCreateModal = ({ open, onClose, onSubmit, loading = false, initialData = null }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initialData ? { url: initialData.url, event: initialData.eventType } : EMPTY);
      setErrors({});
    }
  }, [open, initialData]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.url.trim()) e.url = "URL is required";
    else {
      try { new URL(form.url); } catch { e.url = "Enter a valid URL"; }
    }
    if (!form.event) e.event = "Event is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ url: form.url.trim(), event: form.event });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-surface">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {initialData ? "Edit Webhook" : "New Webhook"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {initialData ? "Update webhook endpoint" : "Register a new webhook endpoint"}
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
          {/* URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Endpoint URL <span className="text-absent-text ml-0.5">*</span>
            </label>
            <div className="relative">
              <Link
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                  errors.url
                    ? "border-absent-text focus:ring-absent-text/20"
                    : "border-border focus:ring-border"
                }`}
              />
            </div>
            {errors.url && <p className="text-xs text-absent-text">{errors.url}</p>}
          </div>

          {/* Event */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary tracking-wide">
              Event <span className="text-absent-text ml-0.5">*</span>
            </label>
            <div className="relative">
              <Zap
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <select
                value={form.event}
                onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))}
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-background text-text-primary focus:outline-none focus:ring-2 transition-all ${
                  errors.event
                    ? "border-absent-text focus:ring-absent-text/20"
                    : "border-border focus:ring-border"
                }`}
              >
                {WEBHOOK_EVENTS.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>
            {errors.event && <p className="text-xs text-absent-text">{errors.event}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-text-secondary hover:bg-background transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              {loading ? "Saving…" : initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebhookCreateModal;
