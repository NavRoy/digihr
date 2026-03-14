// ── DIGIHR Backend Server ─────────────────────────────────────────────────────
import express       from "express";
import cors          from "cors";
import helmet        from "helmet";
import dotenv        from "dotenv";
import path          from "path";
import { fileURLToPath } from "url";
import { pool }      from "./config/db.js";
import { errorHandler, notFound, authRateLimit } from "./middleware/errorHandler.js";

// Routes
import authRoutes       from "./routes/auth.js";
import employeeRoutes   from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes      from "./routes/leaves.js";
import payrollRoutes    from "./routes/payroll.js";
import pmsRoutes        from "./routes/pms.js";
import documentRoutes   from "./routes/documents.js";
import expenseRoutes    from "./routes/expenses.js";
import assetRoutes      from "./routes/assets.js";
import dashboardRoutes  from "./routes/dashboard.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();

import { query } from "./config/db.js";

app.get("/api/test", async (req, res) => {
  try {
    const result = await query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy:"cross-origin" } }));
app.use(cors({
  origin:      process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods:     ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
}));
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true, limit:"10mb" }));

// Request logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req,_res,next)=>{ console.log(`${req.method} ${req.path}`); next(); });
}

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health (used by Docker healthcheck) ───────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status:"ok", db:"connected", uptime: process.uptime().toFixed(1)+"s", ts: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status:"error", db:"disconnected", error: e.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRateLimit, authRoutes);
app.use("/api/employees",  employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves",     leaveRoutes);
app.use("/api/payroll",    payrollRoutes);
app.use("/api/pms",        pmsRoutes);
app.use("/api/documents",  documentRoutes);
app.use("/api/expenses",   expenseRoutes);
app.use("/api/assets",     assetRoutes);
app.use("/api/dashboard",  dashboardRoutes);

// ── Payslip PDF endpoint ──────────────────────────────────────────────────────
app.get("/api/payroll/runs/:runId/records/:recordId/payslip", async (req, res, next) => {
  try {
    const { streamPayslip } = await import("./utils/pdf.js");
    // Fetch record from DB — for now return a demo payslip
    const demo = {
      emp_code:"EMP001", employee_name:"Arjun Sharma", designation:"Senior Developer",
      department:"Engineering", bank_account:"9876543210", month:"March", year:2025,
      basic:51000, hra:17000, special_allow:8500, other_allow:0, gross:76500,
      pf_employee:6120, pf_employer:6120, esi_employee:0, tds:4250, advance_deduct:0, other_deduct:0,
      total_deduct:10370, net_pay:66130, days_worked:26, lop_days:0,
    };
    await streamPayslip(res, demo);
  } catch (e) { next(e); }
});

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 DIGIHR API  → http://localhost:${PORT}`);
  console.log(`📊 Health      → http://localhost:${PORT}/health\n`);
});

export default app;
