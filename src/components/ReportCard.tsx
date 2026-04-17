import { type ExamResult } from "@/lib/storage";
import { getSchoolSettings, brandedPrintHeader, brandedPrintFooter } from "@/lib/printBranding";

interface ReportCardProps {
  result: ExamResult;
  position: number;
  totalInClass: number;
}

export function printReportCard({ result, position, totalInClass }: ReportCardProps) {
  const settings = getSchoolSettings();

  function posLabel(n: number) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  function grade(score: number) {
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    if (score >= 40) return "E";
    return "F";
  }

  function remark(avg: number) {
    if (avg >= 80) return "Excellent Performance! Keep it up.";
    if (avg >= 70) return "Very Good. Well done.";
    if (avg >= 60) return "Good. Can do better.";
    if (avg >= 50) return "Satisfactory. More effort needed.";
    if (avg >= 40) return "Below Average. Needs improvement.";
    return "Failing. Serious attention required.";
  }

  const html = `<!DOCTYPE html>
<html><head><title>Report Card - ${result.studentName}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1B1464;max-width:780px;margin:0 auto}
  .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;flex-wrap:wrap;gap:12px}
  .info div{flex:1;min-width:220px}
  .info strong{color:#04844B}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th,td{border:1px solid #ccc;padding:8px 12px;text-align:left;font-size:13px}
  th{background:#04844B;color:white}
  .summary{background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:15px}
  .summary p{margin:4px 0;font-size:13px}
  .remark{background:#04844B;color:white;padding:12px;border-radius:8px;font-size:13px}
  @media print{body{padding:15px}@page{margin:10mm}}
</style></head><body>
${brandedPrintHeader("TERMINAL REPORT CARD")}
<div class="info">
  <div><p><strong>Student:</strong> ${result.studentName}</p><p><strong>Class:</strong> ${result.class}</p></div>
  <div><p><strong>Term:</strong> ${result.term}</p><p><strong>Academic Year:</strong> ${settings.academicYear}</p></div>
</div>
<table>
  <thead><tr><th>#</th><th>Subject</th><th>Score (100)</th><th>Grade</th></tr></thead>
  <tbody>
    ${result.subjects.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.score}</td><td>${grade(s.score)}</td></tr>`).join("")}
  </tbody>
</table>
<div class="summary">
  <p><strong>Total Score:</strong> ${result.total} / ${result.subjects.length * 100}</p>
  <p><strong>Average:</strong> ${result.average}%</p>
  <p><strong>Position:</strong> ${posLabel(position)} out of ${totalInClass}</p>
  <p><strong>Overall Grade:</strong> ${grade(result.average)}</p>
</div>
<div class="remark"><strong>Teacher's Remark:</strong> ${remark(result.average)}</div>
${brandedPrintFooter()}
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
