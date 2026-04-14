import { type ExamResult, type SchoolSettings, defaultSettings, KEYS } from "@/lib/storage";
import logoImg from "@/assets/logo.png";

interface ReportCardProps {
  result: ExamResult;
  position: number;
  totalInClass: number;
}

export function printReportCard({ result, position, totalInClass }: ReportCardProps) {
  let settings: SchoolSettings;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    settings = raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    settings = defaultSettings;
  }

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
  body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1B1464}
  .header{text-align:center;border-bottom:3px solid #D81B8C;padding-bottom:15px;margin-bottom:20px}
  .header img{width:70px;height:70px;border-radius:50%}
  .header h1{margin:5px 0;font-size:20px;color:#1B1464}
  .header p{margin:2px 0;font-size:12px;color:#555}
  .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}
  .info div{flex:1}
  .info strong{color:#1B1464}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th,td{border:1px solid #ccc;padding:8px 12px;text-align:left;font-size:13px}
  th{background:#1B1464;color:white}
  .summary{background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:15px}
  .summary p{margin:4px 0;font-size:13px}
  .remark{background:#D81B8C;color:white;padding:12px;border-radius:8px;font-size:13px}
  .footer{text-align:center;margin-top:30px;font-size:11px;color:#888}
  @media print{body{padding:15px}@page{margin:10mm}}
</style></head><body>
<div class="header">
  <img src="${logoImg}" alt="Logo" />
  <h1>${settings.name}</h1>
  <p>${settings.motto}</p>
  <p>${settings.location} | ${settings.phone}</p>
  <p style="font-weight:bold;margin-top:8px;color:#D81B8C">TERMINAL REPORT CARD</p>
</div>
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
<div class="footer"><p>${settings.name} • ${settings.academicYear} • ${result.term}</p></div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
