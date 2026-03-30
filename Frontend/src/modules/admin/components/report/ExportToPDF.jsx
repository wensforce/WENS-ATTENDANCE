import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

const ExportToPDF = async (data, month, year) => {
    
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

  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    const monthLabel = MONTHS.find((m) => m.value === month)?.label || "Month";
    const title = `Monthly Report - ${monthLabel} ${year}`;
    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, 15, { align: "center" });

    // Add metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Total Employees: ${data.length}`, 14, 25);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    pdf.setTextColor(0);

    // Add table
    autoTable(pdf, {
      head: [
        [
          "Employee Name",
          "ID",
          "Department",
          "Designation",
          "Working Days",
          "Total Hours",
          "Late Check-ins",
          "OT / UT",
        ],
      ],
      body: data.map((emp) => [
        emp.employeeName || "—",
        emp.employeeId || "—",
        emp.department || "—",
        emp.designation || "—",
        emp.workingDays || "0/0",
        emp.totalWorkingHours || "0 hrs",
        emp.lateCheckin?.toString() || "0",
        emp.overTimeUndertime || "0 hrs",
      ]),
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [13, 27, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    const filename = `Monthly_Report_${monthLabel}_${year}.pdf`;
    pdf.save(filename);

    toast.success("PDF file downloaded successfully");
  } catch (err) {
    console.error("Error exporting to PDF:", err);
    toast.error("Failed to export PDF file");
  }
};

export default ExportToPDF;
