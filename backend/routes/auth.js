// backend/routes/auth.js
import { Router } from "express";
import bcrypt      from "bcrypt";
import jwt         from "jsonwebtoken";
import { query, queryOne }           from "../config/db.js";
import { generateTokens, authenticate } from "../middleware/auth.js";

const router = Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await queryOne(
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
              e.id AS employee_id, e.first_name, e.last_name,
              e.emp_code, e.designation, e.profile_photo,
              d.name AS department
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE u.email = $1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is deactivated. Contact HR." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token
    await query(
      "UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2",
      [refreshToken, user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:          user.id,
        employeeId:  user.employee_id,
        email:       user.email,
        role:        user.role,
        name:        `${user.first_name} ${user.last_name}`,
        empCode:     user.emp_code,
        designation: user.designation,
        department:  user.department,
        photo:       user.profile_photo,
      },
    });
  } catch (err) { next(err); }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "digihr_refresh_secret_key_change_in_prod");

    const user = await queryOne(
      "SELECT id, role, is_active, refresh_token FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(user.id, user.role);
    await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [tokens.refreshToken, user.id]);

    res.json(tokens);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", authenticate, async (req, res, next) => {
  try {
    await query("UPDATE users SET refresh_token = NULL WHERE id = $1", [req.user.id]);
    res.json({ message: "Logged out successfully" });
  } catch (err) { next(err); }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await queryOne(
      `SELECT u.id, u.email, u.role, u.last_login,
              e.id AS employee_id, e.emp_code, e.first_name, e.last_name,
              e.designation, e.profile_photo, d.name AS department
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(user);
  } catch (err) { next(err); }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
    // Always return 200 to avoid email enumeration
    if (user) {
      const token   = require("crypto").randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await query(
        "UPDATE users SET reset_token = $1, reset_token_exp = $2 WHERE id = $3",
        [token, expires, user.id]
      );
      // TODO: send email with reset link
      console.log(`🔑 Reset token for ${email}: ${token}`);
    }
    res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (err) { next(err); }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await queryOne(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_exp > NOW()",
      [token]
    );
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hash = await bcrypt.hash(password, 12);
    await query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_exp = NULL WHERE id = $2",
      [hash, user.id]
    );
    res.json({ message: "Password reset successfully" });
  } catch (err) { next(err); }
});

// ── POST /api/auth/change-password ───────────────────────────────────────────
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await queryOne("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) { next(err); }
});

export default router;
