import React, { useState } from "react";
import { X, Copy, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

// ─── Employee PIN Modal ───────────────────────────────────────────────────────

const EmployeePinModal = ({ open, onClose, email, pin, employeeName }) => {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-border overflow-hidden animate-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-linear-to-r from-present-bg to-surface">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Employee Credentials
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {employeeName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Email Section */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2.5 uppercase tracking-wide">
              Email
            </label>
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 group hover:border-text-primary transition-colors">
              <span className="flex-1 text-sm font-medium text-text-primary break-all">
                {email}
              </span>
              <button
                onClick={() => handleCopy(email, "email")}
                className="shrink-0 ml-2 p-2 rounded-md hover:bg-surface transition-colors"
                title="Copy email"
              >
                {copiedField === "email" ? (
                  <CheckCircle size={18} className="text-present-text" />
                ) : (
                  <Copy size={18} className="text-text-muted group-hover:text-text-primary transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* PIN Section */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2.5 uppercase tracking-wide">
              Temporary PIN
            </label>
            <div className="flex items-center gap-3 bg-linear-to-r from-present-bg/10 to-present-bg/5 border-2 border-present-bg rounded-xl px-6 py-6 group hover:border-present-text transition-all">
              <div className="flex-1">
                <p className="text-5xl font-bold text-present-text font-mono tracking-widest">
                  {pin}
                </p>
                <p className="text-xs text-present-text/70 mt-2">
                  Use this PIN to login initially
                </p>
              </div>
              <button
                onClick={() => handleCopy(pin, "pin")}
                className="shrink-0 p-3 rounded-lg bg-present-bg hover:bg-present-text transition-colors"
                title="Copy PIN"
              >
                {copiedField === "pin" ? (
                  <CheckCircle size={24} className="text-white" />
                ) : (
                  <Copy size={24} className="text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-background border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-text-secondary leading-relaxed">
              💡 <span className="font-medium">Note:</span> If you close this popup, you can find the PIN in the employee's email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-text-primary text-white text-sm font-medium rounded-lg hover:opacity-85 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePinModal;
