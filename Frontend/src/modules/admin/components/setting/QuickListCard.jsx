import React from "react";

const QuickListCard = ({ title, icon: Icon, items = [], loading, onViewAll, emptyText, renderItem }) => {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="p-3 space-y-1 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading…</div>
        ) : safeItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">{emptyText}</div>
        ) : (
          safeItems.slice(0, 6).map(renderItem)
        )}
      </div>
    </div>
  );
};

export default QuickListCard;
