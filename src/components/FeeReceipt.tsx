import { type Payment, type SchoolSettings, defaultSettings, KEYS } from "@/lib/storage";
import logoImg from "@/assets/logo.png";

export function printFeeReceipt(payment: Payment) {
  let settings: SchoolSettings;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    settings = raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    settings = defaultSettings;
  }

  const balance = payment.totalFee - payment.amountPaid;

  const html = `<!DOCTYPE html>
<html><head><title>Fee Receipt - ${payment.studentName}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1B1464;max-width:600px;margin:0 auto}
  .header{text-align:center;border-bottom:3px solid #D81B8C;padding-bottom:12px;margin-bottom:20px}
  .header img{width:60px;height:60px;border-radius:50%}
  .header h1{margin:5px 0;font-size:18px}
  .header p{margin:2px 0;font-size:11px;color:#555}
  .title{text-align:center;font-weight:bold;color:#D81B8C;margin-bottom:20px;font-size:16px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}
  .row strong{color:#1B1464}
  .total{background:#1B1464;color:white;padding:12px;border-radius:8px;margin-top:15px;text-align:center;font-size:14px}
  .footer{text-align:center;margin-top:30px;font-size:10px;color:#888}
  @media print{body{padding:10px}@page{margin:10mm}}
</style></head><body>
<div class="header">
  <img src="${logoImg}" alt="Logo" />
  <h1>${settings.name}</h1>
  <p>${settings.location} | ${settings.phone}</p>
</div>
<div class="title">OFFICIAL FEE RECEIPT</div>
<div class="row"><span>Receipt No:</span><strong>${payment.id.toUpperCase()}</strong></div>
<div class="row"><span>Date:</span><strong>${payment.date || "N/A"}</strong></div>
<div class="row"><span>Student Name:</span><strong>${payment.studentName}</strong></div>
<div class="row"><span>Class:</span><strong>${payment.class}</strong></div>
<div class="row"><span>Description:</span><strong>${payment.description || "Tuition"}</strong></div>
<div class="row"><span>Total Fee:</span><strong>₵ ${payment.totalFee.toLocaleString()}</strong></div>
<div class="row"><span>Amount Paid:</span><strong>₵ ${payment.amountPaid.toLocaleString()}</strong></div>
<div class="row"><span>Balance:</span><strong style="color:${balance > 0 ? "#e53e3e" : "#38a169"}">₵ ${balance.toLocaleString()}</strong></div>
<div class="total">Amount Paid: ₵ ${payment.amountPaid.toLocaleString()}</div>
<div class="footer">
  <p>This is a computer-generated receipt.</p>
  <p>${settings.name} • ${settings.academicYear}</p>
</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
