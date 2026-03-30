import React from "react";
import { X, CalendarX, FileText, Tag, MessageSquare } from "lucide-react";

const AbsentModal = ({ isOpen, onClose, attendanceData, loading }) => {
  if (!isOpen) return null;

  const data = {
    date: attendanceData?.date || "N/A",
    reason: attendanceData?.reason || "N/A",
    leaveType: attendanceData?.leaveType || "N/A",
    notes: attendanceData?.notes || null,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-white">Loading...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <h2 className="text-base font-semibold text-text-primary">
            Absent Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh] px-5 py-4">
          {/* Status and Date */}
          <div className="mb-5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-600">ABSENT</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{data.date}</p>
          </div>

          {/* Absent Icon Illustration */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
              <CalendarX className="w-9 h-9 text-red-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {/* Leave Type */}
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-xs text-text-primary font-medium">
                  Leave Type
                </span>
              </div>
              <span className="text-xs font-semibold text-text-primary">
                {data.leaveType}
              </span>
            </div>

            {/* Reason */}
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs text-text-primary font-medium">
                  Reason
                </span>
              </div>
              <span className="text-xs font-semibold text-text-primary max-w-[55%] text-right">
                {data.reason}
              </span>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs text-text-primary font-medium">
                    Notes
                  </span>
                </div>
                <p className="text-xs text-text-secondary bg-background rounded-lg px-3 py-2 leading-relaxed">
                  {data.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbsentModal;
