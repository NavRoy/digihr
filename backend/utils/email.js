// backend/utils/email.js
// Email notifications using Nodemailer
// npm install nodemailer

import nodemailer from "nodemailer";

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"DIGIHR" <${process.env.SMTP_USER || "noreply@digihr.in"}>`;

// ── Base HTML wrapper ─────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin:0; padding:0; font-family:'DM Sans',Arial,sans-serif; background:#F7F7F5; color:#1A1A1A; }
    .container { max-width:560px; margin:32px auto; background:#fff; border-radius:16px; border:1px solid #EBEBEA; overflow:hidden; }
    .header { background:#0A0A0F; padding:24px 32px; display:flex; align-items:center; }
    .logo { font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.02em; }
    .logo span { color:#FF4E1A; }
    .body { padding:32px; }
    .title { font-size:20px; font-weight:700; color:#1A1A1A; margin:0 0 8px; }
    .text  { font-size:14px; color:#3D3D3D; line-height:1.6; margin:0 0 16px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
    .badge-green  { background:#DCFCE7; color:#28C840; }
    .badge-red    { background:#FEE2E2; color:#EF4444; }
    .badge-yellow { background:#FEF9C3; color:#FFB800; }
    .badge-blue   { background:#DBEAFE; color:#5B8DEF; }
    .card { background:#F7F7F5; border-radius:10px; padding:16px 20px; margin:16px 0; }
    .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #EBEBEA; font-size:13px; }
    .row:last-child { border-bottom:none; }
    .row .label { color:#8C8C8C; }
    .row .value { font-weight:600; }
    .btn { display:inline-block; background:#FF4E1A; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:14px; margin:8px 0; }
    .footer { background:#F7F7F5; border-top:1px solid #EBEBEA; padding:20px 32px; text-align:center; font-size:12px; color:#8C8C8C; }
    .amount { font-size:28px; font-weight:800; color:#FF4E1A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">DIGI<span>HR</span></div></div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} DIGIHR Technologies Pvt Ltd · <a href="https://www.digihr.in" style="color:#FF4E1A;">www.digihr.in</a><br>
      This is an automated email. Please do not reply.
    </div>
  </div>
</body>
</html>`;

// ── Send helper ───────────────────────────────────────────────────────────────
async function send(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED – no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  return transporter.sendMail({ from: FROM, to, subject, html });
}

// ── Email templates ───────────────────────────────────────────────────────────

// 1. Welcome / account created
export const sendWelcomeEmail = (to, name, tempPassword, loginUrl = "https://app.digihr.in") =>
  send(to, "Welcome to DIGIHR — Your account is ready 🎉", baseTemplate(`
    <p class="title">Welcome, ${name}! 👋</p>
    <p class="text">Your DIGIHR account has been created. Here are your login details:</p>
    <div class="card">
      <div class="row"><span class="label">Email</span><span class="value">${to}</span></div>
      <div class="row"><span class="label">Temporary Password</span><span class="value" style="font-family:monospace;color:#FF4E1A;">${tempPassword}</span></div>
    </div>
    <p class="text">Please log in and change your password immediately.</p>
    <a href="${loginUrl}" class="btn">Login to DIGIHR →</a>
    <p class="text" style="font-size:12px;color:#8C8C8C;margin-top:16px;">If you did not expect this email, please contact your HR team.</p>
  `));

// 2. Password reset
export const sendPasswordReset = (to, name, resetLink) =>
  send(to, "DIGIHR — Password Reset Request 🔑", baseTemplate(`
    <p class="title">Reset your password</p>
    <p class="text">Hi ${name}, we received a request to reset your DIGIHR password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
    <a href="${resetLink}" class="btn">Reset Password →</a>
    <p class="text" style="font-size:12px;color:#8C8C8C;margin-top:16px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
  `));

// 3. Leave approved
export const sendLeaveApproved = (to, name, { leaveType, fromDate, toDate, days }) =>
  send(to, "Your leave request has been approved ✅", baseTemplate(`
    <p class="title">Leave Approved <span class="badge badge-green">Approved</span></p>
    <p class="text">Hi ${name}, your leave request has been approved.</p>
    <div class="card">
      <div class="row"><span class="label">Leave Type</span><span class="value">${leaveType}</span></div>
      <div class="row"><span class="label">From</span><span class="value">${fromDate}</span></div>
      <div class="row"><span class="label">To</span><span class="value">${toDate}</span></div>
      <div class="row"><span class="label">Duration</span><span class="value">${days} day(s)</span></div>
    </div>
    <p class="text">Enjoy your time off! Your team has been notified.</p>
  `));

// 4. Leave rejected
export const sendLeaveRejected = (to, name, { leaveType, fromDate, toDate, reason }) =>
  send(to, "Leave Request Update", baseTemplate(`
    <p class="title">Leave Request <span class="badge badge-red">Not Approved</span></p>
    <p class="text">Hi ${name}, unfortunately your leave request could not be approved at this time.</p>
    <div class="card">
      <div class="row"><span class="label">Leave Type</span><span class="value">${leaveType}</span></div>
      <div class="row"><span class="label">From</span><span class="value">${fromDate}</span></div>
      <div class="row"><span class="label">To</span><span class="value">${toDate}</span></div>
      ${reason ? `<div class="row"><span class="label">Reason</span><span class="value">${reason}</span></div>` : ""}
    </div>
    <p class="text">Please speak with your manager or HR for more details.</p>
  `));

// 5. Payslip ready
export const sendPayslipReady = (to, name, { month, year, netPay, payslipUrl }) =>
  send(to, `Your ${month} ${year} Payslip is Ready 💰`, baseTemplate(`
    <p class="title">Payslip Ready — ${month} ${year}</p>
    <p class="text">Hi ${name}, your payslip for ${month} ${year} has been processed.</p>
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:13px;color:#8C8C8C;margin-bottom:6px;">Net Pay</div>
      <div class="amount">₹${Number(netPay).toLocaleString("en-IN")}</div>
    </div>
    <a href="${payslipUrl}" class="btn">Download Payslip →</a>
    <p class="text" style="font-size:12px;color:#8C8C8C;margin-top:16px;">If you have any queries about your payslip, please contact HR.</p>
  `));

// 6. Expense approved
export const sendExpenseApproved = (to, name, { category, amount, utr }) =>
  send(to, "Expense Claim Approved ✅", baseTemplate(`
    <p class="title">Expense Approved <span class="badge badge-green">Approved</span></p>
    <p class="text">Hi ${name}, your expense claim has been approved and will be reimbursed in the next payroll cycle.</p>
    <div class="card">
      <div class="row"><span class="label">Category</span><span class="value">${category}</span></div>
      <div class="row"><span class="label">Amount</span><span class="value" style="color:#28C840;">₹${Number(amount).toLocaleString("en-IN")}</span></div>
      ${utr ? `<div class="row"><span class="label">UTR</span><span class="value" style="font-family:monospace;">${utr}</span></div>` : ""}
    </div>
  `));

// 7. Expense rejected
export const sendExpenseRejected = (to, name, { category, amount, reason }) =>
  send(to, "Expense Claim Update", baseTemplate(`
    <p class="title">Expense Claim <span class="badge badge-red">Rejected</span></p>
    <p class="text">Hi ${name}, your expense claim could not be approved.</p>
    <div class="card">
      <div class="row"><span class="label">Category</span><span class="value">${category}</span></div>
      <div class="row"><span class="label">Amount</span><span class="value">₹${Number(amount).toLocaleString("en-IN")}</span></div>
      ${reason ? `<div class="row"><span class="label">Reason</span><span class="value">${reason}</span></div>` : ""}
    </div>
  `));

// 8. New leave request pending (to manager/HR)
export const sendLeaveRequestPending = (to, managerName, { empName, leaveType, fromDate, toDate, days, reviewUrl }) =>
  send(to, `Leave Request Pending — ${empName}`, baseTemplate(`
    <p class="title">Leave Request Pending Review ⏳</p>
    <p class="text">Hi ${managerName}, <strong>${empName}</strong> has submitted a leave request that requires your approval.</p>
    <div class="card">
      <div class="row"><span class="label">Employee</span><span class="value">${empName}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${leaveType}</span></div>
      <div class="row"><span class="label">From</span><span class="value">${fromDate}</span></div>
      <div class="row"><span class="label">To</span><span class="value">${toDate}</span></div>
      <div class="row"><span class="label">Days</span><span class="value">${days}</span></div>
    </div>
    <a href="${reviewUrl || "https://app.digihr.in"}" class="btn">Review Request →</a>
  `));
