import React, { useState, useMemo } from "react";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely reads nested values from an object using dot notation path
 * Example: getValueByPath({ user: { name: 'John' } }, 'user.name') => 'John'
 */
const getValueByPath = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

// ============================================================================
// DataTable Component
// ============================================================================

const DataTable = ({
  columns,
  rows,
  rowIdKey = "id",
  onView,
  onEdit,
  onDelete,
  onBulkDelete,
  selectable = true,
  loading = false,
  emptyText = "No data available",
  pagination = null,
  onPageChange = null,
}) => {
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Check if Actions column should be shown
  const showActionsColumn = !!(onView || onEdit || onDelete);

  // Get row ID
  const getRowId = (row) => {
    return getValueByPath(row, rowIdKey) || row[rowIdKey];
  };

  // Toggle single row selection
  const toggleRowSelection = (rowId) => {
    const newSelection = new Set(selectedRowIds);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRowIds(newSelection);
  };

  // Toggle all rows selection
  const toggleAllRows = () => {
    if (selectedRowIds.size === rows.length) {
      // Unselect all
      setSelectedRowIds(new Set());
    } else {
      // Select all
      const allIds = rows.map((row) => getRowId(row));
      setSelectedRowIds(new Set(allIds));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRowIds(new Set());
  };

  // Get selected rows data
  const selectedRows = useMemo(() => {
    return rows.filter((row) => selectedRowIds.has(getRowId(row)));
  }, [rows, selectedRowIds, rowIdKey]);

  // Header checkbox state
  const isAllSelected = rows.length > 0 && selectedRowIds.size === rows.length;
  const isIndeterminate =
    selectedRowIds.size > 0 && selectedRowIds.size < rows.length;

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedRows);
      clearSelection();
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <>
        {[...Array(3)].map((_, idx) => (
          <tr key={`skeleton-${idx}`} className="animate-pulse">
            {selectable && (
              <td className="px-2 py-3">
                <div
                  className="h-4 rounded my-2"
                  style={{ backgroundColor: "var(--color-border)" }}
                ></div>
              </td>
            )}
            {columns.map((col, colIdx) => (
              <td key={colIdx} className="px-4 py-3">
                <div
                  className="h-4 rounded my-2"
                  style={{ backgroundColor: "var(--color-border)" }}
                ></div>
              </td>
            ))}
            {showActionsColumn && (
              <td className="px-4 py-3">
                <div
                  className="h-4 rounded my-2"
                  style={{ backgroundColor: "var(--color-border)" }}
                ></div>
              </td>
            )}
          </tr>
        ))}
      </>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    return (
      <tr>
        <td
          colSpan={
            (selectable ? 1 : 0) + columns.length + (showActionsColumn ? 1 : 0)
          }
          className="text-center py-12 px-4 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {emptyText}
        </td>
      </tr>
    );
  };

  return (
    <div className="relative w-full max-h-120">
      <div
        className="overflow-x-auto border rounded-lg shadow-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={{
              backgroundColor: "var(--color-background)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <tr>
              {/* Select All Checkbox */}
              {selectable && (
                <th className="w-10 text-center px-2 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleAllRows}
                    disabled={loading || rows.length === 0}
                    className="cursor-pointer w-4 h-4 accent-black"
                  />
                </th>
              )}

              {/* Column Headers */}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  style={{
                    width: column.width,
                    color: "var(--color-text-primary)",
                  }}
                  className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}

              {/* Actions Column Header */}
              {showActionsColumn && (
                <th
                  style={{ color: "var(--color-text-primary)" }}
                  className="px-4 py-3 text-center font-semibold whitespace-nowrap"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading
              ? renderLoadingSkeleton()
              : rows.length === 0
                ? renderEmptyState()
                : rows.map((row) => {
                    const rowId = getRowId(row);
                    const isSelected = selectedRowIds.has(rowId);

                    return (
                      <tr
                        key={rowId}
                        className="transition-colors"
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          backgroundColor: isSelected
                            ? "rgba(0, 0, 0, 0.04)"
                            : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-background)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        {/* Row Checkbox */}
                        {selectable && (
                          <td className="w-10 text-center px-2 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(rowId)}
                              className="cursor-pointer w-4 h-4 accent-black"
                            />
                          </td>
                        )}

                        {/* Data Cells */}
                        {columns.map((column, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-3"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {column.render
                              ? column.render(row)
                              : (getValueByPath(row, column.key) ?? "-")}
                          </td>
                        ))}

                        {/* Actions Cell */}
                        {showActionsColumn && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center items-center">
                              {onView && (
                                <button
                                  onClick={() => onView(row)}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed bg-background text-text-primary border-border hover:border-text-primary"
                                >
                                  View
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(row)}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "var(--color-primary-foreground)",
                                    borderColor: "var(--color-primary)",
                                  }}
                                  onMouseEnter={(e) =>
                                    !loading &&
                                    (e.currentTarget.style.opacity = "0.85")
                                  }
                                  onMouseLeave={(e) =>
                                    !loading &&
                                    (e.currentTarget.style.opacity = "1")
                                  }
                                >
                                  Edit
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(row)}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor: "var(--color-error)",
                                    color: "white",
                                    borderColor: "var(--color-error)",
                                  }}
                                  onMouseEnter={(e) =>
                                    !loading &&
                                    (e.currentTarget.style.opacity = "0.85")
                                  }
                                  onMouseLeave={(e) =>
                                    !loading &&
                                    (e.currentTarget.style.opacity = "1")
                                  }
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectable && selectedRowIds.size > 0 && onBulkDelete && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
          style={{
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            className="px-6 py-4 rounded-lg flex items-center gap-6"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <span className="font-semibold text-sm">
              {selectedRowIds.size} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-primary-foreground)",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                }}
                onMouseEnter={(e) =>
                  !loading &&
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)")
                }
                onMouseLeave={(e) =>
                  !loading &&
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                disabled={loading}
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-error)",
                  color: "white",
                  borderColor: "var(--color-error)",
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.opacity = "0.85")
                }
                onMouseLeave={(e) =>
                  !loading && (e.currentTarget.style.opacity = "1")
                }
                disabled={loading}
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && onPageChange && (
        <div
          className="mt-4 flex items-center justify-between px-6 py-3 text-xs"
          style={{
            backgroundColor: "var(--color-background)",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ color: "var(--color-text-secondary)" }}>
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
            <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
              {pagination.totalCount}
            </span>{" "}
            results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage || loading}
              className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                borderColor: "var(--color-border)",
              }}
              onMouseEnter={(e) =>
                !loading && !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = "var(--color-background)")
              }
              onMouseLeave={(e) =>
                !loading &&
                (e.currentTarget.style.backgroundColor = "var(--color-surface)")
              }
            >
              ← Previous
            </button>

            <div
              style={{ color: "var(--color-text-secondary)" }}
              className="px-3 py-1.5 text-xs"
            >
              Page{" "}
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                {pagination.currentPage}
              </span>{" "}
              of{" "}
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                {pagination.totalPages}
              </span>
            </div>

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                borderColor: "var(--color-border)",
              }}
              onMouseEnter={(e) =>
                !loading && !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = "var(--color-background)")
              }
              onMouseLeave={(e) =>
                !loading &&
                (e.currentTarget.style.backgroundColor = "var(--color-surface)")
              }
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DataTable;

// ============================================================================
// Example Usage (Commented)
// ============================================================================

/*
import DataTable from './DataTable';

// Sample data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
];

// Nested data example
const employees = [
  { 
    id: 101, 
    user: { name: 'Alice', email: 'alice@company.com' },
    department: { name: 'Engineering' },
    salary: 95000 
  },
  { 
    id: 102, 
    user: { name: 'Charlie', email: 'charlie@company.com' },
    department: { name: 'Marketing' },
    salary: 75000 
  },
];

// Column definitions
const columns = [
  { header: 'ID', key: 'id', width: 80 },
  { header: 'Name', key: 'name' },
  { header: 'Email', key: 'email' },
  { 
    header: 'Role', 
    key: 'role',
    render: (row) => (
      <span className="px-2 py-1 rounded text-xs font-medium" style={{
        backgroundColor: row.role === 'Admin' ? '#dbeafe' : '#f3f4f6',
        color: row.role === 'Admin' ? '#1e40af' : '#374151'
      }}>
        {row.role}
      </span>
    )
  },
  { 
    header: 'Status', 
    key: 'status',
    render: (row) => (
      <span style={{ 
        color: row.status === 'active' ? 'var(--color-success)' : 'var(--color-error)' 
      }}>
        {row.status}
      </span>
    )
  },
];

// Nested columns example
const employeeColumns = [
  { header: 'ID', key: 'id', width: 80 },
  { header: 'Name', key: 'user.name' }, // Nested path
  { header: 'Email', key: 'user.email' }, // Nested path
  { header: 'Department', key: 'department.name' }, // Nested path
  { 
    header: 'Salary', 
    key: 'salary',
    render: (row) => `$${row.salary.toLocaleString()}`
  },
];

// Event handlers
const handleEdit = (row) => {
  console.log('Editing:', row);
  // Open edit modal/form
};

const handleDelete = (row) => {
  console.log('Deleting:', row);
  // Show confirmation and delete
};

const handleBulkDelete = (selectedRows) => {
  console.log('Bulk deleting:', selectedRows);
  // Show confirmation and delete multiple rows
};

// Usage in component
function App() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users Table</h1>
      
      <DataTable
        columns={columns}
        rows={users}
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        selectable={true}
        loading={loading}
        emptyText="No users found"
      />

      <h1 className="text-2xl font-bold mt-12 mb-4">Employees Table (Nested Data)</h1>
      
      <DataTable
        columns={employeeColumns}
        rows={employees}
        onEdit={handleEdit}
        onBulkDelete={handleBulkDelete}
        selectable={true}
      />

      <h1 className="text-2xl font-bold mt-12 mb-4">Read-only Table (No Actions)</h1>
      
      <DataTable
        columns={columns}
        rows={users}
        selectable={false}
        emptyText="No data available"
      />
    </div>
  );
}
*/
