import React, { useCallback, useEffect, useState } from "react";
import { Building2, Search, Plus, ChevronRight, Users } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../login/hooks/useAuth.js";
import DataTable from "../../admin/components/DataTable.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import EmployeePinModal from "../../admin/components/employee/EmployeePinModal.jsx";
import TenantFormModal from "../components/TenantFormModal.jsx";
import { tenantApi } from "../api/tenantApi.js";

const StatusBadge = ({ status }) => {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        active
          ? "bg-present-bg text-present-text"
          : "bg-absent-bg text-absent-text"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const buildColumns = () => [
  {
    header: "Company",
    key: "name",
    render: (row) => (
      <div>
        <p className="font-medium text-text-primary whitespace-nowrap">
          {row.name ?? "—"}
        </p>
        <p className="text-xs text-text-muted font-mono">{row.slug ?? "—"}</p>
      </div>
    ),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Bodyguard",
    key: "bodyguardEnabled",
    render: (row) => (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          row.bodyguardEnabled
            ? "bg-present-bg text-present-text"
            : "bg-background text-text-muted border border-border"
        }`}
      >
        {row.bodyguardEnabled ? "Enabled" : "Off"}
      </span>
    ),
  },
  {
    header: "Admin",
    key: "admin",
    render: (row) => {
      const admin = row.users?.[0];
      if (!admin) {
        return <span className="text-text-muted text-sm">No admin</span>;
      }
      return (
        <div>
          <p className="text-sm text-text-primary">{admin.employeeName}</p>
          <p className="text-xs text-text-muted">{admin.email}</p>
        </div>
      );
    },
  },
  {
    header: "Users",
    key: "users",
    render: (row) => (
      <span className="text-text-secondary text-sm">
        {row._count?.users ?? 0}
      </span>
    ),
  },
  {
    header: "Created",
    key: "createdAt",
    render: (row) => (
      <span className="text-text-secondary text-sm">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
      </span>
    ),
  },
];

const Tenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    rowToDelete: null,
  });

  const fetchTenants = useCallback(async (status) => {
    setLoading(true);
    try {
      const response = await tenantApi.fetchTenants(status || undefined);
      setTenants(response.data?.tenants ?? []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants(statusFilter);
  }, [fetchTenants, statusFilter]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(tenants);
      return;
    }
    setFiltered(
      tenants.filter((tenant) => {
        const admin = tenant.users?.[0];
        return (
          tenant.name?.toLowerCase().includes(q) ||
          tenant.slug?.toLowerCase().includes(q) ||
          admin?.employeeName?.toLowerCase().includes(q) ||
          admin?.email?.toLowerCase().includes(q)
        );
      }),
    );
  }, [search, tenants]);

  const handleOpenAdd = () => {
    setEditTenant(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditTenant(row);
    setModalOpen(true);
  };

  const handleDelete = (row) => {
    setConfirmModal({ open: true, rowToDelete: row });
  };

  const handleModalSubmit = async (payload) => {
    setModalLoading(true);
    try {
      if (editTenant) {
        await tenantApi.updateTenant(editTenant.id, payload);
        toast.success("Company updated");
      } else {
        const response = await tenantApi.createTenant(payload);
        const admin = response.data?.admin;
        toast.success("Company created");
        if (admin?.pin && admin?.email) {
          setAdminCredentials(admin);
          setPinModalOpen(true);
        }
      }
      setModalOpen(false);
      setEditTenant(null);
      await fetchTenants(statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save company");
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.rowToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await tenantApi.deleteTenant(confirmModal.rowToDelete.id);
      toast.success(response.message || "Company removed");
      setConfirmModal({ open: false, rowToDelete: null });
      await fetchTenants(statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete company");
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const inactiveCount = tenants.filter((t) => t.status === "inactive").length;
  const userCount = tenants.reduce((sum, t) => sum + (t._count?.users ?? 0), 0);

  return (
    <main className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Companies
          </h1>
          <p className="text-xs text-text-secondary">
            Create and manage tenant companies
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.employeeName?.[0]?.toUpperCase() ?? "S"}
          </div>
          <span className="text-sm font-medium text-weekoff-text hidden sm:block">
            {user?.employeeName}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Total companies
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {tenants.length}
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-present-bg text-present-text">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Active / Inactive
              </p>
              <p className="text-2xl font-bold text-present-text">
                {activeCount}
                <span className="text-base text-absent-text font-semibold">
                  {" "}
                  / {inactiveCount}
                </span>
              </p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-absent-bg text-absent-text">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Total users
              </p>
              <p className="text-2xl font-bold text-absent-text">{userCount}</p>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Company directory
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {filtered.length} of {tenants.length} companies
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Search company or admin…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-56 transition"
                />
              </div>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap"
              >
                <Plus size={14} />
                Add company
              </button>
            </div>
          </div>

          <div className="p-4">
            <DataTable
              columns={buildColumns()}
              rows={filtered}
              rowIdKey="id"
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectable={false}
              loading={loading}
              emptyText={
                search
                  ? "No companies match your search"
                  : "No companies found"
              }
            />
          </div>
        </section>
      </div>

      <TenantFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTenant(null);
        }}
        onSubmit={handleModalSubmit}
        editData={editTenant}
        loading={modalLoading}
      />

      <EmployeePinModal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setAdminCredentials(null);
        }}
        email={adminCredentials?.email}
        pin={adminCredentials?.pin}
        employeeName={adminCredentials?.employeeName}
        title="Company admin credentials"
      />

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, rowToDelete: null })}
        onConfirm={handleConfirmDelete}
        title="Remove company"
        message={
          confirmModal.rowToDelete
            ? `Remove ${confirmModal.rowToDelete.name}? If it still has users it will be set to inactive instead of deleted.`
            : "Are you sure?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        isDangerous
        loading={deleteLoading}
      />
    </main>
  );
};

export default Tenants;
