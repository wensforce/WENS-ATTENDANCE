import React from "react";
import { Plus } from "lucide-react";

const SectionHeader = ({ title, count, onAdd, addLabel }) => (
  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
    <div>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <p className="text-xs text-text-secondary mt-0.5">
        {count !== undefined ? `${count} item${count !== 1 ? "s" : ""}` : ""}
      </p>
    </div>
    {onAdd && (
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <Plus size={13} />
        {addLabel}
      </button>
    )}
  </div>
);

export default SectionHeader;
