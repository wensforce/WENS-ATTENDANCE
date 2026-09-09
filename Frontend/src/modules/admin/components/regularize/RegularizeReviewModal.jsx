import React, { useEffect, useState } from "react";
import { X, Clock, FileText, Loader2 } from "lucide-react";
import { formatDate } from "../../../../shared/utils/dateUtil";

const toTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const formatClock = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const RegularizeReviewModal = ({
  open,
  onClose,
  request,
  loading = false,
  onApprove,
  onReject,
}) => {
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !request) return;
    setCheckInTime(toTimeInput(request.requestedCheckIn));
    setCheckOutTime(toTimeInput(request.requestedCheckOut));
    setAdminNote(request.adminNote || "");
    setError("");
  }, [open, request]);

  if (!open || !request) return null;

  const dateStr = request.date ? formatDate(request.date) : "";
  const isPending = request.status === "PENDING";

  const buildPayload = () => {
    if (!checkInTime || !checkOutTime) {
      setError("Check-in and check-out times are required");
      return null;
    }
    if (checkOutTime <= checkInTime) {
      setError("Check-out must be after check-in");
      return null;
    }
    return {
      checkInTime: new Date(`${dateStr}T${checkInTime}`).toISOString(),
      checkOutTime: new Date(`${dateStr}T${checkOutTime}`).toISOString(),
      adminNote: adminNote.trim() || undefined,
    };
  };

  const handleApprove = () => {
    const payload = buildPayload();
    if (!payload) return;
    onApprove(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Regularization request
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-bold">
              {(request.user?.employeeName || "?")
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {request.user?.employeeName || "Employee"}
              </p>
              <p className="text-xs text-text-muted">
                {request.user?.employeeId || "—"} · {dateStr}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-background p-3 text-xs text-text-secondary">
            <p className="font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <FileText size={13} /> Reason
            </p>
            {request.reason}
          </div>

          {request.currentAttendance && (
            <div className="text-xs text-text-muted">
              Current record: in {formatClock(request.currentAttendance.checkInTime)} ·
              out {formatClock(request.currentAttendance.checkOutTime)}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Clock size={13} /> Check-in
            </span>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              disabled={!isPending}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
              <Clock size={13} /> Check-out
            </span>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              disabled={!isPending}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-primary mb-1 block">
              Admin note
            </span>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              disabled={!isPending}
              maxLength={500}
              placeholder="Optional note for the employee"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none resize-none disabled:opacity-60"
            />
          </label>
          {error && <p className="text-xs text-absent-text">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 bg-background">
          {isPending ? (
            <>
              <button
                onClick={() => onReject({ adminNote: adminNote.trim() || undefined })}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border text-absent-text hover:bg-absent-bg/20 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-text-primary text-white hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-text-primary text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegularizeReviewModal;
