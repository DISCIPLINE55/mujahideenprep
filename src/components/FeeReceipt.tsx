import { type Payment } from "@/lib/storage";
import { brandedPrintHeader, brandedPrintFooter } from "@/lib/printBranding";

export function printFeeReceipt(payment: Payment) {
  const balance = payment.totalFee - payment.amountPaid;

  const html = `<!DOCTYPE html>
<html><head><title>Fee Receipt - ${payment.studentName}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1B1464;max-width:600px;margin:0 auto}
  .title{text-align:center;font-weight:bold;color:#04844B;margin-bottom:20px;font-size:16px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}
  .row strong{color:#1B1464}
  .total{background:#04844B;color:white;padding:12px;border-radius:8px;margin-top:15px;text-align:center;font-size:14px}
  @media print{body{padding:10px}@page{margin:10mm}}
</style></head><body>
${brandedPrintHeader("OFFICIAL FEE RECEIPT")}
<div class="row"><span>Receipt No:</span><strong>${payment.id.toUpperCase()}</strong></div>
<div class="row"><span>Date:</span><strong>${payment.date || "N/A"}</strong></div>
<div class="row"><span>Student Name:</span><strong>${payment.studentName}</strong></div>
<div class="row"><span>Class:</span><strong>${payment.class}</strong></div>
<div class="row"><span>Description:</span><strong>${payment.description || "Tuition"}</strong></div>
<div class="row"><span>Total Fee:</span><strong>₵ ${payment.totalFee.toLocaleString()}</strong></div>
<div class="row"><span>Amount Paid:</span><strong>₵ ${payment.amountPaid.toLocaleString()}</strong></div>
<div class="row"><span>Balance:</span><strong style="color:${balance > 0 ? "#e53e3e" : "#38a169"}">₵ ${balance.toLocaleString()}</strong></div>
<div class="total">Amount Paid: ₵ ${payment.amountPaid.toLocaleString()}</div>
<p style="text-align:center;margin-top:20px;font-size:11px;color:#666">This is a computer-generated receipt.</p>
${brandedPrintFooter()}
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
