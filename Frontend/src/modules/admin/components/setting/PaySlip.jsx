import React, { useState, useEffect } from "react";
import { Download, Users, DollarSign, Minus, Plus, Search, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useDebounce from "../../../../shared/hooks/useDebounce.js";
import { employeesApi } from "../../api/employeesApi.js";

const PaySlip = ({ employees: initialEmployees = [] }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    dearness: "",
    houseRent: "",
    medical: "",
    conveyance: "",
    otherAllowances: "",
    providentFund: "",
    incomeTax: "",
    professionalTax: "",
    otherDeductions: "",
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [preview, setPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".employee-search-box")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch employees based on search
  useEffect(() => {
    if (!debouncedSearch && initialEmployees.length > 0) {
      // If search is empty and we have initial employees, show them
      setEmployees(initialEmployees);
      return;
    }

    if (debouncedSearch.length < 2) {
      // Show initial employees if search is too short
      setEmployees(initialEmployees);
      return;
    }

    const fetchSearchResults = async () => {
      setSearchLoading(true);
      try {
        const { data } = await employeesApi.fetchAllEmployees({page: 1, search: debouncedSearch});
        const results = data.employees || [];
        setEmployees(results);
      } catch (error) {
        console.error("Error searching employees:", error);
        setEmployees([]);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch, initialEmployees]);

  // Calculate totals
  const earnings = {
    basicSalary: parseFloat(formData.basicSalary) || 0,
    dearness: parseFloat(formData.dearness) || 0,
    houseRent: parseFloat(formData.houseRent) || 0,
    medical: parseFloat(formData.medical) || 0,
    conveyance: parseFloat(formData.conveyance) || 0,
    otherAllowances: parseFloat(formData.otherAllowances) || 0,
  };

  const deductions = {
    providentFund: parseFloat(formData.providentFund) || 0,
    incomeTax: parseFloat(formData.incomeTax) || 0,
    professionalTax: parseFloat(formData.professionalTax) || 0,
    otherDeductions: parseFloat(formData.otherDeductions) || 0,
  };

  const totalEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const netSalary = totalEarnings - totalDeductions;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmployeeSelect = (empId) => {
    if (!empId) {
      setSelectedEmployee(null);
      setFormData((prev) => ({
        ...prev,
        employeeId: "",
      }));
      return;
    }

    const emp = employees.find((e) => String(e.id) === String(empId));
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: empId,
      }));
      setSelectedEmployee(emp);
    } else {
      console.warn("Employee not found:", empId);
      setSelectedEmployee(null);
    }
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

    const fileName = `PaySlip_${selectedEmployee?.employeeName}_${formData.month}_${formData.year}.pdf`;
    pdf.save(fileName);
  };

  const handleReset = () => {
    setFormData({
      employeeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: "",
      dearness: "",
      houseRent: "",
      medical: "",
      conveyance: "",
      otherAllowances: "",
      providentFund: "",
      incomeTax: "",
      professionalTax: "",
      otherDeductions: "",
    });
    setSelectedEmployee(null);
    setPreview(false);
  };

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

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
          <h3 className="text-lg font-semibold text-text-primary">Pay Slip Generator</h3>
          <p className="text-xs text-text-muted">Create and download employee pay slips</p>
        </div>
      </div>

      {!preview ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm">
          {/* Form Section */}
          <div className="p-6 border-b border-border space-y-6">
            {/* Step 1: Employee Selection */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-text-primary text-white text-xs font-bold">
                  1
                </div>
                <h4 className="text-sm font-semibold text-text-primary">Select Employee</h4>
              </div>
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
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />
                )}

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={16} className="text-text-muted animate-spin" />
                      </div>
                    ) : employees.length > 0 ? (
                      employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            handleEmployeeSelect(emp.id);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-background transition-colors border-b border-border last:border-b-0 flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-text-primary">{emp.employeeName}</p>
                            <p className="text-xs text-text-muted">{emp.employeeId} • {emp.department?.name || emp.department || "—"}</p>
                          </div>
                          <Users size={12} className="text-text-muted group-hover:text-text-primary" />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-text-muted">
                        {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No employees found"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedEmployee ? (
              <>
                {/* Step 2: Employee Info Display */}
                <div className="bg-background rounded-lg p-4 border-holiday-bg border-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-holiday-bg text-holiday-text text-xs font-bold">
                      ✓
                    </div>
                    <h4 className="text-sm font-semibold text-holiday-text">Employee Selected</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted font-medium">Employee Name</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {selectedEmployee.employeeName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-medium">Employee ID</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {selectedEmployee.employeeId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-medium">Department</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {selectedEmployee.department?.name || selectedEmployee.department || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-medium">Designation</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {selectedEmployee.designation?.name || selectedEmployee.designation || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Month & Year Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-text-primary text-white text-xs font-bold">
                      2
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Select Month & Year</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted font-medium mb-1.5">
                        Month
                      </label>
                      <select
                        value={formData.month}
                        onChange={(e) => handleInputChange("month", parseInt(e.target.value))}
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
                        onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
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

                {/* Step 4: Earnings Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-present-bg text-present-text text-xs font-bold">
                      <Plus size={14} />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Enter Earnings</h4>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries({
                        basicSalary: "Basic Salary",
                        dearness: "Dearness Allowance",
                        houseRent: "House Rent Allowance",
                        medical: "Medical Allowance",
                        conveyance: "Conveyance Allowance",
                        otherAllowances: "Other Allowances",
                      }).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-xs text-text-muted font-medium mb-1.5">
                            {label}
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={formData[key]}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="bg-present-bg rounded-lg p-3 mt-3">
                      <p className="text-xs text-text-muted font-medium">Total Earnings</p>
                      <p className="text-lg font-bold text-present-text mt-1">
                        ₹{totalEarnings.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 5: Deductions Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-absent-bg text-absent-text text-xs font-bold">
                      <Minus size={14} />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Enter Deductions</h4>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries({
                        providentFund: "Provident Fund (PF)",
                        incomeTax: "Income Tax",
                        professionalTax: "Professional Tax",
                        otherDeductions: "Other Deductions",
                      }).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-xs text-text-muted font-medium mb-1.5">
                            {label}
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={formData[key]}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary transition"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="bg-absent-bg rounded-lg p-3 mt-3">
                      <p className="text-xs text-text-muted font-medium">Total Deductions</p>
                      <p className="text-lg font-bold text-absent-text mt-1">
                        ₹{totalDeductions.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Net Salary Summary */}
                <div className="bg-present-bg rounded-lg p-4 border-present-dot border-2">
                  <p className="text-xs text-present-text font-semibold mb-2">NET SALARY SUMMARY</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">Total Earnings</p>
                      <p className="text-base font-bold text-present-text mt-1">
                        ₹{totalEarnings.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">Total Deductions</p>
                      <p className="text-base font-bold text-absent-text mt-1">
                        ₹{totalDeductions.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-present-text/70 font-medium">Net Salary</p>
                      <p className="text-lg font-bold text-present-text mt-1">
                        ₹{netSalary.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setPreview(true)}
                    disabled={!selectedEmployee}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
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
                  <Users size={32} className="text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-text-secondary mb-1">Select an employee to start</p>
                  <p className="text-xs text-text-muted">Choose from the dropdown above to continue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div
            id="payslip-template"
            className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-text-primary/5 to-text-primary/10 px-8 py-8 border-b border-border">
              <h1 className="text-2xl font-bold text-text-primary">PAY SLIP</h1>
              <p className="text-xs text-text-muted mt-1">
                {MONTHS[formData.month - 1]} {formData.year}
              </p>
            </div>

            {/* Employee Info */}
            <div className="p-8 border-b border-border">
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-xs text-text-muted font-medium">Employee Name</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {selectedEmployee?.employeeName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Employee ID</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {selectedEmployee?.employeeId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Department</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {selectedEmployee?.department?.name ||
                      selectedEmployee?.department ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Designation</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {selectedEmployee?.designation?.name ||
                      selectedEmployee?.designation ||
                      "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="p-8 border-b border-border">
              <div className="grid grid-cols-2 gap-12">
                {/* Earnings */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Plus size={14} /> EARNINGS
                  </h3>
                  <div className="space-y-2">
                    {Object.entries({
                      basicSalary: "Basic Salary",
                      dearness: "Dearness Allowance",
                      houseRent: "House Rent Allowance",
                      medical: "Medical Allowance",
                      conveyance: "Conveyance Allowance",
                      otherAllowances: "Other Allowances",
                    }).map(([key, label]) => (
                      earnings[key] > 0 && (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-text-secondary">{label}</span>
                          <span className="font-medium text-text-primary">
                            ₹{earnings[key].toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Total</span>
                    <span className="text-sm font-bold text-present-text">
                      ₹{totalEarnings.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Minus size={14} /> DEDUCTIONS
                  </h3>
                  <div className="space-y-2">
                    {Object.entries({
                      providentFund: "Provident Fund (PF)",
                      incomeTax: "Income Tax",
                      professionalTax: "Professional Tax",
                      otherDeductions: "Other Deductions",
                    }).map(([key, label]) => (
                      deductions[key] > 0 && (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-text-secondary">{label}</span>
                          <span className="font-medium text-text-primary">
                            ₹{deductions[key].toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Total</span>
                    <span className="text-sm font-bold text-absent-text">
                      ₹{totalDeductions.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="p-8 bg-background">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-primary">NET SALARY PAYABLE</span>
                <span className="text-2xl font-bold text-present-text">
                  ₹{netSalary.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setPreview(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text-secondary hover:bg-background transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
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
