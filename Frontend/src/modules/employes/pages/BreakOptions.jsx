import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { breakApi } from "../api/breakApi.js";
import BreakOptionsList from "../components/break/BreakOptionsList.jsx";

/**
 * Full-page break options (shortcut / deep link later).
 * Same cards as BreakOptionsModal.
 */
const BreakOptions = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
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
  }, []);

  const handleSelect = async (opt) => {
    if (!opt?.id || startingId || opt.alreadyTaken) return;
    setStartingId(opt.id);
    try {
      await breakApi.start(opt.id);
      toast.success(`${opt.label || opt.breakType} started`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start break");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <main className="w-full p-4 bg-background min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-border bg-surface hover:bg-background transition-colors"
        >
          <ArrowLeft size={16} className="text-text-primary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Choose break</h1>
          <p className="text-xs text-text-muted">Tap a card to start</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      ) : (
        <BreakOptionsList
          options={options}
          startingId={startingId}
          onSelect={handleSelect}
        />
      )}
    </main>
  );
};

export default BreakOptions;
