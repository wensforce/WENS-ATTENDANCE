import React, { useEffect, useState } from "react";
import { X, Clock, Loader2, Coffee } from "lucide-react";
import { toast } from "react-toastify";
import { formatDate } from "../../../../shared/utils/dateUtil.js";
import { breakApi } from "../../api/breakApi.js";

const toTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * Edit break modal — employee + date (read-only).
 * Start/end use native time input (same as RegularizeRequestModal).
 * Value is already HH:mm (24h) for the API.
 */
const BreakEditModal = ({ open, onClose, breakRecord, onSuccess }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !breakRecord) return;
    setStartTime(toTimeInput(breakRecord.startTime));
    setEndTime(
      breakRecord.endTime
        ? toTimeInput(breakRecord.endTime)
        : toTimeInput(breakRecord.startTime),
    );
    setError("");
    setLoading(false);
  }, [open, breakRecord]);

  if (!open || !breakRecord) return null;

  const employeeName = breakRecord.user?.employeeName || "Employee";
  const employeeId = breakRecord.user?.employeeId || "—";
  const dateLabel = formatDate(breakRecord.startTime);
  const breakLabel =
    breakRecord.breakConfig?.label ||
    breakRecord.breakConfig?.breakType ||
    "Break";

  const initials = employeeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!startTime || !endTime) {
      setError("Start and end times are required");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      // type="time" already gives HH:mm (24h)
      await breakApi.updateBreak(breakRecord.id, { startTime, endTime });
      toast.success("Break updated successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update break";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden border border-border">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <h2 className="text-base font-semibold text-text-primary">
            Edit Break
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-bold">
              {initials || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {employeeName}
              </p>
              <p className="text-xs text-text-muted">
                {employeeId} · {dateLabel}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-background px-3 py-2.5 flex items-center gap-2 text-xs text-text-secondary">
            <Coffee size={14} className="text-text-muted shrink-0" />
            <span>
              Type:{" "}
              <span className="font-semibold text-text-primary">
                {breakLabel}
              </span>
            </span>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Start time
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={loading}
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
              disabled={loading}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8 disabled:opacity-60"
            />
          </label>

          {error && <p className="text-xs text-absent-text">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-background disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-text-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakEditModal;
