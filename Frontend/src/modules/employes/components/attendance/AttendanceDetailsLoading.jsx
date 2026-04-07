import React from "react";

// Reusable pulse bar
const PulseBar = ({ className }) => (
  <div className={`animate-pulse rounded-md bg-border ${className}`} />
);

// Reusable pulse circle
const PulseCircle = ({ className }) => (
  <div className={`animate-pulse rounded-full bg-border ${className}`} />
);

const AttendanceDetailsLoading = () => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
          <PulseBar className="w-28 h-4" />
          <PulseBar className="w-7 h-7 rounded-lg" />
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Status dot + label */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <PulseCircle className="w-2 h-2" />
              <PulseBar className="w-16 h-3" />
            </div>
            {/* Date */}
            <PulseBar className="w-36 h-6 mt-1" />
          </div>

          {/* Two-column: Time In / Time Out */}
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                {/* Label */}
                <PulseBar className="w-14 h-3" />
                {/* Time value */}
                <PulseBar className="w-20 h-5" />
                {/* Photo thumbnail */}
                <div className="w-20 aspect-square rounded-lg bg-border animate-pulse" />
                {/* Location lines */}
                <PulseBar className="w-full h-3" />
                <PulseBar className="w-3/4 h-3" />
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Rows: logged hours + extra time */}
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <PulseCircle className="w-4 h-4" />
                <PulseBar className="w-24 h-3" />
              </div>
              <PulseBar className="w-12 h-3" />
            </div>
          ))}

          {/* Close button */}
          <PulseBar className="w-full h-8 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsLoading;