import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSchoolSettings } from "./printBranding";

const PRIMARY: [number, number, number] = [4, 132, 75]; // #04844B

function header(doc: jsPDF, title: string) {
  const settings = getSchoolSettings();
  const schoolName = settings.name || "Mujahideen Preparatory School";
  const schoolMotto = settings.motto || "God Fearing and Better Future Starts Here";
  const schoolLocation = settings.location || "Mankessim, Central Region, Ghana";

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, 14, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(schoolMotto, 14, 15);
  doc.text(schoolLocation, 14, 19);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 32);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  const settings = getSchoolSettings();
  const schoolContact = `${settings.phone ? settings.phone + "  •  " : ""}${settings.email || "info@mujahideenprep.edu.gh"}`;
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(schoolContact, 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }
}

export interface ReportCardData {
  studentName: string;
  studentClass: string;
  term?: string;
  academicYear?: string;
  nhisNumber?: string;
  attendanceRate?: string;
  position?: number;
  totalInClass?: number;
  results: {
    subject: string;
    classScore?: number;
    examScore?: number;
    total: number;
    grade: string;
    remarks?: string;
  }[];
  teacherRemarks?: string;
}

function formatPosition(n?: number) {
  if (!n) return "—";
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export function generateReportCard(d: ReportCardData) {
  const doc = new jsPDF();
  header(doc, "Student Progress Report Card");
  
  let y = 46;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT PROFILE", 14, y);
  doc.line(14, y + 2, 196, y + 2);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Student Name: ${d.studentName}`, 14, y);
  doc.text(`Class / Level: ${d.studentClass}`, 110, y);
  
  y += 6;
  doc.text(`Term: ${d.term || "—"}`, 14, y);
  doc.text(`Academic Year: ${d.academicYear || "—"}`, 110, y);
  
  y += 6;
  doc.text(`NHIS Number: ${d.nhisNumber || "N/A"}`, 14, y);
  doc.text(`Attendance Rate: ${d.attendanceRate || "98%"}`, 110, y);
  
  y += 6;
  const posText = d.position ? `${formatPosition(d.position)} / ${d.totalInClass || "—"}` : "—";
  doc.text(`Class Position: ${posText}`, 14, y);

  autoTable(doc, {
    startY: y + 6,
    head: [["Subject Area", "Class (40%)", "Exam (60%)", "Total", "Grade", "Remarks"]],
    body: d.results.map((r) => [
      r.subject,
      r.classScore !== undefined ? String(r.classScore) : "—",
      r.examScore !== undefined ? String(r.examScore) : "—",
      String(r.total),
      r.grade,
      r.remarks || ""
    ]),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9 },
  });

  const total = d.results.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const avg = d.results.length ? (total / d.results.length).toFixed(1) : "—";
  
  // @ts-ignore
  let yEnd = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Score: ${total}       Average: ${avg}%`, 14, yEnd);
  
  if (d.teacherRemarks) {
    yEnd += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Teacher's Remarks:", 14, yEnd);
    doc.setFont("helvetica", "italic");
    doc.text(doc.splitTextToSize(d.teacherRemarks, 180), 14, yEnd + 5);
    // @ts-ignore
    yEnd += doc.splitTextToSize(d.teacherRemarks, 180).length * 5 + 5;
  }
  
  // Draw signature lines
  let ySign = yEnd + 20;
  if (ySign > 265) {
    doc.addPage();
    ySign = 40;
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(14, ySign, 90, ySign);
  doc.line(120, ySign, 196, ySign);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("CLASS TEACHER SIGNATURE", 14, ySign + 5);
  doc.text("PRINCIPAL'S ENDORSEMENT", 120, ySign + 5);

  footer(doc);
  doc.save(`Report-Card_${d.studentName.replace(/\s+/g, "_")}.pdf`);
}

export interface FeeStatementData {
  studentName: string;
  studentClass: string;
  totalFee: number;
  payments: { date: string; amount: number; description?: string; receipt?: string }[];
}

export function generateFeeStatement(d: FeeStatementData) {
  const doc = new jsPDF();
  header(doc, "Fee Statement");
  let y = 46;
  doc.setFontSize(10);
  doc.text(`Student: ${d.studentName}`, 14, y);
  doc.text(`Class: ${d.studentClass}`, 110, y);

  autoTable(doc, {
    startY: y + 6,
    head: [["Date", "Receipt #", "Description", "Amount (₵)"]],
    body: d.payments.map((p) => [p.date, p.receipt || "—", p.description || "Payment", p.amount.toFixed(2)]),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9 },
  });

  const paid = d.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = d.totalFee - paid;
  // @ts-ignore
  const yEnd = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total Fee:        ₵ ${d.totalFee.toFixed(2)}`, 130, yEnd);
  doc.text(`Total Paid:       ₵ ${paid.toFixed(2)}`, 130, yEnd + 6);
  doc.setFont("helvetica", "bold");
  const c: [number, number, number] = balance > 0 ? [200, 30, 30] : [4, 132, 75];
  doc.setTextColor(c[0], c[1], c[2]);
  doc.text(`Balance:          ₵ ${balance.toFixed(2)}`, 130, yEnd + 12);

  footer(doc);
  doc.save(`Fee-Statement_${d.studentName.replace(/\s+/g, "_")}.pdf`);
}

export interface AttendanceSummaryData {
  className: string;
  fromDate: string;
  toDate: string;
  rows: { studentName: string; present: number; absent: number; total: number }[];
}

export function generateAttendanceSummary(d: AttendanceSummaryData) {
  const doc = new jsPDF();
  header(doc, "Class Attendance Summary");
  let y = 46;
  doc.setFontSize(10);
  doc.text(`Class: ${d.className}`, 14, y);
  doc.text(`Period: ${d.fromDate} to ${d.toDate}`, 110, y);

  autoTable(doc, {
    startY: y + 6,
    head: [["Student", "Present", "Absent", "Total", "Rate"]],
    body: d.rows.map((r) => [
      r.studentName,
      String(r.present),
      String(r.absent),
      String(r.total),
      r.total ? `${Math.round((r.present / r.total) * 100)}%` : "—",
    ]),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9 },
  });

  footer(doc);
  doc.save(`Attendance-Summary_${d.className.replace(/\s+/g, "_")}.pdf`);
}

export interface ClassListData {
  className: string;
  students: { name: string; gender: string; guardian: string; phone: string; status: string }[];
}

export function generateClassList(d: ClassListData) {
  const doc = new jsPDF();
  header(doc, `Class List — ${d.className}`);
  autoTable(doc, {
    startY: 46,
    head: [["#", "Name", "Gender", "Guardian", "Phone", "Status"]],
    body: d.students.map((s, i) => [String(i + 1), s.name, s.gender, s.guardian, s.phone, s.status]),
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9 },
  });
  footer(doc);
  doc.save(`Class-List_${d.className.replace(/\s+/g, "_")}.pdf`);
}