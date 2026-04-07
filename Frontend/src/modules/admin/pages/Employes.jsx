import React, { useEffect, useState } from "react";
import { Users, Mail, Phone, Search, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../login/hooks/useAuth.js";
import { employeesApi } from "../api/employeesApi.js";
import DataTable from "../components/DataTable.jsx";
import EmployeeFormModal from "../components/employee/EmployeeFormModal.jsx";
import EmployeePinModal from "../components/employee/EmployeePinModal.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import { toast } from "react-toastify";
import useDebounce from "../../../shared/hooks/useDebounce.js";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const DesignationBadge = ({ designation }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-holiday-bg text-holiday-text whitespace-nowrap">
    {designation ?? "N/A"}
  </span>
);

// ─── Avatar Cell ──────────────────────────────────────────────────────────────

const AvatarCell = ({ name }) => {
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
      <span className="font-medium text-text-primary whitespace-nowrap">
        {name ?? "—"}
      </span>
    </div>
  );
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const buildColumns = () => [
  {
    header: "Employee",
    key: "employeeName",
    render: (row) => <AvatarCell name={row.employeeName} />,
  },
  {
    header: "Employee ID",
    key: "employeeId",
    render: (row) => (
      <span className="text-text-secondary font-mono text-xs font-semibold">
        {row.employeeId ?? "—"}
      </span>
    ),
  },
  {
    header: "Department",
    key: "department",
    render: (row) => (
      <span className="text-text-secondary text-sm">
        {row.department?.name ?? row.department ?? "N/A"}
      </span>
    ),
  },
  {
    header: "Designation",
    key: "designation",
    render: (row) => <DesignationBadge designation={row.designation?.name ?? row.designation} />,
  },
  {
    header: "Email",
    key: "email",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Mail size={14} className="text-text-muted shrink-0" />
        <span className="text-text-secondary text-xs">{row.email ?? "—"}</span>
      </div>
    ),
  },
  {
    header: "Phone",
    key: "mobileNumber",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Phone size={14} className="text-text-muted shrink-0" />
        <span className="text-text-secondary text-xs">
          {row.mobileNumber ?? "—"}
        </span>
      </div>
    ),
  },
  {
    header:"joining date",
    key:"joinDate",
    render:(row) => (
      <span className="text-text-secondary text-sm">
        {row.joinDate ? new Date(row.joinDate).toLocaleDateString() : "N/A"}
      </span>
    )
  }
];

// ─── Employees Page ───────────────────────────────────────────────────────────

const Employes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [employeeCredentials, setEmployeeCredentials] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // 'single' or 'bulk'
    rowToDelete: null,
    rowsToDelete: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(search, 500);

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await employeesApi.fetchAllEmployees(page);
      
      setEmployees(data.employees);
      setFiltered(data.employees);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Search filter
  useEffect(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) {
      setFiltered(employees);
      return;
    }
    setFiltered(
      employees.filter(
        (emp) =>
          emp.employeeName?.toLowerCase().includes(q) ||
          emp.department?.name?.toLowerCase().includes(q) ||
          emp.designation?.name?.toLowerCase().includes(q) ||
          emp.employeeId?.toLowerCase().includes(q) ||
          emp.email?.toLowerCase().includes(q),
      ),
    );
  }, [debouncedSearch, employees]);

  const handleOpenAdd = () => {
    setEditEmployee(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditEmployee(row);
    setModalOpen(true);
  };

  const handleViewDetails = (row) => {
    navigate(`/admin/employees/${row.id}`);
  };

  const handleModalSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editEmployee) {
        
        await employeesApi.updateEmployee(editEmployee.id, formData);
        toast.success("Employee updated successfully");
        setModalOpen(false);
        setEditEmployee(null);
        await fetchEmployees(currentPage);
      } else {
        const {data} = await employeesApi.createEmployee(formData);
        setModalOpen(false);
        setEditEmployee(null);
        
        // Show PIN modal with employee credentials
        if (data && data.pin && data.email) {
          setEmployeeCredentials(data);
          setPinModalOpen(true);
        }
        
        await fetchEmployees(1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save employee");
      console.error("Error saving employee:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (row) => {
    setConfirmModal({
      open: true,
      type: "single",
      rowToDelete: row,
      rowsToDelete: null,
    });
  };

  const handleBulkDelete = (selectedRows) => {
    setConfirmModal({
      open: true,
      type: "bulk",
      rowToDelete: null,
      rowsToDelete: selectedRows,
    });
  };

  const handlePageChange = (page) => {
    fetchEmployees(page);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (confirmModal.type === "single" && confirmModal.rowToDelete) {
        await employeesApi.deleteEmployee(confirmModal.rowToDelete.id);
        await fetchEmployees(currentPage);
        toast.success("Employee deleted successfully");
      } else if (confirmModal.type === "bulk" && confirmModal.rowsToDelete) {
        const ids = confirmModal.rowsToDelete.map((r) => r.id);
        await employeesApi.bulkDeleteEmployees(ids);
        await fetchEmployees(currentPage);
        toast.success(`${confirmModal.rowsToDelete.length} employees deleted successfully`);
      }
      setConfirmModal({ open: false, type: null, rowToDelete: null, rowsToDelete: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete employee");
      console.error("Error deleting employee:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Stats
  
  const totalCount = employees.length;

  return (
    <main className="flex-1 min-w-0">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            Employees
          </h1>
          <p className="text-xs text-text-secondary">
            Manage your workforce directory
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
        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-holiday-bg text-holiday-text">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {totalCount}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-present-bg text-present-text">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Departments
              </p>
              <p className="text-2xl font-bold text-present-text">
                {new Set(employees.map((e) => e.department?.name ?? e.department)).size}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-absent-bg text-absent-text">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-0.5">
                Designations
              </p>
              <p className="text-2xl font-bold text-absent-text">
                {new Set(employees.map((e) => e.designation?.name ?? e.designation)).size}
              </p>
            </div>
          </div>
        </section>

        {/* ── Table Card ── */}
        <section className="bg-surface rounded-xl border border-border shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Employee Directory
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {filtered.length} of {totalCount} employees
              </p>
            </div>

            <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Search by name, dept, role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 text-xs bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary w-56 transition"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-text-primary text-white text-xs font-medium rounded-lg hover:opacity-85 transition-opacity whitespace-nowrap"
              >
                <Plus size={14} />
                Add Employee
              </button>
            </div>
          </div>

          {/* DataTable */}
          <div className="p-4">
            <DataTable
              columns={buildColumns()}
              rows={filtered}
              rowIdKey="id"
              onView={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              selectable
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              emptyText={
                search ? "No employees match your search" : "No employees found"
              }
            />
          </div>
        </section>
      </div>

      {/* ── Employee Form Modal ── */}
      <EmployeeFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEmployee(null);
        }}
        onSubmit={handleModalSubmit}
        editData={editEmployee}
        loading={modalLoading}
      />

      {/* ── Employee PIN Modal ── */}
      <EmployeePinModal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setEmployeeCredentials(null);
        }}
        email={employeeCredentials?.email}
        pin={employeeCredentials?.pin}
        employeeName={employeeCredentials?.employeeName}
      />

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() =>
          setConfirmModal({
            open: false,
            type: null,
            rowToDelete: null,
            rowsToDelete: null,
          })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message={
          confirmModal.type === "single" && confirmModal.rowToDelete
            ? `Are you sure you want to delete ${confirmModal.rowToDelete.employeeName}? This action cannot be undone.`
            : confirmModal.type === "bulk" && confirmModal.rowsToDelete
            ? `Are you sure you want to delete ${confirmModal.rowsToDelete.length} employee(s)? This action cannot be undone.`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={deleteLoading}
      />
    </main>
  );
};

export default Employes;
