// backend/config/db.js
import pg   from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "digihr",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max:      20,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect",  () => console.log("✅ PostgreSQL connected"));
pool.on("error",  (err) => console.error("❌ PostgreSQL error:", err));

// Helper: run query
export const query = (text, params) => pool.query(text, params);

// Helper: get single row
export const queryOne = async (text, params) => {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
};
