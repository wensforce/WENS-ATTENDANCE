import React from "react";

const StatCard = ({ label, value, icon: Icon, onClick, description }) => (
  <div
    onClick={onClick}
    className={`bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm ${
      onClick ? "cursor-pointer hover:border-text-primary/30 transition-colors" : ""
    }`}
  >
    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0">
      <Icon size={18} className="text-text-muted" />
    </div>
    <div>
      <p className="text-xs font-medium text-text-secondary mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
  </div>
);

export default StatCard;
