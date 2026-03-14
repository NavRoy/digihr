// backend/middleware/auth.js
import jwt    from "jsonwebtoken";
import { queryOne } from "../config/db.js";

const JWT_SECRET         = process.env.JWT_SECRET         || "digihr_super_secret_key_change_in_prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "digihr_refresh_secret_key_change_in_prod";

// ── Generate tokens ───────────────────────────────────────────────────────────
export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

// ── Verify access token middleware ────────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await queryOne(
      `SELECT u.id, u.email, u.role, u.is_active,
              e.id AS employee_id, e.first_name, e.last_name, e.department_id
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ── Role-based access control ─────────────────────────────────────────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required roles: ${roles.join(", ")}`,
    });
  }
  next();
};

// ── Shorthand role checkers ───────────────────────────────────────────────────
export const isAdmin    = authorize("super_admin");
export const isHR       = authorize("super_admin", "hr_manager");
export const isFinance  = authorize("super_admin", "hr_manager", "finance");
export const isManager  = authorize("super_admin", "hr_manager", "manager");
