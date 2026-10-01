import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee,
  Search,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DataTable from "../../components/DataTable.jsx";
import ConfirmModal from "../../../../shared/components/ConfirmModal.jsx";
import BreakConfigFormModal from "../../components/break/BreakConfigFormModal.jsx";
import BreakConfigEditModal from "../../components/break/BreakConfigEditModal.jsx";
import useDebounce from "../../../../shared/hooks/useDebounce.js";
import { breakConfigApi } from "../../api/breakConfigApi.js";
import { formatDate } from "../../../../shared/utils/dateUtil.js";
import { toast } from "react-toastify";

const PAGE_LIMIT = 10;

const TypeBadge = ({ breakType }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text whitespace-nowrap">
    {breakType || "—"}
  </span>
);

const ScopeBadge = ({ scope }) => {
  const map = {
    ALL: { bg: "bg-present-bg", text: "text-present-text", label: "All" },
    SPECIFIC_USERS: {
      bg: "bg-late-bg",
      text: "text-late-text",
      label: "Specific users",
    },
    ROLE: { bg: "bg-wfh-bg", text: "text-wfh-text", label: "Role" },
  };
  const config = map[scope] || {
    bg: "bg-background",
    text: "text-text-muted",
    label: scope || "—",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

const ActiveBadge = ({ isActive }) =>
  isActive ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-present-bg text-present-text whitespace-nowrap">
      <CheckCircle size={12} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-absent-bg text-absent-text whitespace-nowrap">
      <XCircle size={12} />
      Inactive
    </span>
  );

const columns = [
  {
    header: "Type",
    key: "breakType",
    render: (row) => <TypeBadge breakType={row.breakType} />,
  },
  {
    header: "Label",
    key: "label",
    render: (row) => (
      <span className="text-sm font-medium text-text-primary">
        {row.label || "—"}
      </span>
    ),
  },
  {
    header: "Duration",
    key: "maxDurationMins",
    render: (row) => (
      <span className="text-xs text-text-secondary">
        {row.maxDurationMins != null ? `${row.maxDurationMins} min` : "—"}
        {row.graceMins != null ? (
          <span className="text-text-muted"> (+{row.graceMins} grace)</span>
        ) : null}
      </span>
    ),
  },
  {
    header: "Max / day",
    key: "maxPerDay",
    render: (row) => (
      <span className="text-xs font-medium text-text-secondary">
        {row.maxPerDay ?? "—"}
      </span>
    ),
  },
  {
    header: "Paid",
    key: "isPaid",
    render: (row) => (
      <span className="text-xs text-text-secondary">
        {row.isPaid ? "Yes" : "No"}
      </span>
    ),
  },
  {
    header: "Scope",
    key: "scope",
    render: (row) => <ScopeBadge scope={row.scope} />,
  },
  {
    header: "Status",
    key: "isActive",
    render: (row) => <ActiveBadge isActive={row.isActive} />,
  },
  {
    header: "Created",
    key: "createdAt",
    render: (row) => (
      <span className="text-xs text-text-muted">
        {row.createdAt ? formatDate(row.createdAt) : "—"}
      </span>
    ),
  },
];

const BreakConfigs = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 500);

  const [confirmModal, setConfirmModal] = useState({ open: false, row: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editConfigId, setEditConfigId] = useState(null);

  const fetchConfigs = useCallback(
    async (nextPage) => {
      setLoading(true);
      try {
        const { data } = await breakConfigApi.fetchAll({
          page: nextPage,
          limit: PAGE_LIMIT,
          search: debouncedSearch.trim(),
          scope: scopeFilter,
          status: statusFilter,
        });
        setConfigs(data?.breakConfigs || []);
        setPagination(data?.pagination || null);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to load break configs",
        );
        setConfigs([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, scopeFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, scopeFilter, statusFilter]);

  useEffect(() => {
    fetchConfigs(page);
  }, [page, fetchConfigs]);

  const handlePageChange = (nextPage) => setPage(nextPage);

  const handleEdit = (row) => {
    setEditConfigId(row.id);
    setEditOpen(true);
  };

  const handleView = (row) => {
    navigate(`/admin/breaks/configs/${row.id}`);
  };

  const handleDelete = (row) => {
    if (!row.isActive) {
      toast.info("This config is already inactive");
      return;
    }
    setConfirmModal({ open: true, row });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.row) return;
    setDeleteLoading(true);
    try {
      await breakConfigApi.remove(confirmModal.row.id);
      toast.success("Break config deactivated");
      setConfirmModal({ open: false, row: null });
      await fetchConfigs(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to deactivate config",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setScopeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const hasFilters =
    Boolean(search.trim()) ||
    scopeFilter !== "all" ||
    statusFilter !== "all";

  const totalCount = pagination?.totalCount ?? 0;
  const activeCount = configs.filter((c) => c.isActive).length;
  const inactiveCount = configs.filter((c) => !c.isActive).length;

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text">
            <Coffee size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              Total configs
            </p>
            <p className="text-2xl font-bold text-text-primary">{totalCount}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-present-bg text-present-text">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              Active (page)
            </p>
            <p className="text-2xl font-bold text-present-text">{activeCount}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-absent-bg text-absent-text">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              Inactive (page)
            </p>
            <p className="text-2xl font-bold text-absent-text">
              {inactiveCount}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Break Configurations
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {configs.length} on this page · {totalCount} total
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
              {hasFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 text-xs font-medium text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap"
              >
                <Plus size={14} />
                Add Config
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search type or label…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-full transition"
              />
            </div>

            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
            >
              <option value="all">All scopes</option>
              <option value="ALL">ALL</option>
              <option value="SPECIFIC_USERS">SPECIFIC_USERS</option>
              <option value="ROLE">ROLE</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            rows={configs}
            rowIdKey="id"
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectable={false}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            emptyText={
              hasFilters
                ? "No configs match your filters"
                : "No break configurations yet"
            }
          />
        </div>
      </section>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, row: null })}
        onConfirm={handleConfirmDelete}
        title="Deactivate Break Config"
        message={
          confirmModal.row
            ? `Deactivate "${confirmModal.row.label || confirmModal.row.breakType}"? Employees will no longer see this break option.`
            : "Are you sure?"
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        isDangerous
        loading={deleteLoading}
      />

      <BreakConfigFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchConfigs(page)}
      />

      <BreakConfigEditModal
        open={editOpen}
        configId={editConfigId}
        onClose={() => {
          setEditOpen(false);
          setEditConfigId(null);
        }}
        onSuccess={() => fetchConfigs(page)}
      />
    </>
  );
};

export default BreakConfigs;
