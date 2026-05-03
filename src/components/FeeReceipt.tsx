import { type Payment } from "@/lib/storage";
import { brandedPrintHeader, brandedPrintFooter } from "@/lib/printBranding";

export function printFeeReceipt(payment: Payment) {
  const balance = payment.totalFee - payment.amountPaid;

  const html = `<!DOCTYPE html>
<html><head><title>Fee Receipt - ${payment.studentName}</title>
<style>
  body{font-family:'Segoe UI', Tahoma, sans-serif;margin:0;padding:20px;color:#333;max-width:750px;margin:0 auto}
  .receipt-card{border:2px solid #1B1464; padding:40px; position:relative; overflow:hidden;}
  .watermark{position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:80px; color:rgba(27, 20, 100, 0.03); font-weight:bold; pointer-events:none; white-space:nowrap; text-transform:uppercase;}
  .stamp{position:absolute; top:40px; right:40px; border:4px double ${balance <= 0 ? "#27ae60" : "#f39c12"}; color:${balance <= 0 ? "#27ae60" : "#f39c12"}; padding:10px 20px; font-weight:bold; transform:rotate(-15deg); text-transform:uppercase; font-size:20px; border-radius:8px;}
  .title{text-align:center;font-weight:bold;color:#1B1464;margin-bottom:30px;font-size:20px; letter-spacing:1px;}
  .row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
  .row span{color:#666; font-weight:500;}
  .row strong{color:#1B1464}
  .total-box{background:#1B1464; color:white; padding:25px; border-radius:0; margin-top:30px; text-align:center;}
  .total-box h2{margin:0; font-size:28px; font-weight:800;}
  .total-box p{margin:0 0 5px; font-size:11px; text-transform:uppercase; letter-spacing:2px; opacity:0.8;}
  .footer-text{text-align:center;margin-top:40px;font-size:11px;color:#999;font-style:italic;}
  @media print{body{padding:0}.receipt-card{border:2px solid #1B1464; height:95vh;} @page{margin:10mm}}
</style></head><body>
<div class="receipt-card">
<div class="watermark">MPSMS OFFICIAL</div>
<div class="stamp">${balance <= 0 ? "PAID IN FULL" : "PARTIAL PAYMENT"}</div>
${brandedPrintHeader("OFFICIAL PAYMENT RECEIPT")}
<div style="margin-top:20px">
  <div class="row"><span>Receipt ID</span><strong>#${payment.id.toUpperCase().substring(0, 12)}</strong></div>
  <div class="row"><span>Date Issued</span><strong>${new Date(payment.date).toLocaleDateString("en-GB", { day:'numeric', month:'long', year:'numeric'})}</strong></div>
  <div class="row"><span>Student Name</span><strong>${payment.studentName}</strong></div>
  <div class="row"><span>Class / Level</span><strong>${payment.class}</strong></div>
  <div class="row"><span>Description</span><strong>${payment.description || "Tuition / School Fees"}</strong></div>
  <div class="row"><span>Billed Amount</span><strong>₵ ${payment.totalFee.toLocaleString()}</strong></div>
  <div class="row"><span>Paid to Date</span><strong>₵ ${payment.amountPaid.toLocaleString()}</strong></div>
  <div class="row"><span>Remaining Balance</span><strong style="color:${balance > 0 ? "#e74c3c" : "#27ae60"}">₵ ${balance.toLocaleString()}</strong></div>
</div>
<div class="total-box">
  <p>Amount Received</p>
  <h2>₵ ${payment.amountPaid.toLocaleString()}</h2>
</div>
<p class="footer-text">This is a system-generated official receipt for Mujahideen Preparatory School.</p>
${brandedPrintFooter()}
</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
