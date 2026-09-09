import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Clock,
  Calendar,
  ChevronRight,
  Search,
} from "lucide-react";
import useAuth from "../../login/hooks/useAuth.js";
import DataTable from "../components/DataTable.jsx";
import RegularizeReviewModal from "../components/regularize/RegularizeReviewModal.jsx";
import { regularizeApi } from "../../../shared/api/regularizeApi.js";
import { toast } from "react-toastify";
import { formatDate } from "../../../shared/utils/dateUtil.js";
import useDebounce from "../../../shared/hooks/useDebounce.js";

const STATUS_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { bg: "bg-late-bg", text: "text-late-text", label: "Pending" },
    APPROVED: {
      bg: "bg-present-bg",
      text: "text-present-text",
      label: "Approved",
    },
    REJECTED: {
      bg: "bg-absent-bg",
      text: "text-absent-text",
      label: "Rejected",
    },
  };
  const config = map[status] || map.PENDING;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const TimeCell = ({ time }) => {
  if (!time) return <span className="text-text-muted text-xs">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={14} className="text-text-muted shrink-0" />
      <span className="text-xs text-text-secondary">
        {new Date(time).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </span>
    </div>
  );
};

const columns = [
  {
    header: "Employee",
    key: "user.employeeName",
    render: (row) => (
      <div>
        <p className="font-medium text-text-primary text-sm">
          {row.user?.employeeName ?? "—"}
        </p>
        <p className="text-xs text-text-muted">{row.user?.employeeId ?? "—"}</p>
      </div>
    ),
  },
  {
    header: "Date",
    key: "date",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-muted shrink-0" />
        <span className="text-sm text-text-secondary">{formatDate(row.date)}</span>
      </div>
    ),
  },
  {
    header: "Requested in",
    key: "requestedCheckIn",
    render: (row) => <TimeCell time={row.requestedCheckIn} />,
  },
  {
    header: "Requested out",
    key: "requestedCheckOut",
    render: (row) => <TimeCell time={row.requestedCheckOut} />,
  },
  {
    header: "Status",
    key: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

const Regularize = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [review, setReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async (nextPage = page, nextStatus = status) => {
    setLoading(true);
    try {
      const { data } = await regularizeApi.list({
        status: nextStatus,
        page: nextPage,
        limit: 20,
      });
      setRows(data?.requests || []);
      setPagination(data?.pagination || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(page, status);
  }, [page, status]);

  const filtered = rows.filter((row) => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      row.user?.employeeName?.toLowerCase().includes(q) ||
      String(row.user?.employeeId || "").toLowerCase().includes(q) ||
      row.reason?.toLowerCase().includes(q)
    );
  });

  const openReview = async (row) => {
    try {
      const { data } = await regularizeApi.getById(row.id);
      setReview(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load request");
    }
  };

  const handleApprove = async (payload) => {
    if (!review?.id) return;
    setActionLoading(true);
    try {
      await regularizeApi.approve(review.id, payload);
      toast.success("Request approved");
      setReview(null);
      await fetchRequests(page, status);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (payload) => {
    if (!review?.id) return;
    setActionLoading(true);
    try {
      await regularizeApi.reject(review.id, payload);
      toast.success("Request rejected");
      setReview(null);
      await fetchRequests(page, status);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Regularization
          </h1>
          <p className="text-xs text-text-secondary">
            Review employee attendance correction requests
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.employeeName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="text-sm font-medium text-weekoff-text hidden sm:block">
            {user?.employeeName ?? "Admin"}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-late-bg text-late-text">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                {status === "PENDING" ? "Pending requests" : `${status} count`}
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {pagination?.totalCount || 0}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setPage(1);
                    setStatus(tab.key);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    status === tab.key
                      ? "bg-text-primary text-white"
                      : "text-text-secondary hover:bg-background"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search employee or reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-56"
              />
            </div>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={filtered}
              rowIdKey="id"
              onView={openReview}
              selectable={false}
              loading={loading}
              pagination={pagination}
              onPageChange={setPage}
              emptyText="No regularization requests"
            />
          </div>
        </section>
      </div>

      <RegularizeReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        request={review}
        loading={actionLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </main>
  );
};

export default Regularize;
