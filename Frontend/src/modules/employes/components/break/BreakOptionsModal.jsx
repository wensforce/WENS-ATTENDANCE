import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { breakApi } from "../../api/breakApi.js";
import BreakOptionsList from "./BreakOptionsList.jsx";

/**
 * Modal: load GET /break/options as cards, tap → POST /break/start
 */
const BreakOptionsModal = ({ open, onClose, onStarted }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setStartingId(null);
      try {
        const { data } = await breakApi.fetchOptions();
        if (!cancelled) setOptions(data?.breakOptions || []);
      } catch (err) {
        if (!cancelled) {
          setOptions([]);
          toast.error(
            err.response?.data?.message || "Failed to load break options",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelect = async (opt) => {
    if (!opt?.id || startingId || opt.alreadyTaken) return;
    setStartingId(opt.id);
    try {
      const { data } = await breakApi.start(opt.id);
      toast.success(`${opt.label || opt.breakType} started`);
      onStarted?.(data?.break);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start break");
    } finally {
      setStartingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg border border-border max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/40 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Choose break
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Tap a card to start
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!!startingId}
            className="p-1.5 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <BreakOptionsList
            options={options}
            loading={loading}
            startingId={startingId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default BreakOptionsModal;
