import React from "react";
import { Coffee, ChevronRight, Loader2 } from "lucide-react";

/**
 * Shared card list of break options.
 * Used by BreakOptionsModal and BreakOptions page.
 * Options with alreadyTaken=true are shown disabled.
 */
const BreakOptionsList = ({
  options = [],
  loading = false,
  startingId = null,
  onSelect,
  emptyText = "No breaks available for you",
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Loading options…</p>
      </div>
    );
  }

  if (!options.length) {
    return (
      <p className="text-sm text-text-muted text-center py-8">{emptyText}</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const busy = startingId === opt.id;
        const taken = Boolean(opt.alreadyTaken);
        const disabled = !!startingId || taken;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (taken) return;
              onSelect?.(opt);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
              taken
                ? "border-border bg-background/60 opacity-55 cursor-not-allowed"
                : "border-border bg-surface hover:bg-background active:scale-[0.99] disabled:opacity-60"
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
              <Coffee
                size={20}
                className={taken ? "text-text-muted" : "text-text-primary"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold truncate ${
                    taken ? "text-text-muted" : "text-text-primary"
                  }`}
                >
                  {opt.label || opt.breakType}
                </p>
                {taken && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-absent-bg text-absent-text shrink-0">
                    Taken
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {taken
                  ? opt.statusMessage || "Already taken today"
                  : `Max ${opt.maxDurationMins} min${
                      opt.maxPerDay != null
                        ? ` · ${opt.usedToday ?? 0}/${opt.maxPerDay} today`
                        : ""
                    }${opt.isPaid ? " · Paid" : " · Unpaid"}`}
              </p>
            </div>
            {busy ? (
              <Loader2 size={18} className="animate-spin text-text-muted" />
            ) : taken ? null : (
              <ChevronRight size={18} className="text-text-muted shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BreakOptionsList;
