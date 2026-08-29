import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  Building2,
  Briefcase,
  Calendar,
  CalendarDays,
  ChevronRight,
  DollarSign,
  Clock,
} from "lucide-react";
import useAuth from "../../login/hooks/useAuth.js";
import { useDepartmentApi } from "../api/departmentApi.js";
import { useDesignationApi } from "../api/designationApi.js";
import { useHolidayApi } from "../api/holidayApi.js";
import { useLeaveSubtypeApi } from "../api/leaveSubtypeApi.js";
import { employeesApi } from "../api/employeesApi.js";
import DepartmentCreateModal from "../components/DepartmentCreateModal.jsx";
import DesignationCreateModal from "../components/DesignationCreateModal.jsx";
import LeaveTypeCreateModal from "../components/LeaveTypeCreateModal.jsx";
import WebhookCreateModal from "../components/WebhookCreateModal.jsx";
import { useWebhookApi } from "../api/webhookApi.js";
import DataTable from "../components/DataTable.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import {
  StatCard,
  SectionHeader,
  HolidayModal,
  QuickListCard,
  AttendanceSettingSection,
} from "../components/setting/index.js";
import PaySlip from "../components/setting/PaySlip.jsx";
import { toast } from "react-toastify";

// ─── Tabs ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "designations", label: "Designations", icon: Briefcase },
  { id: "holidays", label: "Holidays", icon: Calendar },
  { id: "leaveTypes", label: "Leave Types", icon: CalendarDays },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "payslip", label: "Pay Slip", icon: DollarSign },
  { id: "webhook", label: "Webhook", icon: LayoutGrid },
];

// ─── Main Component ───────────────────────────────────────────────────────

const Setting = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // ── Departments ──
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptSubmitting, setDeptSubmitting] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);
  const [deptDeleteLoading, setDeptDeleteLoading] = useState(false);

  // ── Designations ──
  const [designations, setDesignations] = useState([]);
  const [desigLoading, setDesigLoading] = useState(true);
  const [desigModalOpen, setDesigModalOpen] = useState(false);
  const [desigSubmitting, setDesigSubmitting] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [deletingDesig, setDeletingDesig] = useState(null);
  const [desigDeleteLoading, setDesigDeleteLoading] = useState(false);

  // ── Holidays ──
  const [holidays, setHolidays] = useState([]);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [holidayDeleteLoading, setHolidayDeleteLoading] = useState(false);
  const [holidayMonth, setHolidayMonth] = useState(new Date().getMonth() + 1);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  // ── Leave Types ──
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveTypeLoading, setLeaveTypeLoading] = useState(true);
  const [leaveTypeModalOpen, setLeaveTypeModalOpen] = useState(false);
  const [leaveTypeSubmitting, setLeaveTypeSubmitting] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [deletingLeaveType, setDeletingLeaveType] = useState(null);
  const [leaveTypeDeleteLoading, setLeaveTypeDeleteLoading] = useState(false);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");

  // ── Webhooks ──
  const [webhooks, setWebhooks] = useState([]);
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookSubmitting, setWebhookSubmitting] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [deletingWebhook, setDeletingWebhook] = useState(null);
  const [webhookDeleteLoading, setWebhookDeleteLoading] = useState(false);

  // ── Employees (for PaySlip) ──
  const [employees, setEmployees] = useState([]);

  // ── Data Fetching ──

  const fetchDepartments = async () => {
    setDeptLoading(true);
    try {
      const {data} = await useDepartmentApi.fetchDepartment();
      const list = data?.departments || data;
      
      setDepartments(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setDeptLoading(false);
    }
  };

  const fetchDesignations = async () => {
    setDesigLoading(true);
    try {
      const {data} = await useDesignationApi.fetchDesignation();
      
      const list = data?.designations || data;
      setDesignations(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load designations");
    } finally {
      setDesigLoading(false);
    }
  };

  const fetchHolidays = async (month = holidayMonth, year = holidayYear) => {
    setHolidayLoading(true);
    try {
      const {data} = await useHolidayApi.fetchHolidays({ month, year });
      
      const list = data?.holidays || data;
      
      setHolidays(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setHolidayLoading(false);
    }
  };

  const fetchLeaveTypes = async (filter = leaveTypeFilter) => {
    setLeaveTypeLoading(true);
    try {
      const { data } = await useLeaveSubtypeApi.fetchLeaveSubtypes(
        filter === "ALL" ? undefined : filter,
      );
      const list = data?.leaveSubTypes || data;
      setLeaveTypes(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load sub types");
    } finally {
      setLeaveTypeLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    setWebhookLoading(true);
    try {
      const { data } = await useWebhookApi.fetchWebhook();
      const list = data?.webhooks || data;
      setWebhooks(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setWebhookLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await employeesApi.fetchAllEmployees(1);
      setEmployees(data.employees || []);
    } catch {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
    fetchHolidays(holidayMonth, holidayYear);
    fetchEmployees();
    fetchWebhooks();
  }, []);

  useEffect(() => {
    fetchHolidays(holidayMonth, holidayYear);
  }, [holidayMonth, holidayYear]);

  useEffect(() => {
    fetchLeaveTypes(leaveTypeFilter);
  }, [leaveTypeFilter]);

  // ── Department CRUD ──

  const handleDeptSubmit = async ({ name }) => {
    setDeptSubmitting(true);
    try {
      if (editingDept) {
        await useDepartmentApi.updateDepartment(editingDept.id, { name });
        toast.success("Department updated");
      } else {
        await useDepartmentApi.createDepartment({ name });
        toast.success("Department created");
      }
      setDeptModalOpen(false);
      setEditingDept(null);
      fetchDepartments();
    } catch {
      toast.error(editingDept ? "Failed to update department" : "Failed to create department");
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleDeptDelete = async () => {
    setDeptDeleteLoading(true);
    try {
      await useDepartmentApi.deleteDepartment(deletingDept.id);
      toast.success("Department deleted");
      setDeletingDept(null);
      fetchDepartments();
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeptDeleteLoading(false);
    }
  };

  // ── Designation CRUD ──

  const handleDesigSubmit = async ({ name }) => {
    setDesigSubmitting(true);
    try {
      if (editingDesig) {
        await useDesignationApi.updateDesignation(editingDesig.id, { name });
        toast.success("Designation updated");
      } else {
        await useDesignationApi.createDesignation({ name });
        toast.success("Designation created");
      }
      setDesigModalOpen(false);
      setEditingDesig(null);
      fetchDesignations();
    } catch {
      toast.error(editingDesig ? "Failed to update designation" : "Failed to create designation");
    } finally {
      setDesigSubmitting(false);
    }
  };

  const handleDesigDelete = async () => {
    setDesigDeleteLoading(true);
    try {
      await useDesignationApi.deleteDesignation(deletingDesig.id);
      toast.success("Designation deleted");
      setDeletingDesig(null);
      fetchDesignations();
    } catch {
      toast.error("Failed to delete designation");
    } finally {
      setDesigDeleteLoading(false);
    }
  };

  // ── Leave Type CRUD ──

  const handleLeaveTypeSubmit = async ({ name, type }) => {
    setLeaveTypeSubmitting(true);
    try {
      if (editingLeaveType) {
        await useLeaveSubtypeApi.updateLeaveSubtype(editingLeaveType.id, { name, type });
        toast.success("Sub type updated");
      } else {
        await useLeaveSubtypeApi.createLeaveSubtype({ name, type });
        toast.success("Sub type created");
      }
      setLeaveTypeModalOpen(false);
      setEditingLeaveType(null);
      fetchLeaveTypes();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          (editingLeaveType ? "Failed to update sub type" : "Failed to create sub type"),
      );
    } finally {
      setLeaveTypeSubmitting(false);
    }
  };

  const handleLeaveTypeDelete = async () => {
    setLeaveTypeDeleteLoading(true);
    try {
      await useLeaveSubtypeApi.deleteLeaveSubtype(deletingLeaveType.id);
      toast.success("Sub type deleted");
      setDeletingLeaveType(null);
      fetchLeaveTypes();
    } catch {
      toast.error("Failed to delete sub type");
    } finally {
      setLeaveTypeDeleteLoading(false);
    }
  };

  // ── Webhook CRUD ──

  const handleWebhookSubmit = async (formData) => {
    setWebhookSubmitting(true);
    try {
      if (editingWebhook) {
        await useWebhookApi.updateWebhook(editingWebhook.id, formData);
        toast.success("Webhook updated");
      } else {
        await useWebhookApi.createWebhook(formData);
        toast.success("Webhook created");
      }
      setWebhookModalOpen(false);
      setEditingWebhook(null);
      fetchWebhooks();
    } catch {
      toast.error(editingWebhook ? "Failed to update webhook" : "Failed to create webhook");
    } finally {
      setWebhookSubmitting(false);
    }
  };

  const handleWebhookDelete = async () => {
    setWebhookDeleteLoading(true);
    try {
      await useWebhookApi.deleteWebhook(deletingWebhook.id);
      toast.success("Webhook deleted");
      setDeletingWebhook(null);
      fetchWebhooks();
    } catch {
      toast.error("Failed to delete webhook");
    } finally {
      setWebhookDeleteLoading(false);
    }
  };

  // ── Holiday CRUD ──

  const handleHolidaySubmit = async (formData) => {
    setHolidaySubmitting(true);
    try {
      if (editingHoliday) {
        await useHolidayApi.updateHoliday(editingHoliday.id, formData);
        toast.success("Holiday updated");
      } else {
        await useHolidayApi.createHoliday(formData);
        toast.success("Holiday added");
      }
      setHolidayModalOpen(false);
      setEditingHoliday(null);
      fetchHolidays(holidayMonth, holidayYear);
    } catch {
      toast.error(editingHoliday ? "Failed to update holiday" : "Failed to add holiday");
    } finally {
      setHolidaySubmitting(false);
    }
  };

  const handleHolidayDelete = async () => {
    setHolidayDeleteLoading(true);
    try {
      await useHolidayApi.deleteHoliday(deletingHoliday.id);
      toast.success("Holiday deleted");
      setDeletingHoliday(null);
      fetchHolidays(holidayMonth, holidayYear);
    } catch {
      toast.error("Failed to delete holiday");
    } finally {
      setHolidayDeleteLoading(false);
    }
  };

  // ── Column Definitions ──

  const deptColumns = [
    {
      header: "Department Name",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
            <Building2 size={14} className="text-text-muted" />
          </div>
          <span className="text-sm font-medium text-text-primary">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row) => (
        <span className="text-sm text-text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const desigColumns = [
    {
      header: "Designation Name",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
            <Briefcase size={14} className="text-text-muted" />
          </div>
          <span className="text-sm font-medium text-text-primary">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row) => (
        <span className="text-sm text-text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const leaveTypeColumns = [
    {
      header: "Sub Type",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
            <CalendarDays size={14} className="text-text-muted" />
          </div>
          <span className="text-sm font-medium text-text-primary">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Used For",
      key: "type",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.type === "HOLIDAY"
              ? "bg-holiday-bg text-holiday-text"
              : "bg-background text-text-secondary border border-border"
          }`}
        >
          {row.type === "HOLIDAY" ? "Holiday" : "Leave"}
        </span>
      ),
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row) => (
        <span className="text-sm text-text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const webhookColumns = [
    {
      header: "Endpoint URL",
      key: "url",
      render: (row) => (
        <span className="text-sm text-text-primary font-mono break-all">{row.url}</span>
      ),
    },
    {
      header: "Event",
      key: "event",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border text-text-secondary">
          {row.eventType}
        </span>
      ),
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row) => (
        <span className="text-sm text-text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const holidayColumns = [
    {
      header: "Reason",
      key: "reason",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-holiday-bg flex items-center justify-center shrink-0">
            <Calendar size={14} className="text-holiday-text" />
          </div>
          <div>
            <span className="text-sm font-medium text-text-primary">{row.reason}</span>
            <p className="text-xs text-text-muted">
              {row.subType?.name || (row.status === "LEAVE" ? "Leave" : "Holiday")}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Date Range",
      key: "startDate",
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {row.startDate
            ? `${new Date(row.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${
                row.endDate
                  ? new Date(row.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"
              }`
            : "—"}
        </span>
      ),
    },
    {
      header: "Type",
      key: "status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.status === "LEAVE"
              ? "bg-holiday-bg text-holiday-text"
              : "bg-background text-text-secondary border border-border"
          }`}
        >
          {row.status === "LEAVE" ? "Leave" : "Holiday"}
        </span>
      ),
    },
    {
      header: "Sub Type",
      key: "subType",
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.subType?.name}</span>
      ),
    },
  ];

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">Settings</h1>
          <p className="text-xs text-text-secondary">Manage system configuration</p>
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

      {/* ── Tab Bar ── */}
      <div className="bg-surface border-b border-border px-6">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === "overview" && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Departments"
                value={deptLoading ? "…" : departments.length}
                icon={Building2}
                description="Total departments"
                onClick={() => setActiveTab("departments")}
              />
              <StatCard
                label="Designations"
                value={desigLoading ? "…" : designations.length}
                icon={Briefcase}
                description="Total designations"
                onClick={() => setActiveTab("designations")}
              />
              <StatCard
                label="Holidays"
                value={holidayLoading ? "…" : holidays.length}
                icon={Calendar}
                description="Total holidays"
                onClick={() => setActiveTab("holidays")}
              />
              <StatCard
                label="Leave Types"
                value={leaveTypeLoading ? "…" : leaveTypes.length}
                icon={CalendarDays}
                description="Casual, Sick, Week Off…"
                onClick={() => setActiveTab("leaveTypes")}
              />
            </div>

            {/* Quick lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickListCard
                title="Departments"
                icon={Building2}
                items={departments}
                loading={deptLoading}
                emptyText="No departments yet"
                onViewAll={() => setActiveTab("departments")}
                renderItem={(d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-background flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-text-muted" />
                    </div>
                    <span className="text-sm text-text-secondary">{d.name}</span>
                  </div>
                )}
              />
              <QuickListCard
                title="Designations"
                icon={Briefcase}
                items={designations}
                loading={desigLoading}
                emptyText="No designations yet"
                onViewAll={() => setActiveTab("designations")}
                renderItem={(d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-background flex items-center justify-center shrink-0">
                      <Briefcase size={12} className="text-text-muted" />
                    </div>
                    <span className="text-sm text-text-secondary">{d.name}</span>
                  </div>
                )}
              />
            </div>

            {/* Holidays grid */}
            <div className="bg-surface rounded-xl border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-text-muted" />
                  <h3 className="text-sm font-semibold text-text-primary">Holidays</h3>
                </div>
                <button
                  onClick={() => setActiveTab("holidays")}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="p-4">
                {holidayLoading ? (
                  <div className="py-6 text-center text-xs text-text-muted">Loading…</div>
                ) : holidays.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No holidays added yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {holidays.slice(0, 6).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border"
                      >
                        <div className="w-8 h-8 rounded-lg bg-holiday-bg flex items-center justify-center shrink-0">
                          <Calendar size={13} className="text-holiday-text" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {h.reason}
                          </p>
                          <p className="text-xs text-text-muted">
                            {h.startDate && h.endDate
                              ? `${new Date(h.startDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })} - ${new Date(h.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : h.startDate
                              ? new Date(h.startDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            h.status === "LEAVE"
                              ? "bg-holiday-bg text-holiday-text"
                              : "bg-surface text-text-muted border border-border"
                          }`}
                        >
                          {h.status === "LEAVE" ? "Leave" : "Optional"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════ DEPARTMENTS TAB ════ */}
        {activeTab === "departments" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <SectionHeader
              title="Departments"
              count={departments.length}
              onAdd={() => { setEditingDept(null); setDeptModalOpen(true); }}
              addLabel="Add Department"
            />
            <div className="p-4 overflow-x-auto">
              <DataTable
                columns={deptColumns}
                rows={departments}
                rowIdKey="id"
                selectable={false}
                loading={deptLoading}
                onEdit={(row) => { setEditingDept(row); setDeptModalOpen(true); }}
                onDelete={(row) => setDeletingDept(row)}
                emptyText="No departments yet. Add your first department."
              />
            </div>
          </section>
        )}

        {/* ════ DESIGNATIONS TAB ════ */}
        {activeTab === "designations" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <SectionHeader
              title="Designations"
              count={designations.length}
              onAdd={() => { setEditingDesig(null); setDesigModalOpen(true); }}
              addLabel="Add Designation"
            />
            <div className="p-4 overflow-x-auto">
              <DataTable
                columns={desigColumns}
                rows={designations}
                rowIdKey="id"
                selectable={false}
                loading={desigLoading}
                onEdit={(row) => { setEditingDesig(row); setDesigModalOpen(true); }}
                onDelete={(row) => setDeletingDesig(row)}
                emptyText="No designations yet. Add your first designation."
              />
            </div>
          </section>
        )}

        {/* ════ HOLIDAYS TAB ════ */}
        {activeTab === "holidays" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Holidays</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {holidays.length} item{holidays.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={holidayMonth}
                  onChange={(e) => setHolidayMonth(Number(e.target.value))}
                  className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-border"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December",
                  ].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(Number(e.target.value))}
                  className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-border"
                >
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setEditingHoliday(null); setHolidayModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  + Add Holiday
                </button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <DataTable
                columns={holidayColumns}
                rows={holidays}
                rowIdKey="id"
                selectable={false}
                loading={holidayLoading}
                onEdit={(row) => { setEditingHoliday(row); setHolidayModalOpen(true); }}
                onDelete={(row) => setDeletingHoliday(row)}
                emptyText="No holidays added yet."
              />
            </div>
          </section>
        )}

        {/* ════ LEAVE TYPES TAB ════ */}
        {activeTab === "leaveTypes" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Leave &amp; Holiday Sub Types</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {leaveTypes.length} item{leaveTypes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-border"
                >
                  <option value="ALL">All Types</option>
                  <option value="LEAVE">Leave</option>
                  <option value="HOLIDAY">Holiday</option>
                </select>
                <button
                  onClick={() => { setEditingLeaveType(null); setLeaveTypeModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  + Add Sub Type
                </button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <DataTable
                columns={leaveTypeColumns}
                rows={leaveTypes}
                rowIdKey="id"
                selectable={false}
                loading={leaveTypeLoading}
                onEdit={(row) => { setEditingLeaveType(row); setLeaveTypeModalOpen(true); }}
                onDelete={(row) => setDeletingLeaveType(row)}
                emptyText="No sub types yet. Add Casual Leave, Sick Leave, Week Off etc."
              />
            </div>
          </section>
        )}

        {/* ════ ATTENDANCE TAB ════ */}
        {activeTab === "attendance" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Attendance Settings
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Configure late buffer and check-in radius
              </p>
            </div>
            <div className="p-6">
              <AttendanceSettingSection />
            </div>
          </section>
        )}

        {/* ════ WEBHOOK TAB ════ */}
        {activeTab === "webhook" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm">
            <SectionHeader
              title="Webhooks"
              count={webhooks.length}
              onAdd={() => { setEditingWebhook(null); setWebhookModalOpen(true); }}
              addLabel="Add Webhook"
            />
            <div className="p-4 overflow-x-auto">
              <DataTable
                columns={webhookColumns}
                rows={webhooks}
                rowIdKey="id"
                selectable={false}
                loading={webhookLoading}
                onEdit={(row) => { setEditingWebhook(row); setWebhookModalOpen(true); }}
                onDelete={(row) => setDeletingWebhook(row)}
                emptyText="No webhooks yet. Add your first webhook."
              />
            </div>
          </section>
        )}

        {/* ════ PAY SLIP TAB ════ */}
        {activeTab === "payslip" && (
          <section className="bg-surface rounded-xl border border-border shadow-sm p-6">
            <PaySlip employees={employees} />
          </section>
        )}
      </div>

      {/* ── Modals ── */}

      <DepartmentCreateModal
        open={deptModalOpen}
        onClose={() => { setDeptModalOpen(false); setEditingDept(null); }}
        onSubmit={handleDeptSubmit}
        loading={deptSubmitting}
        initialValue={editingDept?.name || ""}
      />

      <DesignationCreateModal
        open={desigModalOpen}
        onClose={() => { setDesigModalOpen(false); setEditingDesig(null); }}
        onSubmit={handleDesigSubmit}
        loading={desigSubmitting}
        initialValue={editingDesig?.name || ""}
      />

      <LeaveTypeCreateModal
        open={leaveTypeModalOpen}
        onClose={() => { setLeaveTypeModalOpen(false); setEditingLeaveType(null); }}
        onSubmit={handleLeaveTypeSubmit}
        loading={leaveTypeSubmitting}
        initialData={editingLeaveType}
      />

      <ConfirmModal
        open={!!deletingLeaveType}
        onClose={() => setDeletingLeaveType(null)}
        onConfirm={handleLeaveTypeDelete}
        loading={leaveTypeDeleteLoading}
        isDangerous
        title="Delete Sub Type"
        message={`Are you sure you want to delete "${deletingLeaveType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <HolidayModal
        open={holidayModalOpen}
        onClose={() => { setHolidayModalOpen(false); setEditingHoliday(null); }}
        onSubmit={handleHolidaySubmit}
        loading={holidaySubmitting}
        initialData={editingHoliday}
      />

      <ConfirmModal
        open={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeptDelete}
        loading={deptDeleteLoading}
        isDangerous
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDept?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmModal
        open={!!deletingDesig}
        onClose={() => setDeletingDesig(null)}
        onConfirm={handleDesigDelete}
        loading={desigDeleteLoading}
        isDangerous
        title="Delete Designation"
        message={`Are you sure you want to delete "${deletingDesig?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmModal
        open={!!deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
        onConfirm={handleHolidayDelete}
        loading={holidayDeleteLoading}
        isDangerous
        title="Delete Holiday"
        message={`Are you sure you want to delete "${deletingHoliday?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <WebhookCreateModal
        open={webhookModalOpen}
        onClose={() => { setWebhookModalOpen(false); setEditingWebhook(null); }}
        onSubmit={handleWebhookSubmit}
        loading={webhookSubmitting}
        initialData={editingWebhook}
      />

      <ConfirmModal
        open={!!deletingWebhook}
        onClose={() => setDeletingWebhook(null)}
        onConfirm={handleWebhookDelete}
        loading={webhookDeleteLoading}
        isDangerous
        title="Delete Webhook"
        message={`Are you sure you want to delete the webhook for "${deletingWebhook?.event}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </main>
  );
};

export default Setting;
