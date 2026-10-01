import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
  Hash,
  Tag,
  Timer,
  Users,
  Shield,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../../login/hooks/useAuth.js";
import { breakConfigApi } from "../../api/breakConfigApi.js";
import { formatDate } from "../../../../shared/utils/dateUtil.js";
import BreakConfigEditModal from "../../components/break/BreakConfigEditModal.jsx";
import BreakAccessAddModal from "../../components/break/BreakAccessAddModal.jsx";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p className="text-sm text-text-primary font-semibold mt-0.5 break-words">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, action, children }) => (
  <div className="bg-surface rounded-xl border border-border shadow-sm">
    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
      {Icon && <Icon size={15} className="text-text-muted" />}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const AccessBadge = ({ isAllowed }) =>
  isAllowed ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-present-bg text-present-text whitespace-nowrap">
      <CheckCircle size={12} />
      Allowed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-absent-bg text-absent-text whitespace-nowrap">
      <XCircle size={12} />
      Blocked
    </span>
  );

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="bg-surface rounded-xl border border-border p-6 flex gap-4">
      <div className="w-14 h-14 rounded-xl bg-border shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-5 bg-border rounded w-56" />
        <div className="h-3 bg-border rounded w-40" />
        <div className="h-3 bg-border rounded w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface rounded-xl border border-border p-5 space-y-3"
        >
          <div className="h-4 bg-border rounded w-32" />
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

const BreakConfigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [breakAccess, setBreakAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addAccessOpen, setAddAccessOpen] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await breakConfigApi.getById(id);
      setConfig(data?.breakConfig || null);
      setBreakAccess(data?.breakAccess || []);
      if (!data?.breakConfig) setError("Break config not found.");
    } catch (err) {
      setError(err.response?.data?.message || "Break config not found.");
      setConfig(null);
      setBreakAccess([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggleAccess = async (row) => {
    const next = !row.isAllowed;
    setTogglingUserId(row.userId);
    setBreakAccess((prev) =>
      prev.map((a) =>
        a.userId === row.userId ? { ...a, isAllowed: next } : a,
      ),
    );
    try {
      await breakConfigApi.setAccess(row.userId, {
        breakConfigId: Number(id),
        isAllowed: next,
      });
      toast.success(
        next
          ? `Access allowed for ${row.employeeName || "employee"}`
          : `Access blocked for ${row.employeeName || "employee"}`,
      );
    } catch (err) {
      setBreakAccess((prev) =>
        prev.map((a) =>
          a.userId === row.userId ? { ...a, isAllowed: row.isAllowed } : a,
        ),
      );
      toast.error(err.response?.data?.message || "Failed to update access");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleAccessAdded = (entry, emp) => {
    setBreakAccess((prev) => {
      const exists = prev.some((a) => a.userId === (entry.userId || emp?.id));
      const userId = entry.userId || emp?.id;
      if (exists) {
        return prev.map((a) =>
          a.userId === userId
            ? {
                ...a,
                ...entry,
                employeeName: entry.employeeName || emp?.employeeName,
                employeeId: entry.employeeId || emp?.employeeId,
              }
            : a,
        );
      }
      return [
        {
          id: entry.id,
          userId,
          breakConfigId: Number(id),
          isAllowed: entry.isAllowed,
          employeeName: entry.employeeName || emp?.employeeName,
          employeeId: entry.employeeId || emp?.employeeId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
        ...prev,
      ];
    });
  };

  const allowedCount = breakAccess.filter((a) => a.isAllowed).length;
  const blockedCount = breakAccess.filter((a) => !a.isAllowed).length;

  return (
    <main className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate("/admin/breaks/configs")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Break Config Details
          </h1>
          <p className="text-xs text-text-secondary">
            Configuration & employee access
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.employeeName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="text-sm font-medium text-weekoff-text hidden sm:block">
            {user?.employeeName}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </header>

      <div className="p-6 space-y-6">
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <AlertCircle size={32} className="text-absent-text mx-auto mb-3" />
            <p className="text-text-muted">{error}</p>
          </div>
        ) : config ? (
          <>
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-holiday-bg text-holiday-text flex items-center justify-center shrink-0">
                <Coffee size={26} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {config.label || "—"}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text">
                    {config.breakType}
                  </span>
                  {config.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-present-bg text-present-text">
                      <CheckCircle size={12} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-absent-bg text-absent-text">
                      <XCircle size={12} />
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mb-3">
                  Scope: {config.scope}
                  {config.isPaid ? " · Paid" : " · Unpaid"} · Config #{config.id}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Timer size={13} className="text-text-muted" />
                    {config.maxDurationMins} min max
                    {config.graceMins != null
                      ? ` (+${config.graceMins} grace)`
                      : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} className="text-text-muted" />
                    {config.maxPerDay} / day
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-text-muted" />
                    {allowedCount} allowed · {blockedCount} blocked
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity shrink-0"
              >
                Edit Config
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Configuration" icon={Tag}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Hash}
                    label="Break type"
                    value={config.breakType}
                  />
                  <InfoRow icon={Tag} label="Label" value={config.label} />
                  <InfoRow
                    icon={Timer}
                    label="Max duration"
                    value={`${config.maxDurationMins} minutes`}
                  />
                  <InfoRow
                    icon={Hash}
                    label="Max per day"
                    value={String(config.maxPerDay)}
                  />
                  <InfoRow
                    icon={Timer}
                    label="Grace minutes"
                    value={String(config.graceMins ?? 0)}
                  />
                  <InfoRow icon={Shield} label="Scope" value={config.scope} />
                  <InfoRow
                    icon={Coffee}
                    label="Paid"
                    value={config.isPaid ? "Yes" : "No"}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Meta" icon={Calendar}>
                <div className="space-y-4">
                  <InfoRow
                    icon={CheckCircle}
                    label="Status"
                    value={config.isActive ? "Active" : "Inactive"}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Created"
                    value={
                      config.createdAt ? formatDate(config.createdAt) : "—"
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Updated"
                    value={
                      config.updatedAt ? formatDate(config.updatedAt) : "—"
                    }
                  />
                  <InfoRow
                    icon={Users}
                    label="Access overrides"
                    value={`${breakAccess.length} employee(s)`}
                  />
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Employee access"
              icon={Shield}
              action={
                <button
                  type="button"
                  onClick={() => setAddAccessOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity"
                >
                  <Plus size={13} />
                  Add user
                </button>
              }
            >
              {breakAccess.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mx-auto">
                    <UserPlus size={22} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      No access overrides yet
                    </p>
                    <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                      {config.scope === "ALL"
                        ? "Everyone is allowed by default. Add a user here to block (or explicitly allow) someone."
                        : "Add employees to grant or revoke access for this break."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddAccessOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity"
                  >
                    <Plus size={13} />
                    Add user
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {breakAccess.map((row) => {
                    const busy = togglingUserId === row.userId;
                    const initials =
                      row.employeeName
                        ?.split(" ")
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("") || "?";
                    return (
                      <div
                        key={row.id || row.userId}
                        className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-background/60 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {row.employeeName || `User #${row.userId}`}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {row.employeeId || "—"}
                          </p>
                        </div>
                        <AccessBadge isAllowed={row.isAllowed} />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.isAllowed}
                          disabled={busy}
                          onClick={() => handleToggleAccess(row)}
                          title={
                            row.isAllowed ? "Block access" : "Allow access"
                          }
                          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-text-primary focus:ring-offset-1 ${
                            row.isAllowed ? "bg-text-primary" : "bg-border"
                          }`}
                        >
                          {busy ? (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Loader2
                                size={12}
                                className="animate-spin text-white"
                              />
                            </span>
                          ) : (
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                row.isAllowed
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </>
        ) : null}
      </div>

      <BreakConfigEditModal
        open={editOpen}
        configId={Number(id)}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchConfig}
      />

      <BreakAccessAddModal
        open={addAccessOpen}
        onClose={() => setAddAccessOpen(false)}
        breakConfigId={id}
        scope={config?.scope}
        existingAccess={breakAccess}
        onSuccess={handleAccessAdded}
      />
    </main>
  );
};

export default BreakConfigDetails;
