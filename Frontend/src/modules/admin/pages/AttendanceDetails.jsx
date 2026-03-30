import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Image,
  Timer,
  LogIn,
  LogOut,
  Info,
} from "lucide-react";
import { attendanceApi } from "../api/attendanceApi.js";
import useAuth from "../../login/hooks/useAuth.js";
import { formatDate } from "../../../shared/utils/dateUtil.js";

// ─── Status Badge ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    PRESENT:  { bg: "bg-present-bg",  text: "text-present-text",  label: "Present"  },
    ABSENT:   { bg: "bg-absent-bg",   text: "text-absent-text",   label: "Absent"   },
    LATE:     { bg: "bg-late-bg",     text: "text-late-text",     label: "Late"     },
    OVERTIME: { bg: "bg-overtime-bg", text: "text-overtime-text", label: "Overtime" },
    HOLIDAY:  { bg: "bg-holiday-bg",  text: "text-holiday-text",  label: "Holiday"  },
  };
  const config = map[status] || map.ABSENT;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// ─── Info Row ──────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p
        className={`text-sm text-text-primary font-semibold mt-0.5 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);

// ─── Section Card ──────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-surface rounded-xl border border-border shadow-sm">
    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
      {Icon && <Icon size={15} className="text-text-muted" />}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Photo Panel ──────────────────────────────────────────────────────────

const PhotoPanel = ({ label, src }) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs font-semibold text-text-secondary">{label}</p>
    {src ? (

      <a href={src} target="_blank" rel="noopener noreferrer">
        <img
          src={src}
          alt={label}
          className="w-full h-48 object-cover rounded-xl border border-border hover:opacity-90 transition-opacity cursor-pointer"
        />
      </a>
    ) : (
      <div className="w-full h-48 rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-2 text-text-muted">
        <Image size={28} />
        <p className="text-xs">No photo</p>
      </div>
    )}
  </div>
);

// ─── Location Display ─────────────────────────────────────────────────────

const LocationDisplay = ({ locationStr, label }) => {
  if (!locationStr) return <span className="text-text-muted text-sm">—</span>;

  let parsed = null;
  try {
    parsed = JSON.parse(locationStr);
  } catch {
    // raw string
  }

  const address = parsed?.address ?? locationStr;
  const lat = parsed?.lat;
  const lng = parsed?.lng;

  const mapsUrl =
    lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

  return (
    <div className="space-y-1">
      <p className="text-sm text-text-primary font-semibold">{address}</p>
      {lat && lng && (
        <p className="text-xs text-text-muted font-mono">
          {lat}, {lng}
        </p>
      )}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline"
        >
          <MapPin size={12} />
          View on map
        </a>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const formatTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

// ─── Skeleton ─────────────────────────────────────────────────────────────

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
        <div key={i} className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="h-4 bg-border rounded w-32" />
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────

const AttendanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await attendanceApi.getAttendance(id);
        setRecord(data);
      } catch (err) {
        console.error("Failed to fetch attendance record:", err);
        setError("Attendance record not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const emp = record?.user;
  const initials =
    emp?.employeeName
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate("/admin/attendance")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Attendance Details
          </h1>
          <p className="text-xs text-text-secondary">
            Full record breakdown
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
        ) : record ? (
          <>
            {/* ── Hero ── */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start">
              {/* Employee Avatar */}
              <div className="w-14 h-14 rounded-full bg-text-primary text-white flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {emp?.employeeName ?? "—"}
                  </h2>
                  <StatusBadge status={record.status} />
                </div>
                <p className="text-sm text-text-muted mb-3">
                  {emp?.employeeId ?? "—"} · {emp?.email ?? "—"}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar size={13} className="text-text-muted" />
                    {formatDate(record.date)}
                  </div>
                  {record.checkInTime && (
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <LogIn size={13} className="text-text-muted" />
                      In: {formatTime(record.checkInTime)}
                    </div>
                  )}
                  {record.checkOutTime && (
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <LogOut size={13} className="text-text-muted" />
                      Out: {formatTime(record.checkOutTime)}
                    </div>
                  )}
                  {record.extraTime && (
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Timer size={13} className="text-text-muted" />
                      {record.extraTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick flags */}
              <div className="flex flex-col gap-2 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    record.checkoutOutside
                      ? "bg-absent-bg text-absent-text"
                      : "bg-present-bg text-present-text"
                  }`}
                >
                  {record.checkoutOutside ? (
                    <XCircle size={13} />
                  ) : (
                    <CheckCircle size={13} />
                  )}
                  {record.checkoutOutside ? "Outside checkout" : "Inside checkout"}
                </div>
              </div>
            </div>

            
            {/* ── Photos ── */}
            {(record.checkInPhoto || record.checkOutPhoto) && (
              <SectionCard title="Attendance Photos" icon={Image}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PhotoPanel label="Check-In Photo" src={record.photos[record.checkInPhoto]} />
                  <PhotoPanel label="Check-Out Photo" src={record.photos[record.checkOutPhoto]} />
                </div>
              </SectionCard>
            )}

            {/* ── Photos placeholder when neither exists ── */}
            {!record.checkInPhoto && !record.checkOutPhoto && (
              <SectionCard title="Attendance Photos" icon={Image}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PhotoPanel label="Check-In Photo" src={null} />
                  <PhotoPanel label="Check-Out Photo" src={null} />
                </div>
              </SectionCard>
            )}

            {/* ── Detail Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check-In Details */}
              <SectionCard title="Check-In Details" icon={LogIn}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Clock}
                    label="Check-In Time"
                    value={formatTime(record.checkInTime)}
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={15} className="text-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted font-medium mb-1">
                        Check-In Location
                      </p>
                      <LocationDisplay locationStr={record.checkInLocation} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Check-Out Details */}
              <SectionCard title="Check-Out Details" icon={LogOut}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Clock}
                    label="Check-Out Time"
                    value={formatTime(record.checkOutTime)}
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={15} className="text-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted font-medium mb-1">
                        Check-Out Location
                      </p>
                      <LocationDisplay locationStr={record.checkOutLocation} />
                    </div>
                  </div>
                  <InfoRow
                    icon={XCircle}
                    label="Checked Out Outside"
                    value={
                      record.checkoutOutside === true
                        ? "Yes — outside designated location"
                        : record.checkoutOutside === false
                        ? "No — within designated location"
                        : null
                    }
                  />
                </div>
              </SectionCard>

              {/* Time Summary */}
              <SectionCard title="Time Summary" icon={Timer}>
                <div className="space-y-4">
                  <InfoRow
                    icon={Calendar}
                    label="Attendance Date"
                    value={formatDate(record.date)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Check-In"
                    value={formatTime(record.checkInTime)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Check-Out"
                    value={formatTime(record.checkOutTime)}
                  />
                  <InfoRow
                    icon={Timer}
                    label="Undertime / Overtime"
                    value={record.extraTime}
                  />
                </div>
              </SectionCard>

              {/* Record Info */}
              <SectionCard title="Record Info" icon={Info}>
                <div className="space-y-4">
                  <InfoRow icon={Info} label="Record ID" value={`#${record.id}`} mono />
                  <InfoRow
                    icon={User}
                    label="Employee"
                    value={
                      emp
                        ? `${emp.employeeName ?? ""} (${emp.employeeId ?? ""})`
                        : null
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Created At"
                    value={formatDateTime(record.createdAt)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Last Updated"
                    value={formatDateTime(record.updatedAt)}
                  />
                </div>
              </SectionCard>
            </div>

          </>
        ) : null}
      </div>
    </main>
  );
};

export default AttendanceDetails;
