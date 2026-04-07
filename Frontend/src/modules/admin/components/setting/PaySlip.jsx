import React, { useState, useEffect } from "react";
import {
  Download,
  Users,
  DollarSign,
  Minus,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useDebounce from "../../../../shared/hooks/useDebounce.js";
import { employeesApi } from "../../api/employeesApi.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (val) =>
  (parseFloat(val) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const numberToWords = (amount) => {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n) => {
    if (n === 0) return "";
    if (n < 20) return units[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    if (n < 1000)
      return (
        units[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  };

  if (!amount || amount === 0) return "Zero Only";
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "" + convert(rupees);
  if (paise > 0) result += " and " + convert(paise) + " Paise";
  return result + " Only";
};

const formatDMY = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "—";
  }
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EARNING_LABELS = {
  basicSalary: "Basic Salary",
  dearness: "Dearness Allowance",
  houseRent: "House Rent Allowance",
  medical: "Medical Allowance",
  conveyance: "Travelling Allowance",
  cca: "City Compensatory Allowance (CCA)",
  otherAllowances: "Other Allowances",
};

const DEDUCTION_LABELS = {
  epfEmployee: "EPF – Employee (12% of Basic)",
  esicEmployee: "ESIC – Employee (0.75% of Gross)",
  providentFund: "Provident Fund (PF)",
  incomeTax: "Income Tax",
  professionalTax: "Professional Tax (Maharashtra)",
  advanceRecovery: "Advance Recovery",
  otherDeductions: "Other Deductions",
};

const EMPTY_FORM = {
  employeeId: "",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  payDate: "",
  paidDays: "",
  lopDays: "0",
  bankAccountNo: "",
  basicSalary: "",
  dearness: "",
  houseRent: "",
  medical: "",
  conveyance: "",
  cca: "",
  otherAllowances: "",
  epfEmployee: "",
  esicEmployee: "",
  providentFund: "",
  incomeTax: "",
  professionalTax: "",
  advanceRecovery: "",
  otherDeductions: "",
};

// ─── Payslip Template (rendered for PDF) ─────────────────────────────────────

const PayslipTemplate = ({
  formData,
  selectedEmployee,
  totalEarnings,
  totalDeductions,
  netSalary,
  earnings,
  deductions,
}) => {
  const earningRows = Object.entries(EARNING_LABELS).filter(
    ([k]) => earnings[k] > 0,
  );
  const deductionRows = Object.entries(DEDUCTION_LABELS).filter(
    ([k]) => deductions[k] > 0,
  );
  const tableRows = Math.max(earningRows.length, deductionRows.length, 1);

  const cell = (extra = {}) => ({
    padding: "8px 12px",
    fontSize: "11px",
    verticalAlign: "top",
    ...extra,
  });

  return (
    <div
      id="payslip-template"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
        width: "794px",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "24px 32px 20px",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Logo */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/wensforce_logo.png" alt="Company Logo" />
          </div>
          <div>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#111827",
                margin: "0 0 4px 0",
              }}
            >
              WENS FORCE INTERNATIONAL PVT. LTD.
            </p>
            <p
              style={{
                fontSize: "9.5px",
                color: "#6b7280",
                margin: 0,
                maxWidth: "300px",
                lineHeight: "1.6",
              }}
            >
              Office No. 89, Level 2/1, 2nd Floor, Empire Building, Dr Dadabhai
              Naoroji Rd, opposite Chhatrapati Shivaji Maharaj Terminus, Azad
              Maidan, Fort Mumbai Maharashtra 400001 India
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right", paddingTop: "4px" }}>
          <p
            style={{ fontSize: "11px", color: "#7b7280", margin: "0 0 3px 0" }}
          >
            Pay slip For the Month
          </p>
          <p
            style={{
              fontSize: "17px",
              fontWeight: "800",
              color: "#111827",
              margin: 0,
            }}
          >
            {MONTHS[formData.month - 1]} {formData.year}
          </p>
        </div>
      </div>

      {/* ── Employee Summary ── */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "2px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "24px",
        }}
      >
        {/* Left */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#374151",
              margin: "0 0 12px 0",
              letterSpacing: "0.06em",
            }}
          >
            EMPLOYEE SUMMARY
          </p>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Employee Name", selectedEmployee?.employeeName],
                [
                  "Designation",
                  selectedEmployee?.designation?.name ||
                    selectedEmployee?.designation ||
                    "—",
                ],
                ["Employee ID", selectedEmployee?.employeeId],
                ["Date of Joining", formatDMY(selectedEmployee?.createdAt)],
                [
                  "Pay Period",
                  `${MONTHS[formData.month - 1]} ${formData.year}`,
                ],
                [
                  "Pay Date",
                  formData.payDate ? formatDMY(formData.payDate) : "—",
                ],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td
                    style={{
                      fontSize: "11px",
                      color: "#374151",
                      paddingBottom: "7px",
                      width: "140px",
                    }}
                  >
                    {label}
                  </td>
                  <td
                    style={{
                      fontSize: "11px",
                      color: "#374151",
                      paddingBottom: "7px",
                      width: "10px",
                    }}
                  >
                    :
                  </td>
                  <td
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#111827",
                      paddingBottom: "7px",
                    }}
                  >
                    {val || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Net Pay box */}
        <div
          style={{
            border: "1px solid #d1fae5",
            borderLeft: "4px solid #10b981",
            borderRadius: "8px",
            padding: "16px 20px",
            minWidth: "260px",
            backgroundColor: "#f0fdf4",
          }}
        >
          <p
            style={{
              fontSize: "26px",
              fontWeight: "900",
              color: "#065f46",
              margin: "0 0 2px 0",
            }}
          >
            ₹{formatINR(netSalary)}
          </p>
          <p
            style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 12px 0" }}
          >
            Total Net Pay
          </p>
          <hr
            style={{
              border: "none",
              borderTop: "1px dashed #a7f3d0",
              margin: "0 0 10px 0",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}
          >
            <span style={{ fontSize: "10px", color: "#374151" }}>
              Paid Days
            </span>
            <span
              style={{ fontSize: "10px", fontWeight: "700", color: "#111827" }}
            >
              {formData.paidDays || "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", color: "#374151" }}>LOP Days</span>
            <span
              style={{ fontSize: "10px", fontWeight: "700", color: "#111827" }}
            >
              {formData.lopDays || "0"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bank Account ── */}
      {formData.bankAccountNo && (
        <div
          style={{ padding: "10px 32px", borderBottom: "1px solid #e5e7eb" }}
        >
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  style={{ fontSize: "11px", color: "#6b7280", width: "140px" }}
                >
                  Bank Account No
                </td>
                <td
                  style={{ fontSize: "11px", color: "#6b7280", width: "10px" }}
                >
                  :
                </td>
                <td
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {formData.bankAccountNo}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Earnings & Deductions Table ── */}
      <div style={{ padding: "16px 32px", borderBottom: "2px solid #e5e7eb" }}>
        {totalDeductions > 0 ? (
          // Show both Earnings and Deductions
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {[
                  {
                    label: "EARNINGS",
                    align: "left",
                    borderRight: "1px solid #e5e7eb",
                    width: "24%",
                  },
                  {
                    label: "AMOUNT",
                    align: "right",
                    borderRight: "1px solid #e5e7eb",
                    width: "13%",
                  },
                  {
                    label: "YTD",
                    align: "right",
                    borderRight: "2px solid #d1d5db",
                    width: "10%",
                  },
                  {
                    label: "DEDUCTIONS",
                    align: "left",
                    borderRight: "1px solid #e5e7eb",
                    width: "27%",
                  },
                  {
                    label: "AMOUNT",
                    align: "right",
                    borderRight: "1px solid #e5e7eb",
                    width: "13%",
                  },
                  {
                    label: "YTD",
                    align: "right",
                    borderRight: "none",
                    width: "10%",
                  },
                ].map(({ label, align, borderRight, width }, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: "800",
                      textAlign: align,
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight,
                      width,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tableRows }, (_, i) => {
                const [ek, el] = earningRows[i] || [];
                const [dk, dl] = deductionRows[i] || [];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td
                      style={{
                        ...cell({
                          color: "#374151",
                          borderRight: "1px solid #e5e7eb",
                        }),
                      }}
                    >
                      {el || ""}
                    </td>
                    <td
                      style={{
                        ...cell({
                          fontWeight: "700",
                          color: "#111827",
                          textAlign: "right",
                          borderRight: "1px solid #e5e7eb",
                        }),
                      }}
                    >
                      {ek ? `₹${formatINR(earnings[ek])}` : ""}
                    </td>
                    <td
                      style={{
                        ...cell({
                          fontSize: "10px",
                          color: "#6b7280",
                          textAlign: "right",
                          borderRight: "2px solid #d1d5db",
                        }),
                      }}
                    >
                      {ek ? `₹${formatINR(earnings[ek])}` : ""}
                    </td>
                    <td
                      style={{
                        ...cell({
                          color: "#374151",
                          borderRight: "1px solid #e5e7eb",
                        }),
                      }}
                    >
                      {dl || ""}
                    </td>
                    <td
                      style={{
                        ...cell({
                          fontWeight: "700",
                          color: "#111827",
                          textAlign: "right",
                          borderRight: "1px solid #e5e7eb",
                        }),
                      }}
                    >
                      {dk ? `₹${formatINR(deductions[dk])}` : ""}
                    </td>
                    <td
                      style={{
                        ...cell({
                          fontSize: "10px",
                          color: "#6b7280",
                          textAlign: "right",
                        }),
                      }}
                    >
                      {dk ? `₹${formatINR(deductions[dk])}` : ""}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderTop: "2px solid #e5e7eb",
                }}
              >
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#374151",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  Gross Earnings
                </td>
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#059669",
                      textAlign: "right",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  ₹{formatINR(totalEarnings)}
                </td>
                <td
                  style={{ ...cell({ borderRight: "2px solid #d1d5db" }) }}
                ></td>
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#374151",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  Total Deductions
                </td>
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#dc2626",
                      textAlign: "right",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  ₹{formatINR(totalDeductions)}
                </td>
                <td style={{ ...cell({}) }}></td>
              </tr>
            </tbody>
          </table>
        ) : (
          // Show only Earnings
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {[
                  {
                    label: "EARNINGS",
                    align: "left",
                    borderRight: "1px solid #e5e7eb",
                    width: "50%",
                  },
                  {
                    label: "AMOUNT",
                    align: "right",
                    borderRight: "1px solid #e5e7eb",
                    width: "25%",
                  },
                  {
                    label: "YTD",
                    align: "right",
                    borderRight: "none",
                    width: "25%",
                  },
                ].map(({ label, align, borderRight, width }, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: "800",
                      textAlign: align,
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight,
                      width,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earningRows.map(([ek, el], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td
                    style={{
                      ...cell({
                        color: "#374151",
                        borderRight: "1px solid #e5e7eb",
                      }),
                    }}
                  >
                    {el}
                  </td>
                  <td
                    style={{
                      ...cell({
                        fontWeight: "700",
                        color: "#111827",
                        textAlign: "right",
                        borderRight: "1px solid #e5e7eb",
                      }),
                    }}
                  >
                    ₹{formatINR(earnings[ek])}
                  </td>
                  <td
                    style={{
                      ...cell({
                        fontSize: "10px",
                        color: "#6b7280",
                        textAlign: "right",
                      }),
                    }}
                  >
                    ₹{formatINR(earnings[ek])}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderTop: "2px solid #e5e7eb",
                }}
              >
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#374151",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  Gross Earnings
                </td>
                <td
                  style={{
                    ...cell({
                      fontWeight: "800",
                      color: "#059669",
                      textAlign: "right",
                      borderRight: "1px solid #e5e7eb",
                    }),
                  }}
                >
                  ₹{formatINR(totalEarnings)}
                </td>
                <td style={{ ...cell({}) }}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Net Payable ── */}
      <div style={{ padding: "16px 32px", borderBottom: "2px solid #e5e7eb" }}>
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #d1fae5",
            borderRadius: "8px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "#374151",
                margin: "0 0 3px 0",
              }}
            >
              TOTAL NET PAYABLE
            </p>
            <p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>
              Gross Earnings - Total Deductions
            </p>
          </div>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "900",
              color: "#059669",
              margin: 0,
            }}
          >
            ₹{formatINR(netSalary)}
          </p>
        </div>
      </div>

      {/* ── Amount in Words ── */}
      <div
        style={{
          padding: "14px 32px",
          borderBottom: "2px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "11px", color: "#374151", margin: 0 }}>
          Amount In Words:{" "}
          <span style={{ fontStyle: "italic", fontWeight: "600" }}>
            {numberToWords(netSalary)}.
          </span>
        </p>
      </div>

      {/* ── Stamp & Signature Section ── */}
      <div
        style={{ padding: "32px 32px 24px", borderBottom: "2px solid #e5e7eb" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "24px",
            alignItems: "flex-end",
          }}
        >
          {/* Authorized By */}
          <div style={{ textAlign: "center" }}>
            <img
              src="/hr_stamp_signature.png"
              alt="Authorized By Signature"
              style={{
                width: "100%",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
            <p
              style={{
                fontSize: "9px",
                color: "#6b7280",
                margin: "4px 0 0 0",
                borderTop: "1px solid #d1d5db",
                paddingTop: "4px",
              }}
            >
              Authorized By
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "16px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0 }}>
          -- This is a system-generated document. --
        </p>
      </div>
    </div>
  );
};

// ─── Form Label + Input helpers ────────────────────────────────────────────

const FieldInput = ({
  label,
  type = "number",
  placeholder,
  value,
  onChange,
}) => (
  <div>
    <label className="block text-xs text-text-muted font-medium mb-1.5">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder || "0"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary transition"
    />
  </div>
);

const StepBadge = ({
  number,
  children,
  color = "bg-text-primary text-white",
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div
      className={`w-6 h-6 rounded-full ${color} text-xs font-bold flex items-center justify-center shrink-0`}
    >
      {number}
    </div>
    <h4 className="text-sm font-semibold text-text-primary">{children}</h4>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PaySlip = ({ employees: initialEmployees = [] }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [preview, setPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".employee-search-box")) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setEmployees(initialEmployees);
      return;
    }
    const fetch = async () => {
      setSearchLoading(true);
      try {
        const { data } = await employeesApi.fetchAllEmployees({
          page: 1,
          search: debouncedSearch,
        });
        setEmployees(data.employees || []);
      } catch {
        setEmployees([]);
      } finally {
        setSearchLoading(false);
      }
    };
    fetch();
  }, [debouncedSearch, initialEmployees]);

  const earnings = {
    basicSalary: parseFloat(formData.basicSalary) || 0,
    dearness: parseFloat(formData.dearness) || 0,
    houseRent: parseFloat(formData.houseRent) || 0,
    medical: parseFloat(formData.medical) || 0,
    conveyance: parseFloat(formData.conveyance) || 0,
    cca: parseFloat(formData.cca) || 0,
    otherAllowances: parseFloat(formData.otherAllowances) || 0,
  };

  const deductions = {
    epfEmployee: parseFloat(formData.epfEmployee) || 0,
    esicEmployee: parseFloat(formData.esicEmployee) || 0,
    providentFund: parseFloat(formData.providentFund) || 0,
    incomeTax: parseFloat(formData.incomeTax) || 0,
    professionalTax: parseFloat(formData.professionalTax) || 0,
    advanceRecovery: parseFloat(formData.advanceRecovery) || 0,
    otherDeductions: parseFloat(formData.otherDeductions) || 0,
  };

  const totalEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const netSalary = totalEarnings - totalDeductions;

  const set = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleEmployeeSelect = (emp) => {
    setSelectedEmployee(emp);
    set("employeeId", emp.id);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const generatePDF = async () => {
    const element = document.getElementById("payslip-template");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(
      `PaySlip_${selectedEmployee?.employeeName}_${MONTHS[formData.month - 1]}_${formData.year}.pdf`,
    );
  };

  const handleReset = () => {
    setFormData(EMPTY_FORM);
    setSelectedEmployee(null);
    setPreview(false);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0">
          <DollarSign size={18} className="text-text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Pay Slip Generator
          </h3>
          <p className="text-xs text-text-muted">
            Create and download employee pay slips
          </p>
        </div>
      </div>

      {!preview ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm">
          <div className="p-6 space-y-6">
            {/* ── Step 1: Select Employee ── */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <StepBadge number="1">Select Employee</StepBadge>
              <div className="relative employee-search-box">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-8 pr-4 py-2.5 text-xs w-full bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                />
                {searchLoading && (
                  <Loader2
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
                  />
                )}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2
                          size={16}
                          className="text-text-muted animate-spin"
                        />
                      </div>
                    ) : employees.length > 0 ? (
                      employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleEmployeeSelect(emp)}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-background transition-colors border-b border-border last:border-b-0 flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-text-primary">
                              {emp.employeeName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {emp.employeeId} ·{" "}
                              {emp.department?.name || emp.department || "—"}
                            </p>
                          </div>
                          <Users
                            size={12}
                            className="text-text-muted group-hover:text-text-primary"
                          />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-text-muted">
                        {searchQuery.length < 2
                          ? "Type at least 2 characters to search"
                          : "No employees found"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedEmployee ? (
              <>
                {/* ── Employee confirmed banner ── */}
                <div className="bg-background rounded-lg p-4 border-2 border-holiday-bg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-holiday-bg text-holiday-text text-xs font-bold flex items-center justify-center">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-holiday-text">
                      Employee Selected
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["Employee Name", selectedEmployee.employeeName],
                      ["Employee ID", selectedEmployee.employeeId],
                      [
                        "Department",
                        selectedEmployee.department?.name ||
                          selectedEmployee.department ||
                          "—",
                      ],
                      [
                        "Designation",
                        selectedEmployee.designation?.name ||
                          selectedEmployee.designation ||
                          "—",
                      ],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-text-muted font-medium">
                          {label}
                        </p>
                        <p className="text-sm font-semibold text-text-primary mt-1">
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Step 2: Month & Year ── */}
                <div>
                  <StepBadge number="2">Select Month & Year</StepBadge>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted font-medium mb-1.5">
                        Month
                      </label>
                      <select
                        value={formData.month}
                        onChange={(e) => set("month", parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition appearance-none"
                      >
                        {MONTHS.map((m, i) => (
                          <option key={i + 1} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted font-medium mb-1.5">
                        Year
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => set("year", parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition appearance-none"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Step 3: Additional Details ── */}
                <div>
                  <StepBadge number="3">Additional Details</StepBadge>
                  <div className="bg-background rounded-lg p-4 border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted font-medium mb-1.5">
                        Pay Date
                      </label>
                      <input
                        type="date"
                        value={formData.payDate}
                        onChange={(e) => set("payDate", e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                      />
                    </div>
                    <FieldInput
                      label="Bank Account No"
                      type="text"
                      placeholder="e.g. 920010020188762"
                      value={formData.bankAccountNo}
                      onChange={(v) => set("bankAccountNo", v)}
                    />
                    <FieldInput
                      label="Paid Days"
                      placeholder="e.g. 31"
                      value={formData.paidDays}
                      onChange={(v) => set("paidDays", v)}
                    />
                    <FieldInput
                      label="LOP Days (Loss of Pay)"
                      placeholder="0"
                      value={formData.lopDays}
                      onChange={(v) => set("lopDays", v)}
                    />
                  </div>
                </div>

                {/* ── Step 4: Earnings ── */}
                <div>
                  <StepBadge
                    number={<Plus size={13} />}
                    color="bg-present-bg text-present-text"
                  >
                    Enter Earnings
                  </StepBadge>
                  <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(EARNING_LABELS).map(([key, label]) => (
                        <FieldInput
                          key={key}
                          label={label}
                          value={formData[key]}
                          onChange={(v) => set(key, v)}
                        />
                      ))}
                    </div>
                    <div className="bg-present-bg rounded-lg p-3 mt-3 flex items-center justify-between">
                      <p className="text-xs text-text-muted font-medium">
                        Total Earnings
                      </p>
                      <p className="text-lg font-bold text-present-text">
                        ₹{formatINR(totalEarnings)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Step 5: Deductions ── */}
                <div>
                  <StepBadge
                    number={<Minus size={13} />}
                    color="bg-absent-bg text-absent-text"
                  >
                    Enter Deductions
                  </StepBadge>
                  <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(DEDUCTION_LABELS).map(([key, label]) => (
                        <FieldInput
                          key={key}
                          label={label}
                          value={formData[key]}
                          onChange={(v) => set(key, v)}
                        />
                      ))}
                    </div>
                    <div className="bg-absent-bg rounded-lg p-3 mt-3 flex items-center justify-between">
                      <p className="text-xs text-text-muted font-medium">
                        Total Deductions
                      </p>
                      <p className="text-lg font-bold text-absent-text">
                        ₹{formatINR(totalDeductions)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Net Salary Summary ── */}
                <div className="bg-present-bg rounded-lg p-4 border-2 border-present-dot">
                  <p className="text-xs text-present-text font-semibold mb-3">
                    NET SALARY SUMMARY
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">
                        Total Earnings
                      </p>
                      <p className="text-base font-bold text-present-text mt-1">
                        ₹{formatINR(totalEarnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">
                        Total Deductions
                      </p>
                      <p className="text-base font-bold text-absent-text mt-1">
                        ₹{formatINR(totalDeductions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">
                        Net Salary
                      </p>
                      <p className="text-lg font-bold text-present-text mt-1">
                        ₹{formatINR(netSalary)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setPreview(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.85")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Download size={13} />
                    Preview & Download
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <Users
                    size={32}
                    className="text-text-muted mx-auto mb-3 opacity-50"
                  />
                  <p className="text-sm text-text-secondary mb-1">
                    Select an employee to start
                  </p>
                  <p className="text-xs text-text-muted">
                    Choose from the dropdown above to continue
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Payslip Preview ── */}
          <div className="overflow-x-auto mb-5 w-full max-w-fit m-auto rounded-xl border border-border shadow-sm">
            <PayslipTemplate
              formData={formData}
              selectedEmployee={selectedEmployee}
              totalEarnings={totalEarnings}
              totalDeductions={totalDeductions}
              netSalary={netSalary}
              earnings={earnings}
              deductions={deductions}
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setPreview(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Download size={13} />
              Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaySlip;
