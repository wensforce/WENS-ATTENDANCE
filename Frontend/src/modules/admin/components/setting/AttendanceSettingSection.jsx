import React, { useEffect, useState } from "react";
import { Clock, MapPin, Save, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import { useAttendanceSettingApi } from "../../api/attendanceSettingApi.js";

const AttendanceSettingSection = () => {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lateBufferMinutes: "", checkInRadius: "" });

  const applySetting = (data) => {
    setSetting(data);
    setForm({
      lateBufferMinutes: String(data?.lateBufferMinutes ?? ""),
      checkInRadius: String(data?.checkInRadius ?? ""),
    });
  };

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const { data } = await useAttendanceSettingApi.fetchAttendanceSetting();
      applySetting(data?.attendanceSetting || data);
    } catch {
      toast.error("Failed to load attendance settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const buffer = Number(form.lateBufferMinutes);
  const radius = Number(form.checkInRadius);

  const bufferValid = Number.isInteger(buffer) && buffer >= 0;
  const radiusValid = Number.isInteger(radius) && radius > 0;

  const dirty =
    setting &&
    (buffer !== setting.lateBufferMinutes || radius !== setting.checkInRadius);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!setting?.id) return;
    if (!bufferValid) return toast.error("Enter a valid buffer in minutes");
    if (!radiusValid) return toast.error("Enter a valid radius in meters");

    setSaving(true);
    try {
      const { data } = await useAttendanceSettingApi.updateAttendanceSetting(
        setting.id,
        { lateBufferMinutes: buffer, checkInRadius: radius },
      );
      applySetting(data?.attendanceSetting || data);
      toast.success("Attendance settings updated");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update attendance settings",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-xs text-text-muted">Loading…</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Late buffer */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <Clock size={14} className="text-text-muted" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Late Buffer
              </h3>
              <p className="text-xs text-text-muted">
                Grace period after shift start before marking late
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={form.lateBufferMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, lateBufferMinutes: e.target.value }))
              }
              className="w-full text-sm pl-3 pr-20 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-border"
              placeholder="15"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
              minutes
            </span>
          </div>
          {!bufferValid && form.lateBufferMinutes !== "" && (
            <p className="mt-1.5 text-xs text-red-500">
              Enter a whole number of minutes (0 or more)
            </p>
          )}
        </div>

        {/* Check-in radius */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-text-muted" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Check-in Radius
              </h3>
              <p className="text-xs text-text-muted">
                Allowed distance from office location for check-in
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              value={form.checkInRadius}
              onChange={(e) =>
                setForm((f) => ({ ...f, checkInRadius: e.target.value }))
              }
              className="w-full text-sm pl-3 pr-20 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-border"
              placeholder="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
              meters
            </span>
          </div>
          {!radiusValid && form.checkInRadius !== "" && (
            <p className="mt-1.5 text-xs text-red-500">
              Enter a whole number of meters (1 or more)
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <p className="text-xs text-text-muted">
          Currently: late after{" "}
          <span className="font-semibold text-text-secondary">
            {setting?.lateBufferMinutes} minutes
          </span>
          , check-in within{" "}
          <span className="font-semibold text-text-secondary">
            {setting?.checkInRadius} meters
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applySetting(setting)}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            type="submit"
            disabled={!dirty || saving || !bufferValid || !radiusValid}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AttendanceSettingSection;
