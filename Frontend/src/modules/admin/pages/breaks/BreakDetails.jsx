import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coffee,
  User,
  AlertCircle,
  ChevronRight,
  Timer,
  LogIn,
  LogOut,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import useAuth from "../../../login/hooks/useAuth.js";
import { breakApi } from "../../api/breakApi.js";
import { formatDate } from "../../../../shared/utils/dateUtil.js";

const formatTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(d)}  ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const StatusBadge = ({ status }) => {
  const map = {
    PRESENT: { bg: "bg-present-bg", text: "text-present-text", label: "Present" },
    ABSENT: { bg: "bg-absent-bg", text: "text-absent-text", label: "Absent" },
    LATE: { bg: "bg-late-bg", text: "text-late-text", label: "Late" },
    OVERTIME: {
      bg: "bg-overtime-bg",
      text: "text-overtime-text",
      label: "Overtime",
    },
    HALF_DAY: {
      bg: "bg-halfday-bg",
      text: "text-halfday-text",
      label: "Half Day",
    },
    WORK_FROM_HOME: { bg: "bg-wfh-bg", text: "text-wfh-text", label: "WFH" },
  };
  const config = map[status] || {
    bg: "bg-background",
    text: "text-text-muted",
    label: status || "—",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p
        className={`text-sm text-text-primary font-semibold mt-0.5 break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-surface rounded-xl border border-border shadow-sm">
    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
      {Icon && <Icon size={15} className="text-text-muted" />}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="bg-surface rounded-xl border border-border p-6 flex gap-4">
      <div className="w-14 h-14 rounded-full bg-border shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-5 bg-border rounded w-56" />
        <div className="h-3 bg-border rounded w-40" />
        <div className="h-3 bg-border rounded w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
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

const BreakDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBreak = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await breakApi.getBreakById(id);
        setRecord(data?.break || null);
        if (!data?.break) setError("Break record not found.");
      } catch (err) {
        console.error("Failed to fetch break:", err);
        setError(err.response?.data?.message || "Break record not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchBreak();
  }, [id]);

  const emp = record?.user;
  const config = record?.breakConfig;
  const attendance = record?.attendance;

  const initials =
    emp?.employeeName
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  return (
    <main className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate("/admin/breaks/logs")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Break Details
          </h1>
          <p className="text-xs text-text-secondary">Full break record</p>
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
        ) : record ? (
          <>
            {/* Hero */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-14 h-14 rounded-full bg-text-primary text-white flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {emp?.employeeName ?? "—"}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text">
                    {config?.label || config?.breakType || "Break"}
                  </span>
                  {record.isOverLimit ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-absent-bg text-absent-text">
                      <AlertTriangle size={12} />
                      Over limit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-present-bg text-present-text">
                      <CheckCircle size={12} />
                      Within limit
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mb-3">
                  {emp?.employeeId ?? "—"} · Break #{record.id}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar size={13} className="text-text-muted" />
                    {formatDate(record.startTime)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <LogIn size={13} className="text-text-muted" />
                    Start: {formatTime(record.startTime)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <LogOut size={13} className="text-text-muted" />
                    End:{" "}
                    {record.endTime ? (
                      formatTime(record.endTime)
                    ) : (
                      <span className="text-late-text font-medium">
                        In progress
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Timer size={13} className="text-text-muted" />
                    {record.durationMins != null
                      ? `${record.durationMins} min`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    record.autoClosed
                      ? "bg-late-bg text-late-text"
                      : "bg-background text-text-secondary"
                  }`}
                >
                  {record.autoClosed ? "Auto closed" : "Manual end"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Break timing" icon={Clock}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Calendar}
                    label="Date"
                    value={formatDate(record.startTime)}
                  />
                  <InfoRow
                    icon={LogIn}
                    label="Start time"
                    value={formatDateTime(record.startTime)}
                  />
                  <InfoRow
                    icon={LogOut}
                    label="End time"
                    value={
                      record.endTime
                        ? formatDateTime(record.endTime)
                        : "Still in progress"
                    }
                  />
                  <InfoRow
                    icon={Timer}
                    label="Duration"
                    value={
                      record.durationMins != null
                        ? `${record.durationMins} minutes`
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={Timer}
                    label="Extra time"
                    value={
                      record.extraTime != null && record.extraTime > 0
                        ? `${record.extraTime} minutes`
                        : "—"
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Break config" icon={Coffee}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Coffee}
                    label="Type"
                    value={config?.breakType}
                  />
                  <InfoRow icon={Info} label="Label" value={config?.label} />
                  <InfoRow
                    icon={Timer}
                    label="Max duration"
                    value={
                      config?.maxDurationMins != null
                        ? `${config.maxDurationMins} min (+${config.graceMins ?? 0} grace)`
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={Info}
                    label="Max per day / Paid / Scope"
                    value={`${config?.maxPerDay ?? "—"} / ${
                      config?.isPaid ? "Paid" : "Unpaid"
                    } / ${config?.scope ?? "—"}`}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Employee" icon={User}>
                <div className="space-y-4">
                  <InfoRow
                    icon={User}
                    label="Name"
                    value={emp?.employeeName}
                  />
                  <InfoRow
                    icon={Info}
                    label="Employee ID"
                    value={emp?.employeeId}
                    mono
                  />
                  <InfoRow
                    icon={Info}
                    label="User ID"
                    value={record.userId != null ? String(record.userId) : "—"}
                    mono
                  />
                </div>
              </SectionCard>

              <SectionCard title="Linked attendance" icon={Calendar}>
                {attendance ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-medium">
                        Status
                      </span>
                      <StatusBadge status={attendance.status} />
                    </div>
                    <InfoRow
                      icon={Calendar}
                      label="Attendance date"
                      value={formatDate(attendance.date)}
                    />
                    <InfoRow
                      icon={LogIn}
                      label="Check-in"
                      value={formatTime(attendance.checkInTime)}
                    />
                    <InfoRow
                      icon={LogOut}
                      label="Check-out"
                      value={formatTime(attendance.checkOutTime)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/attendance/${attendance.id}`)
                      }
                      className="text-xs font-medium text-text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      View attendance record →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    No attendance linked
                  </p>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Meta" icon={Info}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Info}
                  label="Created at"
                  value={formatDateTime(record.createdAt)}
                />
                <InfoRow
                  icon={Info}
                  label="Updated at"
                  value={formatDateTime(record.updatedAt)}
                />
                <InfoRow
                  icon={Info}
                  label="Attendance ID"
                  value={
                    record.attendanceId != null
                      ? String(record.attendanceId)
                      : "—"
                  }
                  mono
                />
                <InfoRow
                  icon={Info}
                  label="Config ID"
                  value={
                    record.breakConfigId != null
                      ? String(record.breakConfigId)
                      : "—"
                  }
                  mono
                />
              </div>
            </SectionCard>
          </>
        ) : null}
      </div>
    </main>
  );
};

export default BreakDetails;
