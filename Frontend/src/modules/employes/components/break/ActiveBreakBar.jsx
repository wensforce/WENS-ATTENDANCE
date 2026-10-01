import React, { useEffect, useState } from "react";
import { Coffee, Loader2 } from "lucide-react";

const formatElapsed = (startIso) => {
  if (!startIso) return "00:00";
  const start = new Date(startIso).getTime();
  const diff = Math.max(0, Date.now() - start);
  const totalSec = Math.floor(diff / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Sticky status bar when a break is open (endTime === null).
 * Place above StatsCards.
 */
const ActiveBreakBar = ({ activeBreak, ending = false, onEnd }) => {
  const [elapsed, setElapsed] = useState(() =>
    formatElapsed(activeBreak?.startTime),
  );

  useEffect(() => {
    if (!activeBreak?.startTime) return;
    setElapsed(formatElapsed(activeBreak.startTime));
    const id = setInterval(() => {
      setElapsed(formatElapsed(activeBreak.startTime));
    }, 1000);
    return () => clearInterval(id);
  }, [activeBreak?.startTime, activeBreak?.id]);

  if (!activeBreak) return null;

  const label =
    activeBreak.breakConfig?.label ||
    activeBreak.breakConfig?.breakType ||
    "Break";

  return (
    <div className="mb-4 flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-text-primary text-white">
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <Coffee size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/70 truncate">{label}</p>
        <p className="text-lg font-bold tabular-nums leading-tight">{elapsed}</p>
      </div>
      <button
        type="button"
        onClick={onEnd}
        disabled={ending}
        className="px-3.5 py-2 rounded-xl bg-white text-text-primary text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5 shrink-0"
      >
        {ending && <Loader2 size={12} className="animate-spin" />}
        End
      </button>
    </div>
  );
};

export default ActiveBreakBar;
