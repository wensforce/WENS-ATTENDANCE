import React, { useCallback, useEffect, useState } from "react";
import {
  Coffee,
  Clock,
  Calendar,
  Search,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable.jsx";
import ConfirmModal from "../../../../shared/components/ConfirmModal.jsx";
import BreakEditModal from "../../components/break/BreakEditModal.jsx";
import BreakCreateModal from "../../components/break/BreakCreateModal.jsx";
import { formatDate } from "../../../../shared/utils/dateUtil.js";
import useDebounce from "../../../../shared/hooks/useDebounce.js";
import { breakApi } from "../../api/breakApi.js";
import { breakConfigApi } from "../../api/breakConfigApi.js";
import { toast } from "react-toastify";

const todayStr = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const PAGE_LIMIT = 10;

const formatTime = (time) => {
  if (!time) return "—";
  return new Date(time).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const EmployeeCell = ({ name, employeeId }) => {
  const initials =
    name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") ?? "?";

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
        {initials}
      </div>
      <div>
        <p className="font-medium text-text-primary whitespace-nowrap text-sm">
          {name ?? "—"}
        </p>
        <p className="text-xs text-text-muted">{employeeId ?? "—"}</p>
      </div>
    </div>
  );
};

const TypeBadge = ({ label, breakType }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text whitespace-nowrap">
    {label || breakType || "—"}
  </span>
);

const OverLimitBadge = ({ isOverLimit }) =>
  isOverLimit ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-absent-bg text-absent-text whitespace-nowrap">
      <AlertTriangle size={12} />
      Over limit
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-present-bg text-present-text whitespace-nowrap">
      OK
    </span>
  );

const TimeCell = ({ time }) => (
  <div className="flex items-center gap-1.5">
    <Clock size={14} className="text-text-muted shrink-0" />
    <span className="text-xs text-text-secondary">{formatTime(time)}</span>
  </div>
);

const columns = [
  {
    header: "Employee",
    key: "user.employeeName",
    render: (row) => (
      <EmployeeCell
        name={row.user?.employeeName}
        employeeId={row.user?.employeeId}
      />
    ),
  },
  {
    header: "Type",
    key: "breakConfig.label",
    render: (row) => (
      <TypeBadge
        label={row.breakConfig?.label}
        breakType={row.breakConfig?.breakType}
      />
    ),
  },
  {
    header: "Date",
    key: "startTime",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-muted shrink-0" />
        <span className="text-sm text-text-secondary">
          {formatDate(row.startTime)}
        </span>
      </div>
    ),
  },
  {
    header: "Start",
    key: "startTime",
    render: (row) => <TimeCell time={row.startTime} />,
  },
  {
    header: "End",
    key: "endTime",
    render: (row) =>
      row.endTime ? (
        <TimeCell time={row.endTime} />
      ) : (
        <span className="text-xs font-medium text-late-text">In progress</span>
      ),
  },
  {
    header: "Duration",
    key: "durationMins",
    render: (row) => (
      <span className="text-xs font-medium text-text-secondary">
        {row.durationMins != null ? `${row.durationMins} min` : "—"}
        {row.extraTime > 0 ? (
          <span className="text-absent-text"> (+{row.extraTime})</span>
        ) : null}
      </span>
    ),
  },
  {
    header: "Extra",
    key: "extraTime",
    render: (row) => (
      <span
        className={`text-xs font-medium ${
          row.extraTime > 0 ? "text-absent-text" : "text-text-muted"
        }`}
      >
        {row.extraTime > 0 ? `${row.extraTime} min` : "—"}
      </span>
    ),
  },
  {
    header: "Limit",
    key: "isOverLimit",
    render: (row) => <OverLimitBadge isOverLimit={row.isOverLimit} />,
  },
];

const BreakLogs = () => {
  const navigate = useNavigate();
  const [breaks, setBreaks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [overLimitFilter, setOverLimitFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [breakTypes, setBreakTypes] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  const [confirmModal, setConfirmModal] = useState({ open: false, row: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editBreak, setEditBreak] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Load break types from configs (admin-defined, not hardcoded)
  useEffect(() => {
    let cancelled = false;
    const loadTypes = async () => {
      try {
        const { data } = await breakConfigApi.fetchAll({
          page: 1,
          limit: 100,
          status: "all",
        });
        if (cancelled) return;
        const configs = data?.breakConfigs || data?.configs || [];
        setBreakTypes(
          configs.map((c) => ({
            value: c.breakType,
            label: c.label || c.breakType,
          })),
        );
      } catch {
        if (!cancelled) setBreakTypes([]);
      }
    };
    loadTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchBreaks = useCallback(async (nextPage) => {
    setLoading(true);
    try {
      const { data } = await breakApi.fetchAllBreaks({
        page: nextPage,
        limit: PAGE_LIMIT,
        search: debouncedSearch.trim(),
        date: dateFilter,
        type: typeFilter,
        overLimit: overLimitFilter,
      });
      setBreaks(data?.breaks || []);
      setPagination(data?.pagination || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load breaks");
      setBreaks([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFilter, typeFilter, overLimitFilter]);

  // Filters/search change → always start from page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, typeFilter, overLimitFilter]);

  useEffect(() => {
    fetchBreaks(page);
  }, [page, fetchBreaks]);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const handleEdit = (row) => {
    setEditBreak(row);
  };

  const handleView = (row) => {
    navigate(`/admin/breaks/${row.id}`);
  };

  const handleDelete = (row) => {
    setConfirmModal({ open: true, row });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.row) return;
    setDeleteLoading(true);
    try {
      await breakApi.deleteBreak(confirmModal.row.id);
      toast.success("Break deleted");
      setConfirmModal({ open: false, row: null });
      await fetchBreaks(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete break");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setOverLimitFilter("all");
    setDateFilter(todayStr());
    setPage(1);
  };

  const hasFilters =
    Boolean(search.trim()) ||
    typeFilter !== "all" ||
    overLimitFilter !== "all" ||
    dateFilter !== todayStr();

  const totalCount = pagination?.totalCount ?? 0;
  const overLimitCount = breaks.filter((b) => b.isOverLimit).length;
  const openCount = breaks.filter((b) => !b.endTime).length;

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text">
            <Coffee size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              Total Breaks
            </p>
            <p className="text-2xl font-bold text-text-primary">{totalCount}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-late-bg text-late-text">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              In Progress (page)
            </p>
            <p className="text-2xl font-bold text-late-text">{openCount}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-absent-bg text-absent-text">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-0.5">
              Over Limit (page)
            </p>
            <p className="text-2xl font-bold text-absent-text">
              {overLimitCount}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Break Logs
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {breaks.length} on this page · {totalCount} total
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
                Add Break
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search employee or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-full transition"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
            >
              <option value="all">All Types</option>
              {breakTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={overLimitFilter}
              onChange={(e) => setOverLimitFilter(e.target.value)}
              className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
            >
              <option value="all">All Limits</option>
              <option value="over">Over limit</option>
              <option value="ok">Within limit</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
            />
          </div>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            rows={breaks}
            rowIdKey="id"
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectable={false}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            emptyText={
              hasFilters || dateFilter
                ? "No breaks match your filters"
                : "No break logs found"
            }
          />
        </div>
      </section>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, row: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Break"
        message={
          confirmModal.row
            ? `Delete ${confirmModal.row.breakConfig?.label || "this"} break for ${confirmModal.row.user?.employeeName || "employee"}? This cannot be undone.`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        loading={deleteLoading}
      />

      <BreakEditModal
        open={!!editBreak}
        breakRecord={editBreak}
        onClose={() => setEditBreak(null)}
        onSuccess={() => fetchBreaks(page)}
      />

      <BreakCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchBreaks(page)}
      />
    </>
  );
};

export default BreakLogs;
