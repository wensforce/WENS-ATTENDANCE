import { toast } from "react-toastify";

const ExportToExcel = async (data, month, year) => {
  try {

    const MONTHS = [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

    // Dynamically import XLSX library
    const XLSX = await import("xlsx");

    const worksheetData = [
      [
        `Monthly Report - ${MONTHS.find((m) => m.value === month)?.label || "Month"} ${year}`,
      ],
      [],
      [
        "Employee Name",
        "Employee ID",
        "Department",
        "Designation",
        "Working Days",
        "Total Working Hours",
        "Late Check-ins",
        "Overtime / Undertime",
      ],
    ];

    data.forEach((emp) => {
      worksheetData.push([
        emp.employeeName || "—",
        emp.employeeId || "—",
        emp.department || "—",
        emp.designation || "—",
        emp.workingDays || "0/0",
        emp.totalWorkingHours || "0 hrs",
        emp.lateCheckin || 0,
        emp.overTimeUndertime || "0 hrs",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const filename = `Monthly_Report_${MONTHS.find((m) => m.value === month)?.label || "Month"}_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);

    toast.success("Excel file downloaded successfully");
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    toast.error("Failed to export Excel file");
  }
};

export default ExportToExcel