import { type ExamResult } from "@/lib/storage";
import { getSchoolSettings, brandedPrintHeader, brandedPrintFooter } from "@/lib/printBranding";

interface ReportCardProps {
  result: ExamResult;
  position: number;
  totalInClass: number;
  nhisNumber?: string;
}

export function printReportCard({ result, position, totalInClass, nhisNumber }: ReportCardProps, returnHtml = false) {
  const settings = getSchoolSettings();

  const styles = `
  * { box-sizing: border-box; }
  body{font-family:'Segoe UI', Tahoma, sans-serif;margin:0;padding:0;color:#333;}
  .report-card{border:2px solid #1B1464; padding:25px; border-radius:0; position:relative; overflow:hidden; display: flex; flex-direction: column; min-height: 100vh;}
  .watermark{position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:100px; color:rgba(27, 20, 100, 0.01); font-weight:bold; pointer-events:none; white-space:nowrap; text-transform:uppercase;}
  .info-grid{display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:15px; border:1px solid #eee; padding:12px; border-radius:8px; background:#fcfcfc;}
  .info-item{display:flex; flex-direction:column; gap:2px;}
  .info-item span{font-size:8px; color:#666; text-transform:uppercase; letter-spacing:0.5px;}
  .info-item strong{font-size:13px; color:#1B1464;}
  table{width:100%; border-collapse:collapse; margin-bottom:15px; flex-grow: 1;}
  th{background:#1B1464; color:white; padding:8px 12px; text-align:left; font-size:10px; text-transform:uppercase; border:1px solid #1B1464;}
  td{padding:6px 12px; border:1px solid #eee; font-size:12px; color:#444;}
  tr:nth-child(even){background:#f9f9f9;}
  .summary-grid{display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:15px;}
  .summary-card{border:1px solid #eee; padding:10px; border-radius:8px; text-align:center; background: #fafafa;}
  .summary-card span{display:block; font-size:8px; color:#666; margin-bottom:2px;}
  .summary-card strong{display:block; font-size:16px; color:#1B1464;}
  .remark-box{border-left:4px solid #D81B8C; background:#fff5f9; padding:12px; border-radius:0 8px 8px 0; margin-bottom:15px;}
  .remark-box h4{margin:0 0 4px; font-size:10px; color:#D81B8C; text-transform:uppercase;}
  .remark-box p{margin:0; font-size:13px; color:#333; font-style:italic;}
  .grading-key{display: flex; gap: 12px; font-size: 8px; color: #666; margin-bottom: 20px; padding: 8px; border-top: 1px dashed #eee; justify-content: center;}
  .grading-key span{font-weight: bold; color: #1B1464;}
  @media print {
    body { padding:0; margin:0; }
    .report-card { border:2px solid #1B1464; height: 100vh; width: 100%; padding: 30px; margin: 0; page-break-after: always; }
    @page { margin: 5mm; size: A4 portrait; }
    .no-break { page-break-inside: avoid; }
    .watermark { opacity: 0.05; }
  }
  `;

  function posLabel(n: number) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  function grade(score: number) {
    const scale = settings.gradingScales?.find(s => score >= s.minScore);
    return scale ? scale.grade : "F9";
  }

  function getRemark(score: number) {
    const scale = settings.gradingScales?.find(s => score >= s.minScore);
    return scale ? scale.remark : "Fail";
  }

  const content = `
<div class="report-card">
  <div class="watermark">OFFICIAL REPORT</div>
  ${brandedPrintHeader("PROGRESSIVE TERMINAL REPORT")}
  
  <div class="info-grid no-break">
    <div class="info-item"><span>Student Name</span><strong>${result.studentName}</strong></div>
    <div class="info-item"><span>Class / Level</span><strong>${result.class}</strong></div>
    <div class="info-item"><span>Student ID</span><strong>#${result.studentId.toUpperCase().substring(0, 8)}</strong></div>
    <div class="info-item"><span>Academic Year</span><strong>${settings.academicYear || "2025/2026"}</strong></div>
    <div class="info-item"><span>Academic Term</span><strong>${result.term}</strong></div>
    <div class="info-item"><span>NHIS Number</span><strong>${nhisNumber || "N/A"}</strong></div>
    <div class="info-item"><span>Attendance Rate</span><strong>98%</strong></div>
  </div>

  <table class="no-break">
    <thead><tr>
      <th style="width:40px">#</th>
      <th>Subject Area</th>
      <th style="text-align:center;width:80px">Class (${settings.classWorkWeight || 50}%)</th>
      <th style="text-align:center;width:80px">Exam (${settings.examWeight || 50}%)</th>
      <th style="text-align:center;width:80px">Total</th>
      <th style="text-align:center;width:60px">Grade</th>
      <th style="width:120px">Remarks</th>
    </tr></thead>
    <tbody>
      ${result.subjects.map((s, i) => `<tr>
        <td>${i + 1}</td>
        <td style="font-weight:500">${s.name}</td>
        <td style="text-align:center">${s.classScore}</td>
        <td style="text-align:center">${s.examScore}</td>
        <td style="text-align:center; font-weight:600">${s.total}</td>
        <td style="text-align:center; font-weight:bold; color:${s.total >= 80 ? '#00b894' : s.total < 40 ? '#d63031' : '#333'}">${s.grade}</td>
        <td style="font-size:11px; color:#666">${s.remark}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="summary-grid no-break">
    <div class="summary-card"><span>Total Score</span><strong>${result.totalScore}</strong></div>
    <div class="summary-card"><span>Average</span><strong>${result.average}%</strong></div>
    <div class="summary-card"><span>Position</span><strong>${posLabel(position)} / ${totalInClass}</strong></div>
    <div class="summary-card"><span>Final Grade</span><strong>${grade(result.average)}</strong></div>
  </div>

  <div class="remark-box no-break">
    <h4>Class Teacher's Remarks</h4>
    <p>${getRemark(result.average)}</p>
  </div>

  <div class="grading-key no-break" style="flex-wrap:wrap">
    ${(settings.gradingScales || []).map(s => `<div><span>${s.minScore}+:</span> ${s.grade} (${s.remark})</div>`).join("")}
  </div>

  <div class="no-break" style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-top:50px;">
     <div style="text-align:center; border-top:1px solid #ccc; padding-top:15px;">
        <p style="margin:0; font-size:10px; color:#666; text-transform:uppercase;">Class Teacher Signature</p>
     </div>
     <div style="text-align:center; border-top:1px solid #ccc; padding-top:15px;">
        <p style="margin:0; font-size:10px; color:#666; text-transform:uppercase;">Principal's Endorsement</p>
     </div>
  </div>

  <div style="margin-top:auto">
    ${brandedPrintFooter()}
  </div>
</div>`;

  if (returnHtml) return content;

  const html = `<!DOCTYPE html><html><head><title>Report Card - ${result.studentName}</title><style>${styles}</style></head><body>${content}</body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
