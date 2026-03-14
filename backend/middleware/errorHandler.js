// backend/middleware/errorHandler.js

import { query } from "../config/db.js";

// ── Async wrapper — eliminates try/catch boilerplate in routes ────────────────
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Postgres error mapper ─────────────────────────────────────────────────────
const pgErrors = {
  "23505": (err) => ({ status:409, message: `Duplicate value: ${err.detail?.match(/Key \((.+?)\)/)?.[1] || "field"} already exists` }),
  "23503": ()    => ({ status:400, message: "Referenced record does not exist" }),
  "23502": (err) => ({ status:400, message: `${err.column} is required` }),
  "22P02": ()    => ({ status:400, message: "Invalid UUID format" }),
  "42P01": ()    => ({ status:500, message: "Database table not found — run schema.sql" }),
};

// ── Global error handler (last middleware in server.js) ───────────────────────
export const errorHandler = async (err, req, res, next) => {
  let status  = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Map PostgreSQL errors
  if (err.code && pgErrors[err.code]) {
    const mapped = pgErrors[err.code](err);
    status  = mapped.status;
    message = mapped.message;
  }

  // Log to audit_logs table (best-effort, don't crash if it fails)
  if (status >= 500) {
    console.error(`❌ ${req.method} ${req.path} — ${status}: ${message}`);
    if (process.env.NODE_ENV !== "test") {
      query(
        "INSERT INTO audit_logs (user_id, action, table_name, ip_address) VALUES ($1,$2,$3,$4)",
        [req.user?.id || null, `ERROR: ${message}`, req.path, req.ip]
      ).catch(() => {});
    }
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && status >= 500 && { stack: err.stack }),
  });
};

// ── 404 handler ───────────────────────────────────────────────────────────────
export const notFound = (req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });

// ── Rate limiter (simple in-memory) ──────────────────────────────────────────
const rateLimitStore = new Map();

export const rateLimit = ({ windowMs = 60000, max = 100, message = "Too many requests" } = {}) =>
  (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    record.count++;
    rateLimitStore.set(key, record);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));

    if (record.count > max) {
      return res.status(429).json({ error: message });
    }
    next();
  };

// ── Auth rate limiter (stricter — for login route) ────────────────────────────
export const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts. Try again in 15 minutes." });
