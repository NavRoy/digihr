// backend/utils/pdf.js
// Generates branded DIGIHR payslips using PDFKit
// npm install pdfkit

import PDFDocument from "pdfkit";
import { Readable } from "stream";

// ── Brand constants ───────────────────────────────────────────────────────────
const BRAND = {
  primary:  "#FF4E1A",
  dark:     "#0A0A0F",
  gray:     "#8C8C8C",
  lightGray:"#F7F7F5",
  border:   "#EBEBEA",
  green:    "#28C840",
  red:      "#EF4444",
};

// ── Helper: draw horizontal rule ─────────────────────────────────────────────
const hr = (doc, y, color = BRAND.border) => {
  doc.strokeColor(color).lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
};

// ── Helper: two-column row ────────────────────────────────────────────────────
const row = (doc, y, label, value, options = {}) => {
  const { labelColor = BRAND.gray, valueColor = BRAND.dark, bold = false, size = 10 } = options;
  doc.fontSize(size).fillColor(labelColor).text(label, 50,  y);
  doc.fontSize(size).fillColor(valueColor).font(bold ? "Helvetica-Bold" : "Helvetica").text(value, 0, y, { align: "right", width: 495 });
  doc.font("Helvetica");
};

// ── Main generator ────────────────────────────────────────────────────────────
/**
 * generatePayslip(record) → Buffer
 *
 * record = {
 *   emp_code, employee_name, designation, department, bank_account,
 *   month, year, pay_cycle,
 *   basic, hra, special_allow, other_allow, gross,
 *   pf_employee, pf_employer, esi_employee, tds, advance_deduct, other_deduct,
 *   total_deduct, net_pay, days_worked, lop_days,
 *   company_name, company_address, company_pan, company_gst
 * }
 */
export async function generatePayslip(record) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks = [];

    doc.on("data",  chunk => chunks.push(chunk));
    doc.on("end",   ()    => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const {
      emp_code        = "EMP001",
      employee_name   = "Employee",
      designation     = "",
      department      = "",
      bank_account    = "****",
      month           = "March",
      year            = 2025,
      pay_cycle       = "Monthly",
      basic           = 0,
      hra             = 0,
      special_allow   = 0,
      other_allow     = 0,
      gross           = 0,
      pf_employee     = 0,
      pf_employer     = 0,
      esi_employee    = 0,
      tds             = 0,
      advance_deduct  = 0,
      other_deduct    = 0,
      total_deduct    = 0,
      net_pay         = 0,
      days_worked     = 26,
      lop_days        = 0,
      company_name    = "DIGIHR Technologies Pvt Ltd",
      company_address = "Bangalore, Karnataka, India",
      company_pan     = "AABCD1234E",
    } = record;

    const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    // ── HEADER BLOCK ─────────────────────────────────────────────────────────
    // Orange top bar
    doc.rect(0, 0, 595, 8).fill(BRAND.primary);

    // Company name
    doc.fontSize(20).font("Helvetica-Bold").fillColor(BRAND.dark).text("DIGI", 50, 28, { continued: true });
    doc.fillColor(BRAND.primary).text("HR");
    doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray).text(company_name, 50, 54);
    doc.text(company_address, 50, 66);

    // PAYSLIP label (top right)
    doc.fontSize(22).font("Helvetica-Bold").fillColor(BRAND.dark).text("PAYSLIP", 0, 30, { align: "right", width: 495 });
    doc.fontSize(10).font("Helvetica").fillColor(BRAND.gray);
    doc.text(`${month} ${year}`, 0, 57, { align: "right", width: 495 });
    doc.text(`Pay Cycle: ${pay_cycle}`, 0, 69, { align: "right", width: 495 });

    hr(doc, 90, BRAND.primary);

    // ── EMPLOYEE DETAILS ─────────────────────────────────────────────────────
    doc.y = 102;
    const empFields = [
      ["Employee Name", employee_name],
      ["Employee ID",   emp_code],
      ["Designation",   designation || "—"],
      ["Department",    department  || "—"],
      ["Bank Account",  `****${String(bank_account).slice(-4)}`],
      ["Days Worked",   `${days_worked} days${lop_days > 0 ? ` (LOP: ${lop_days})` : ""}`],
    ];

    // Two-column grid
    empFields.forEach(([label, value], i) => {
      const col = i % 2 === 0 ? 50 : 310;
      const y   = 102 + Math.floor(i / 2) * 22;
      doc.fontSize(8).fillColor(BRAND.gray).text(label.toUpperCase(), col, y);
      doc.fontSize(10).fillColor(BRAND.dark).font("Helvetica-Bold").text(value, col, y + 10);
      doc.font("Helvetica");
    });

    let y = 172;
    hr(doc, y);
    y += 14;

    // ── EARNINGS ─────────────────────────────────────────────────────────────
    doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND.dark).text("EARNINGS", 50, y);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND.dark).text("DEDUCTIONS", 310, y);
    y += 16;
    hr(doc, y);
    y += 10;

    const earnings = [
      ["Basic Salary",            basic],
      ["House Rent Allowance",    hra],
      ["Special Allowance",       special_allow],
      ["Other Allowances",        other_allow],
    ].filter(([, v]) => v > 0);

    const deductions = [
      ["PF (Employee 12%)",       pf_employee],
      ["PF (Employer 12%)",       pf_employer],
      ["ESI (Employee 0.75%)",    esi_employee],
      ["Tax Deducted (TDS)",      tds],
      ["Advance Deduction",       advance_deduct],
      ["Other Deductions",        other_deduct],
    ].filter(([, v]) => v > 0);

    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      const rowY = y + i * 20;

      if (earnings[i]) {
        doc.fontSize(10).fillColor(BRAND.gray).text(earnings[i][0], 50, rowY);
        doc.fontSize(10).fillColor(BRAND.dark).text(fmt(earnings[i][1]), 50, rowY, { align: "center", width: 210 });
      }
      if (deductions[i]) {
        doc.fontSize(10).fillColor(BRAND.gray).text(deductions[i][0], 310, rowY);
        doc.fontSize(10).fillColor(BRAND.red).text(fmt(deductions[i][1]), 310, rowY, { align: "right", width: 235 });
      }
    }

    y += maxRows * 20 + 8;
    hr(doc, y);
    y += 10;

    // Subtotals
    doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND.dark).text("Gross Earnings", 50, y);
    doc.fillColor(BRAND.green).text(fmt(gross), 50, y, { align: "center", width: 210 });
    doc.fillColor(BRAND.dark).text("Total Deductions", 310, y);
    doc.fillColor(BRAND.red).text(fmt(total_deduct), 310, y, { align: "right", width: 235 });
    doc.font("Helvetica");

    y += 26;

    // ── NET PAY BOX ───────────────────────────────────────────────────────────
    doc.rect(50, y, 495, 48).fill(BRAND.lightGray);
    doc.rect(50, y, 495, 48).stroke(BRAND.border);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND.dark).text("NET PAY", 70, y + 14);
    doc.fontSize(22).font("Helvetica-Bold").fillColor(BRAND.primary).text(fmt(net_pay), 0, y + 10, { align: "right", width: 525 });
    doc.font("Helvetica");

    y += 66;

    // ── PF CONTRIBUTION SUMMARY ───────────────────────────────────────────────
    if (pf_employer > 0) {
      hr(doc, y);
      y += 10;
      doc.fontSize(9).fillColor(BRAND.gray).text(
        `Note: Employer PF Contribution: ${fmt(pf_employer)} (not deducted from salary, borne by company)`,
        50, y, { width: 495 }
      );
      y += 20;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    hr(doc, y + 10);
    doc.fontSize(8).fillColor(BRAND.gray)
      .text("This is a computer-generated payslip and does not require a signature.", 50, y + 20, { align: "center", width: 495 })
      .text(`Generated by DIGIHR · www.digihr.in · ${new Date().toLocaleDateString("en-IN")}`, 50, y + 32, { align: "center", width: 495 });

    // Bottom orange bar
    doc.rect(0, 827, 595, 8).fill(BRAND.primary);

    doc.end();
  });
}

// ── Express route handler helper ──────────────────────────────────────────────
// Usage in payroll route:
//   import { streamPayslip } from "../utils/pdf.js";
//   router.get("/payslip/:recordId", authenticate, async (req,res,next) => {
//     const record = await getPayrollRecord(req.params.recordId);
//     await streamPayslip(res, record);
//   });

export async function streamPayslip(res, record) {
  const buf = await generatePayslip(record);
  const filename = `Payslip_${record.emp_code}_${record.month}_${record.year}.pdf`;
  res.setHeader("Content-Type",        "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length",      buf.length);
  res.end(buf);
}
