import React from "react";
import { AlertCircle, X } from "lucide-react";

// ─── Confirm Modal Component ──────────────────────────────────────────────────

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  loading = false,
}) => {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-border overflow-hidden animate-in">
        {/* Header */}
        <div className={`px-6 py-5 border-b border-border flex items-center justify-between ${
          isDangerous ? "bg-absent-bg/10" : "bg-surface"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDangerous 
                ? "bg-absent-bg text-absent-text" 
                : "bg-holiday-bg text-holiday-text"
            }`}>
              <AlertCircle size={20} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-sm text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 bg-background">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-surface border border-border text-text-primary hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDangerous
                ? "bg-absent-text hover:opacity-85"
                : "bg-text-primary hover:opacity-85"
            }`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
