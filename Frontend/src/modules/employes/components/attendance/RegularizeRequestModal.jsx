import React, { useEffect, useState } from "react";
import { X, Clock, FileText, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { regularizeApi } from "../../../../shared/api/regularizeApi";

const toTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const RegularizeRequestModal = ({
  isOpen,
  onClose,
  date,
  displayDate,
  existingCheckIn,
  existingCheckOut,
  existingRequest,
  onSubmitted,
}) => {
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCheckInTime(toTimeInput(existingCheckIn));
    setCheckOutTime(toTimeInput(existingCheckOut));
    setReason("");
    setError("");
  }, [isOpen, existingCheckIn, existingCheckOut]);

  if (!isOpen) return null;

  const pending = existingRequest?.status === "PENDING";
  const approved = existingRequest?.status === "APPROVED";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!checkInTime || !checkOutTime) {
      setError("Check-in and check-out times are required");
      return;
    }
    if (checkOutTime <= checkInTime) {
      setError("Check-out must be after check-in");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please enter a reason (at least 5 characters)");
      return;
    }

    setSubmitting(true);
    try {
      await regularizeApi.create({
        date,
        checkInTime: new Date(`${date}T${checkInTime}`).toISOString(),
        checkOutTime: new Date(`${date}T${checkOutTime}`).toISOString(),
        reason: reason.trim(),
      });
      toast.success("Regularization request submitted");
      onSubmitted?.();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to submit request";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!existingRequest?.id) return;
    setCancelling(true);
    try {
      await regularizeApi.cancel(existingRequest.id);
      toast.success("Request cancelled");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <h2 className="text-base font-semibold text-text-primary">
            Regularize attendance
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-text-muted mb-1">Date</p>
          <p className="text-sm font-semibold text-text-primary mb-4">
            {displayDate}
          </p>

          {pending && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Your request is pending admin review.
              </p>
              <p className="text-xs text-text-muted">
                Check-in {toTimeInput(existingRequest.requestedCheckIn) || "—"} ·
                Check-out {toTimeInput(existingRequest.requestedCheckOut) || "—"}
              </p>
              <button
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="w-full px-3 py-2 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-background disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel request"}
              </button>
            </div>
          )}

          {approved && (
            <p className="text-sm text-present-text">
              This day was already regularized and approved.
            </p>
          )}

          {!pending && !approved && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Check-in
                </span>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Check-out
                </span>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-black/8"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  Reason
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Why do you need this day corrected?"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/8 resize-none"
                />
              </label>
              {error && <p className="text-xs text-absent-text">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegularizeRequestModal;
