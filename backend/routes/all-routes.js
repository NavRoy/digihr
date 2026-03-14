// ═══════════════════════════════════════════════════════════
// backend/routes/all-routes.js  — DIGIHR Complete Routes
// ═══════════════════════════════════════════════════════════
import { Router } from "express";
import bcrypt from "bcrypt";
import { query, queryOne } from "../config/db.js";
import { authenticate, isHR, isFinance } from "../middleware/auth.js";

// ─────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────
const employeesRouter = Router();
employeesRouter.use(authenticate);

employeesRouter.get("/", async (req, res, next) => {
  try {
    const { dept, status, search } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const params = []; const conds = [];
    if (dept)   { params.push(dept);           conds.push(`d.name = $${params.length}`); }
    if (status) { params.push(status);         conds.push(`e.status::text = $${params.length}`); }
    if (search) { params.push(`%${search}%`);  conds.push(`(e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.emp_code ILIKE $${params.length} OR e.email ILIKE $${params.length})`); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const filterParams = [...params];
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT e.id, e.emp_code, e.first_name, e.last_name, e.email, e.phone,
              e.designation, e.status, e.date_of_joining, e.basic_salary,
              d.name AS department, mgr.first_name||' '||mgr.last_name AS manager
       FROM employees e
       LEFT JOIN departments d  ON d.id = e.department_id
       LEFT JOIN employees mgr  ON mgr.id = e.reporting_to
       ${where} ORDER BY e.first_name, e.last_name
       LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    const { rows: count } = await query(
      `SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON d.id = e.department_id ${where}`,
      filterParams
    );
    res.json({ data: rows, total: +count[0].count, page, limit });
  } catch (err) { next(err); }
});

employeesRouter.get("/:id", async (req, res, next) => {
  try {
    const emp = await queryOne(
      `SELECT e.*, d.name AS department, mgr.first_name||' '||mgr.last_name AS manager
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN employees mgr ON mgr.id = e.reporting_to
       WHERE e.id = $1`, [req.params.id]
    );
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  } catch (err) { next(err); }
});

employeesRouter.post("/", isHR, async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, departmentId, designation, reportingTo,
            dateOfJoining, basicSalary, hra, allowances, employmentType, role = "employee" } = req.body;
    const { rows } = await query("SELECT emp_code FROM employees ORDER BY emp_code DESC LIMIT 1");
    const lastNum  = rows.length ? parseInt(rows[0].emp_code.replace("EMP","")) : 0;
    const empCode  = `EMP${String(lastNum + 1).padStart(3, "0")}`;
    const emp = await queryOne(
      `INSERT INTO employees (emp_code,first_name,last_name,email,phone,department_id,
         designation,reporting_to,date_of_joining,basic_salary,hra,allowances,employment_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [empCode,firstName,lastName,email,phone,departmentId,designation,
       reportingTo||null,dateOfJoining,basicSalary||0,hra||0,allowances||0,employmentType||"Full-Time"]
    );
    const tempPw = `Digihr@${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const hash = await bcrypt.hash(tempPw, 12);
    await query("INSERT INTO users (employee_id,email,password_hash,role) VALUES ($1,$2,$3,$4)",
      [emp.id, email, hash, role]);
    // Seed leave balance for current year
    const yr = new Date().getFullYear();
    await query(`INSERT INTO leave_balances (employee_id,year) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [emp.id, yr]);
    res.status(201).json({ ...emp, tempPassword: tempPw });
  } catch (err) { next(err); }
});

employeesRouter.put("/:id", isHR, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, departmentId, designation, reportingTo, status,
            basicSalary, hra, allowances, bankName, bankAccount, ifscCode } = req.body;
    const emp = await queryOne(
      `UPDATE employees SET first_name=$1,last_name=$2,phone=$3,department_id=$4,
         designation=$5,reporting_to=$6,status=$7,basic_salary=$8,hra=$9,allowances=$10,
         bank_name=$11,bank_account=$12,ifsc_code=$13,updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [firstName,lastName,phone,departmentId,designation,reportingTo||null,status,
       basicSalary,hra,allowances,bankName,bankAccount,ifscCode,req.params.id]
    );
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  } catch (err) { next(err); }
});

employeesRouter.delete("/:id", isHR, async (req, res, next) => {
  try {
    await query("UPDATE employees SET status='Inactive', updated_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ message: "Employee deactivated" });
  } catch (err) { next(err); }
});

export default employeesRouter;


// ─────────────────────────────────────────────────────────────
// ATTENDANCE  — Full system: check-in, check-out, monthly, history
// ─────────────────────────────────────────────────────────────
export const attendanceRouter = (() => {
  const r = Router();
  r.use(authenticate);

  // GET /api/attendance?date=YYYY-MM-DD  OR  ?employeeId=&from=&to=
  r.get("/", async (req, res, next) => {
    try {
      const { date, employeeId, from, to } = req.query;
      let sql = `SELECT a.id, a.employee_id, a.date,
                        TO_CHAR(a.check_in  AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_in,
                        TO_CHAR(a.check_out AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_out,
                        ROUND(a.worked_hours::numeric,2) AS worked_hours,
                        a.status, a.location, a.notes,
                        e.first_name||' '||e.last_name AS name,
                        e.emp_code, d.name AS department
                 FROM attendance a
                 JOIN employees e ON e.id = a.employee_id
                 LEFT JOIN departments d ON d.id = e.department_id
                 WHERE 1=1`;
      const p = [];
      if (date)       { p.push(date);       sql += ` AND a.date = $${p.length}`; }
      if (employeeId) { p.push(employeeId); sql += ` AND a.employee_id = $${p.length}`; }
      if (from)       { p.push(from);       sql += ` AND a.date >= $${p.length}`; }
      if (to)         { p.push(to);         sql += ` AND a.date <= $${p.length}`; }
      sql += " ORDER BY a.date DESC, e.emp_code";
      const { rows } = await query(sql, p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  // GET /api/attendance/monthly?month=3&year=2026
  r.get("/monthly", async (req, res, next) => {
    try {
      const { month, year } = req.query;
      const yr = year  || new Date().getFullYear();
      const mo = month || new Date().getMonth() + 1;
      const { rows } = await query(
        `SELECT a.id, a.employee_id, a.date,
                TO_CHAR(a.check_in  AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_in,
                TO_CHAR(a.check_out AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_out,
                ROUND(a.worked_hours::numeric,2) AS worked_hours,
                a.status, e.first_name||' '||e.last_name AS name,
                e.emp_code, d.name AS department
         FROM attendance a
         JOIN employees e ON e.id = a.employee_id
         LEFT JOIN departments d ON d.id = e.department_id
         WHERE EXTRACT(MONTH FROM a.date)=$1 AND EXTRACT(YEAR FROM a.date)=$2
         ORDER BY e.emp_code, a.date`,
        [mo, yr]
      );
      // Pivot: group by employee, list each day
      const empMap = {};
      for (const row of rows) {
        if (!empMap[row.employee_id]) {
          empMap[row.employee_id] = { employee_id:row.employee_id, name:row.name, emp_code:row.emp_code, department:row.department, days:[] };
        }
        empMap[row.employee_id].days.push({ date:row.date, check_in:row.check_in, check_out:row.check_out, worked_hours:row.worked_hours, status:row.status });
      }
      const result = Object.values(empMap).map(emp => ({
        ...emp,
        present_days: emp.days.filter(d=>d.status==="Present").length,
        absent_days:  emp.days.filter(d=>d.status==="Absent").length,
        total_hours:  emp.days.reduce((s,d)=>s+(+d.worked_hours||0),0).toFixed(1),
      }));
      res.json(result);
    } catch (err) { next(err); }
  });

  // GET /api/attendance/employee/:id  — last 30 days
  r.get("/employee/:id", async (req, res, next) => {
    try {
      const from = new Date(); from.setDate(from.getDate()-30);
      const { rows } = await query(
        `SELECT a.id, a.date,
                TO_CHAR(a.check_in  AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_in,
                TO_CHAR(a.check_out AT TIME ZONE 'Asia/Kolkata','HH24:MI') AS check_out,
                ROUND(a.worked_hours::numeric,2) AS worked_hours,
                a.status, a.location, a.notes
         FROM attendance a
         WHERE a.employee_id=$1 AND a.date >= $2
         ORDER BY a.date DESC`,
        [req.params.id, from.toISOString().split("T")[0]]
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  // POST /api/attendance/checkin
  r.post("/checkin", async (req, res, next) => {
    try {
      const employeeId = req.body.employeeId || req.user.employee_id;
      const location   = req.body.location || "Office";
      const today = new Date().toISOString().split("T")[0];
      const existing = await queryOne(
        "SELECT id, check_in FROM attendance WHERE employee_id=$1 AND date=$2",
        [employeeId, today]
      );
      if (existing?.check_in) return res.status(400).json({ error: "Already checked in today" });
      const rec = await queryOne(
        `INSERT INTO attendance (employee_id,date,check_in,status,location,ip_address)
         VALUES ($1,$2,NOW(),'Present',$3,$4)
         ON CONFLICT (employee_id,date) DO UPDATE SET check_in=NOW(), status='Present', updated_at=NOW()
         RETURNING *`,
        [employeeId, today, location, req.ip||null]
      );
      res.json(rec);
    } catch (err) { next(err); }
  });

  // POST /api/attendance/checkout
  r.post("/checkout", async (req, res, next) => {
    try {
      const employeeId = req.body.employeeId || req.user.employee_id;
      const today = new Date().toISOString().split("T")[0];
      const rec = await queryOne(
        `UPDATE attendance SET
           check_out=NOW(),
           worked_hours=ROUND(EXTRACT(EPOCH FROM (NOW()-check_in))/3600, 2),
           updated_at=NOW()
         WHERE employee_id=$1 AND date=$2 AND check_in IS NOT NULL AND check_out IS NULL
         RETURNING *`,
        [employeeId, today]
      );
      if (!rec) return res.status(400).json({ error: "No active check-in found for today" });
      res.json(rec);
    } catch (err) { next(err); }
  });

  // POST /api/attendance/mark-absent  — cron-like, mark absences for previous working day
  r.post("/mark-absent", isHR, async (req, res, next) => {
    try {
      const { date } = req.body;
      const d = date || new Date(Date.now()-86400000).toISOString().split("T")[0];
      await query(
        `INSERT INTO attendance (employee_id, date, status)
         SELECT e.id, $1, 'Absent'
         FROM employees e
         WHERE e.status='Active'
           AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.employee_id=e.id AND a.date=$1)`,
        [d]
      );
      res.json({ message: `Absences marked for ${d}` });
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// LEAVE MANAGEMENT  — apply, approve, reject, balance
// ─────────────────────────────────────────────────────────────
export const leaveRouter = (() => {
  const r = Router();
  r.use(authenticate);

  // GET all leaves  (filterable by status, employeeId)
  r.get("/", async (req, res, next) => {
    try {
      const { status, employeeId, from, to } = req.query;
      let sql = `SELECT lr.*, e.first_name||' '||e.last_name AS employee_name,
                        e.emp_code, d.name AS department
                 FROM leave_requests lr
                 JOIN employees e ON e.id = lr.employee_id
                 LEFT JOIN departments d ON d.id = e.department_id
                 WHERE 1=1`;
      const p = [];
      if (status)     { p.push(status);     sql += ` AND lr.status=$${p.length}`; }
      if (employeeId) { p.push(employeeId); sql += ` AND lr.employee_id=$${p.length}`; }
      if (from)       { p.push(from);       sql += ` AND lr.from_date >= $${p.length}`; }
      if (to)         { p.push(to);         sql += ` AND lr.to_date <= $${p.length}`; }
      sql += " ORDER BY lr.applied_on DESC";
      const { rows } = await query(sql, p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  // GET leave balance for an employee
  r.get("/balance/:employeeId", async (req, res, next) => {
    try {
      const yr = new Date().getFullYear();
      let bal = await queryOne(
        "SELECT * FROM leave_balances WHERE employee_id=$1 AND year=$2",
        [req.params.employeeId, yr]
      );
      if (!bal) {
        bal = await queryOne(
          "INSERT INTO leave_balances (employee_id,year) VALUES ($1,$2) RETURNING *",
          [req.params.employeeId, yr]
        );
      }
      res.json(bal);
    } catch (err) { next(err); }
  });

  // GET all balances (for HR overview)
  r.get("/balances", isHR, async (req, res, next) => {
    try {
      const yr = new Date().getFullYear();
      const { rows } = await query(
        `SELECT lb.*, e.first_name||' '||e.last_name AS employee_name,
                e.emp_code, d.name AS department
         FROM leave_balances lb
         JOIN employees e ON e.id = lb.employee_id
         LEFT JOIN departments d ON d.id = e.department_id
         WHERE lb.year=$1 ORDER BY e.emp_code`, [yr]
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  // POST apply leave
  r.post("/", async (req, res, next) => {
    try {
      const { employeeId, leaveType, fromDate, toDate, days, reason } = req.body;
      const empId = employeeId || req.user.employee_id;

      // Check available balance
      const yr  = new Date(fromDate).getFullYear();
      const bal = await queryOne("SELECT * FROM leave_balances WHERE employee_id=$1 AND year=$2", [empId, yr]);
      if (bal) {
        const typeMap = { "Annual Leave":"annual", "Sick Leave":"sick", "Casual Leave":"casual", "Work From Home":"wfh" };
        const key = typeMap[leaveType];
        if (key) {
          const available = (bal[`${key}_total`]||0) - (bal[`${key}_used`]||0);
          if (days > available) return res.status(400).json({ error: `Insufficient ${leaveType} balance. Available: ${available} days` });
        }
      }

      const leave = await queryOne(
        `INSERT INTO leave_requests (employee_id,leave_type,from_date,to_date,days,reason)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [empId, leaveType, fromDate, toDate, days, reason]
      );
      res.status(201).json(leave);
    } catch (err) { next(err); }
  });

  // PATCH approve/reject leave
  r.patch("/:id/status", isHR, async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      const leave = await queryOne(
        `UPDATE leave_requests SET status=$1, reviewed_by=$2, reviewed_on=NOW(), reviewer_notes=$3, updated_at=NOW()
         WHERE id=$4 RETURNING *`,
        [status, req.user.employee_id, notes||null, req.params.id]
      );
      if (!leave) return res.status(404).json({ error: "Leave request not found" });

      // If approved, deduct from leave balance
      if (status === "Approved") {
        const typeMap = { "Annual Leave":"annual", "Sick Leave":"sick", "Casual Leave":"casual", "Work From Home":"wfh" };
        const key = typeMap[leave.leave_type];
        if (key) {
          await query(
            `UPDATE leave_balances SET ${key}_used=${key}_used+$1, updated_at=NOW()
             WHERE employee_id=$2 AND year=$3`,
            [leave.days, leave.employee_id, new Date(leave.from_date).getFullYear()]
          );
        }
        // Mark attendance as On Leave for those dates
        const start = new Date(leave.from_date);
        const end   = new Date(leave.to_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
          const ds = d.toISOString().split("T")[0];
          await query(
            `INSERT INTO attendance (employee_id,date,status)
             VALUES ($1,$2,'On Leave')
             ON CONFLICT (employee_id,date) DO UPDATE SET status='On Leave', updated_at=NOW()`,
            [leave.employee_id, ds]
          );
        }
      }
      res.json(leave);
    } catch (err) { next(err); }
  });

  // PATCH cancel leave (by employee)
  r.patch("/:id/cancel", async (req, res, next) => {
    try {
      const leave = await queryOne(
        `UPDATE leave_requests SET status='Cancelled', updated_at=NOW()
         WHERE id=$1 AND status='Pending' RETURNING *`,
        [req.params.id]
      );
      if (!leave) return res.status(400).json({ error: "Cannot cancel — leave not found or already processed" });
      res.json(leave);
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// PAYROLL ENGINE  — runs, auto-calculate, records, payslip PDF
// ─────────────────────────────────────────────────────────────
export const payrollRouter = (() => {
  const r = Router();
  r.use(authenticate);

  // GET all payroll runs
  r.get("/runs", async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT pr.*, u.email AS run_by_email,
                (SELECT COUNT(*) FROM payroll_records rec WHERE rec.payroll_run_id=pr.id) AS employee_count
         FROM payroll_runs pr LEFT JOIN users u ON u.id=pr.run_by
         ORDER BY pr.year DESC, pr.month DESC`
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  // GET records for a run
  r.get("/runs/:runId/records", async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT rec.*,
                e.first_name||' '||e.last_name AS employee_name,
                e.emp_code, e.bank_account, e.bank_name, e.ifsc_code, e.designation,
                d.name AS department
         FROM payroll_records rec
         JOIN employees e ON e.id=rec.employee_id
         LEFT JOIN departments d ON d.id=e.department_id
         WHERE rec.payroll_run_id=$1
         ORDER BY e.emp_code`,
        [req.params.runId]
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  // POST run payroll  — auto-calculate with attendance + LOP
  r.post("/runs", isHR, async (req, res, next) => {
    try {
      const { month, year, payCycle } = req.body;
      const mo  = +month;
      const yr  = +year;

      // Check if already run
      const existing = await queryOne(
        "SELECT id,status FROM payroll_runs WHERE month=$1 AND year=$2",
        [mo, yr]
      );
      if (existing?.status === "Processed") {
        // Return existing run + records
        const { rows } = await query(
          "SELECT * FROM payroll_records WHERE payroll_run_id=$1", [existing.id]
        );
        return res.json({ ...existing, alreadyRun: true });
      }

      // Create or update run
      const run = await queryOne(
        `INSERT INTO payroll_runs (month,year,pay_cycle,status,run_by,run_at)
         VALUES ($1,$2,$3,'Processing',$4,NOW())
         ON CONFLICT (month,year,pay_cycle) DO UPDATE SET status='Processing', run_at=NOW(), run_by=$4
         RETURNING *`,
        [mo, yr, payCycle||"Monthly", req.user.id]
      );

      // Get working days in month
      const daysInMonth = new Date(yr, mo, 0).getDate();

      // Get all active employees
      const { rows: emps } = await query(
        `SELECT e.id, e.basic_salary, e.hra, e.allowances,
                COALESCE(
                  (SELECT COUNT(*) FROM attendance a
                   WHERE a.employee_id=e.id
                     AND EXTRACT(MONTH FROM a.date)=$1
                     AND EXTRACT(YEAR FROM a.date)=$2
                     AND a.status='Present'), 0
                ) AS days_present,
                COALESCE(
                  (SELECT COUNT(*) FROM attendance a
                   WHERE a.employee_id=e.id
                     AND EXTRACT(MONTH FROM a.date)=$1
                     AND EXTRACT(YEAR FROM a.date)=$2
                     AND a.status='On Leave'), 0
                ) AS leave_days
         FROM employees e WHERE e.status='Active'`,
        [mo, yr]
      );

      // Insert payroll records
      for (const emp of emps) {
        const basic   = +emp.basic_salary || 0;
        const hra     = +emp.hra || 0;
        const allow   = +emp.allowances || 0;
        const gross   = basic + hra + allow;

        // LOP calculation: paid days = days_present + leave_days
        const paidDays = +emp.days_present + +emp.leave_days;
        const lopDays  = Math.max(0, daysInMonth - paidDays - 8); // excluding approx weekends
        const lopDeduct= lopDays > 0 ? Math.round((gross / daysInMonth) * lopDays) : 0;

        const pf_emp   = Math.round(basic * 0.12);
        const pf_empr  = Math.round(basic * 0.12);
        const esi_emp  = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
        const esi_empr = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
        const annualTaxable = Math.max(0, gross * 12 - 250000);
        const tds     = Math.max(0, Math.round(annualTaxable * 0.05 / 12));
        const totalD  = pf_emp + esi_emp + tds + lopDeduct;
        const net     = Math.max(0, gross - totalD);

        await query(
          `INSERT INTO payroll_records
             (payroll_run_id,employee_id,basic,hra,other_allow,gross,
              pf_employee,pf_employer,esi_employee,esi_employer,
              tds,other_deduct,total_deduct,net_pay,days_worked,lop_days,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Processed')
           ON CONFLICT (payroll_run_id,employee_id) DO UPDATE
             SET basic=$3,hra=$4,other_allow=$5,gross=$6,pf_employee=$7,pf_employer=$8,
                 esi_employee=$9,esi_employer=$10,tds=$11,other_deduct=$12,total_deduct=$13,
                 net_pay=$14,days_worked=$15,lop_days=$16,status='Processed'`,
          [run.id, emp.id, basic, hra, allow, gross, pf_emp, pf_empr,
           esi_emp, esi_empr, tds, lopDeduct, totalD, net, paidDays, lopDays]
        );
      }

      await query(
        "UPDATE payroll_runs SET status='Processed', total_employees=$1, total_gross=$2, total_net=$3 WHERE id=$4",
        [
          emps.length,
          emps.reduce((s,e)=>{const g=(+e.basic_salary||0)+(+e.hra||0)+(+e.allowances||0); return s+g;},0),
          0, // updated below
          run.id
        ]
      );

      // Update total_net from records
      const totals = await queryOne(
        "SELECT SUM(net_pay) AS net, SUM(gross) AS gross FROM payroll_records WHERE payroll_run_id=$1",
        [run.id]
      );
      await query(
        "UPDATE payroll_runs SET total_net=$1, total_gross=$2 WHERE id=$3",
        [totals.net||0, totals.gross||0, run.id]
      );

      res.status(201).json({ ...run, status:"Processed", employeesProcessed: emps.length });
    } catch (err) { next(err); }
  });

  // PATCH approve individual record
  r.patch("/records/:id/approve", isHR, async (req, res, next) => {
    try {
      const rec = await queryOne(
        "UPDATE payroll_records SET status='Processed', updated_at=NOW() WHERE id=$1 RETURNING *",
        [req.params.id]
      );
      res.json(rec);
    } catch (err) { next(err); }
  });

  // GET payslip data  (used by PDF endpoint in server.js)
  r.get("/runs/:runId/records/:recordId", async (req, res, next) => {
    try {
      const rec = await queryOne(
        `SELECT rec.*,
                e.first_name||' '||e.last_name AS employee_name,
                e.emp_code, e.designation, e.bank_account, e.bank_name, e.ifsc_code, e.pan_number,
                d.name AS department,
                pr.month, pr.year
         FROM payroll_records rec
         JOIN employees e ON e.id=rec.employee_id
         LEFT JOIN departments d ON d.id=e.department_id
         JOIN payroll_runs pr ON pr.id=rec.payroll_run_id
         WHERE rec.id=$1 AND rec.payroll_run_id=$2`,
        [req.params.recordId, req.params.runId]
      );
      if (!rec) return res.status(404).json({ error: "Record not found" });
      res.json(rec);
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// PMS
// ─────────────────────────────────────────────────────────────
export const pmsRouter = (() => {
  const r = Router();
  r.use(authenticate);

  r.get("/goals", async (req, res, next) => {
    try {
      const { cycle, employeeId } = req.query;
      let sql = `SELECT g.*, e.first_name||' '||e.last_name AS employee_name,
                        e.emp_code, d.name AS department
                 FROM pms_goals g JOIN employees e ON e.id=g.employee_id
                 LEFT JOIN departments d ON d.id=e.department_id WHERE 1=1`;
      const p = [];
      if (cycle)      { p.push(cycle);      sql += ` AND g.cycle=$${p.length}`; }
      if (employeeId) { p.push(employeeId); sql += ` AND g.employee_id=$${p.length}`; }
      const { rows } = await query(sql+" ORDER BY e.emp_code", p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.post("/goals", isHR, async (req, res, next) => {
    try {
      const { employeeId, cycle, title, description, kpiMetric, weight, dueDate } = req.body;
      const goal = await queryOne(
        `INSERT INTO pms_goals (employee_id,cycle,title,description,kpi_metric,weight,due_date,set_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [employeeId,cycle,title,description,kpiMetric,weight,dueDate,req.user.employee_id]
      );
      res.status(201).json(goal);
    } catch (err) { next(err); }
  });

  r.patch("/goals/:id", async (req, res, next) => {
    try {
      const { progress, status } = req.body;
      const goal = await queryOne(
        "UPDATE pms_goals SET progress=$1,status=$2,updated_at=NOW() WHERE id=$3 RETURNING *",
        [progress, status, req.params.id]
      );
      res.json(goal);
    } catch (err) { next(err); }
  });

  r.get("/reviews", async (req, res, next) => {
    try {
      const { cycle, status } = req.query;
      let sql = `SELECT rv.*, e.first_name||' '||e.last_name AS employee_name,
                        mgr.first_name||' '||mgr.last_name AS manager_name
                 FROM pms_reviews rv
                 JOIN employees e ON e.id=rv.employee_id
                 LEFT JOIN employees mgr ON mgr.id=rv.reviewer_id WHERE 1=1`;
      const p = [];
      if (cycle)  { p.push(cycle);  sql += ` AND rv.cycle=$${p.length}`; }
      if (status) { p.push(status); sql += ` AND rv.status=$${p.length}`; }
      const { rows } = await query(sql+" ORDER BY rv.created_at DESC", p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.patch("/reviews/:id", isHR, async (req, res, next) => {
    try {
      const { hrRating, status } = req.body;
      const review = await queryOne(
        `UPDATE pms_reviews SET hr_rating=$1,status=$2,hr_reviewed_on=NOW(),hr_reviewer_id=$3,
           final_rating=ROUND((COALESCE(manager_rating,0)+$1)/2,1),updated_at=NOW()
         WHERE id=$4 RETURNING *`,
        [hrRating, status, req.user.employee_id, req.params.id]
      );
      res.json(review);
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────────────────────
export const expenseRouter = (() => {
  const r = Router();
  r.use(authenticate);

  r.get("/", async (req, res, next) => {
    try {
      const { status, employeeId } = req.query;
      let sql = `SELECT ex.*, e.first_name||' '||e.last_name AS employee_name,
                        e.emp_code, d.name AS department
                 FROM expenses ex
                 JOIN employees e ON e.id=ex.employee_id
                 LEFT JOIN departments d ON d.id=e.department_id WHERE 1=1`;
      const p = [];
      if (status)     { p.push(status);     sql += ` AND ex.status=$${p.length}`; }
      if (employeeId) { p.push(employeeId); sql += ` AND ex.employee_id=$${p.length}`; }
      const { rows } = await query(sql+" ORDER BY ex.submitted_on DESC", p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.post("/", async (req, res, next) => {
    try {
      const { employeeId, category, description, amount, utrNumber, receiptUrl, expenseDate } = req.body;
      const empId = employeeId || req.user.employee_id;
      const exp = await queryOne(
        `INSERT INTO expenses (employee_id,category,description,amount,utr_number,receipt_url,expense_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [empId, category, description, amount, utrNumber||null, receiptUrl||null, expenseDate]
      );
      res.status(201).json(exp);
    } catch (err) { next(err); }
  });

  r.patch("/:id/status", isHR, async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      const exp = await queryOne(
        `UPDATE expenses SET status=$1,approved_by=$2,approved_on=NOW(),approver_notes=$3,updated_at=NOW()
         WHERE id=$4 RETURNING *`,
        [status, req.user.employee_id, notes||null, req.params.id]
      );
      res.json(exp);
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────────────────────
export const assetRouter = (() => {
  const r = Router();
  r.use(authenticate);

  r.get("/", async (req, res, next) => {
    try {
      const { status, category } = req.query;
      let sql = `SELECT a.*, e.first_name||' '||e.last_name AS assigned_to_name,
                        d.name AS department
                 FROM assets a
                 LEFT JOIN employees e ON e.id=a.assigned_to
                 LEFT JOIN departments d ON d.id=e.department_id WHERE 1=1`;
      const p = [];
      if (status)   { p.push(status);   sql += ` AND a.status=$${p.length}`; }
      if (category) { p.push(category); sql += ` AND a.category=$${p.length}`; }
      const { rows } = await query(sql+" ORDER BY a.asset_code", p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.post("/", isHR, async (req, res, next) => {
    try {
      const { name, category, brand, model, serialNumber, purchaseDate, purchaseValue, warrantyUntil, condition } = req.body;
      const { rows } = await query("SELECT asset_code FROM assets ORDER BY asset_code DESC LIMIT 1");
      const lastNum  = rows.length ? parseInt(rows[0].asset_code.replace("AST","")) : 0;
      const assetCode = `AST${String(lastNum+1).padStart(3,"0")}`;
      const asset = await queryOne(
        `INSERT INTO assets (asset_code,name,category,brand,model,serial_number,purchase_date,purchase_value,warranty_until,condition)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [assetCode,name,category,brand,model,serialNumber,purchaseDate,purchaseValue,warrantyUntil,condition||"New"]
      );
      res.status(201).json(asset);
    } catch (err) { next(err); }
  });

  r.patch("/:id/assign", isHR, async (req, res, next) => {
    try {
      const { employeeId } = req.body;
      const asset = await queryOne(
        "UPDATE assets SET assigned_to=$1,assigned_on=NOW()::date,status='Assigned',updated_at=NOW() WHERE id=$2 RETURNING *",
        [employeeId, req.params.id]
      );
      res.json(asset);
    } catch (err) { next(err); }
  });

  r.patch("/:id/return", isHR, async (req, res, next) => {
    try {
      const asset = await queryOne(
        "UPDATE assets SET assigned_to=NULL,returned_on=NOW()::date,status='Available',updated_at=NOW() WHERE id=$1 RETURNING *",
        [req.params.id]
      );
      res.json(asset);
    } catch (err) { next(err); }
  });

  r.get("/requests", async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT ar.*, e.first_name||' '||e.last_name AS employee_name, d.name AS department
         FROM asset_requests ar JOIN employees e ON e.id=ar.employee_id
         LEFT JOIN departments d ON d.id=e.department_id
         ORDER BY ar.requested_on DESC`
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.post("/requests", async (req, res, next) => {
    try {
      const { employeeId, itemRequested, description, priority } = req.body;
      const empId = employeeId || req.user.employee_id;
      const req_ = await queryOne(
        "INSERT INTO asset_requests (employee_id,item_requested,description,priority) VALUES ($1,$2,$3,$4) RETURNING *",
        [empId, itemRequested, description, priority||"Medium"]
      );
      res.status(201).json(req_);
    } catch (err) { next(err); }
  });

  r.patch("/requests/:id/status", isHR, async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      const req_ = await queryOne(
        "UPDATE asset_requests SET status=$1,reviewed_by=$2,reviewed_on=NOW(),notes=$3,updated_at=NOW() WHERE id=$4 RETURNING *",
        [status, req.user.employee_id, notes||null, req.params.id]
      );
      res.json(req_);
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────
export const documentRouter = (() => {
  const r = Router();
  r.use(authenticate);

  r.get("/", async (req, res, next) => {
    try {
      const { category, employeeId, search } = req.query;
      let sql = `SELECT d.*, e.first_name||' '||e.last_name AS employee_name,
                        u.email AS uploaded_by_email
                 FROM documents d
                 LEFT JOIN employees e ON e.id=d.employee_id
                 LEFT JOIN users u ON u.id=d.uploaded_by
                 WHERE d.status != 'Deleted'`;
      const p = [];
      if (category)   { p.push(category);      sql += ` AND d.category=$${p.length}`; }
      if (employeeId) { p.push(employeeId);     sql += ` AND d.employee_id=$${p.length}`; }
      if (search)     { p.push(`%${search}%`);  sql += ` AND d.name ILIKE $${p.length}`; }
      const { rows } = await query(sql+" ORDER BY d.created_at DESC", p);
      res.json(rows);
    } catch (err) { next(err); }
  });

  r.post("/", isHR, async (req, res, next) => {
    try {
      const { name, docType, category, employeeId, isGlobal, fileUrl, fileSize, mimeType, tags } = req.body;
      const doc = await queryOne(
        `INSERT INTO documents (name,doc_type,category,employee_id,is_global,file_url,file_size,mime_type,tags,uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [name,docType,category,employeeId||null,isGlobal||false,fileUrl||null,fileSize||null,mimeType||null,tags||[],req.user.id]
      );
      res.status(201).json(doc);
    } catch (err) { next(err); }
  });

  r.delete("/:id", isHR, async (req, res, next) => {
    try {
      await query("UPDATE documents SET status='Deleted',updated_at=NOW() WHERE id=$1", [req.params.id]);
      res.json({ message: "Document deleted" });
    } catch (err) { next(err); }
  });

  return r;
})();


// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
export const dashboardRouter = (() => {
  const r = Router();
  r.use(authenticate);

  r.get("/stats", async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [emps, present, pendingLeaves, payrollRun] = await Promise.all([
        queryOne("SELECT COUNT(*) FROM employees WHERE status='Active'"),
        queryOne("SELECT COUNT(*) FROM attendance WHERE date=$1 AND status='Present'", [today]),
        queryOne("SELECT COUNT(*) FROM leave_requests WHERE status='Pending'"),
        queryOne(`SELECT SUM(net_pay) AS sum FROM payroll_records pr
                  JOIN payroll_runs run ON run.id=pr.payroll_run_id
                  WHERE run.month=EXTRACT(MONTH FROM NOW()) AND run.year=EXTRACT(YEAR FROM NOW())`),
      ]);
      res.json({
        totalEmployees: +emps.count,
        presentToday:   +present.count,
        pendingLeaves:  +pendingLeaves.count,
        monthlyPayroll: +(payrollRun?.sum||0),
      });
    } catch (err) { next(err); }
  });

  r.get("/attendance-summary", async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { rows } = await query(
        "SELECT status, COUNT(*) FROM attendance WHERE date=$1 GROUP BY status", [today]
      );
      res.json(rows);
    } catch (err) { next(err); }
  });

  return r;
})();
