import React from "react";
import { WifiOff } from "lucide-react";

const OfflineScreen = ({ onRetry, retrying = false }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center">
          <WifiOff size={28} className="text-text-muted" />
        </div>
        <h1 className="text-lg font-bold text-text-primary">No internet connection</h1>
        <p className="mt-2 text-sm text-text-muted">
          Check your connection and try again. You won&apos;t be signed out.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-6 px-5 py-2.5 text-sm font-semibold rounded-xl transition-opacity disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          {retrying ? "Checking…" : "Retry"}
        </button>
      </div>
    </div>
  );
};

export default OfflineScreen;
