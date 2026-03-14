import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();


// ─────────────────────────────────────────────
// GET ALL EMPLOYEES
// ─────────────────────────────────────────────

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        emp_code,
        first_name,
        last_name,
        email,
        phone,
        designation,
        date_of_joining,
        basic_salary,
        status
      FROM employees
      ORDER BY created_at DESC
    `);

    res.json({
      data: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }

});


// ─────────────────────────────────────────────
// CREATE EMPLOYEE
// ─────────────────────────────────────────────

router.post("/", async (req, res) => {

  try {

    const {
      first_name,
      last_name,
      email,
      phone,
      designation,
      date_of_joining,
      basic_salary
    } = req.body;

    const emp_code = `EMP${Date.now().toString().slice(-5)}`;

    const result = await pool.query(
      `
      INSERT INTO employees
      (emp_code, first_name, last_name, email, phone, designation, date_of_joining, basic_salary)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        emp_code,
        first_name,
        last_name,
        email,
        phone,
        designation,
        date_of_joining,
        basic_salary
      ]
    );

    res.json({
      message: "Employee created",
      employee: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to create employee"
    });

  }

});


// ─────────────────────────────────────────────
// UPDATE EMPLOYEE
// ─────────────────────────────────────────────

router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const {
      first_name,
      last_name,
      designation,
      phone,
      basic_salary
    } = req.body;

    const result = await pool.query(
      `
      UPDATE employees
      SET
        first_name = $1,
        last_name = $2,
        designation = $3,
        phone = $4,
        basic_salary = $5
      WHERE emp_code = $6
      RETURNING *
      `,
      [
        first_name,
        last_name,
        designation,
        phone,
        basic_salary,
        id
      ]
    );

    res.json({
      message: "Employee updated",
      employee: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to update employee"
    });

  }

});


// ─────────────────────────────────────────────
// DEACTIVATE EMPLOYEE
// ─────────────────────────────────────────────

router.delete("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE employees
      SET status='Inactive'
      WHERE emp_code=$1
      `,
      [id]
    );

    res.json({
      message: "Employee deactivated"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to deactivate employee"
    });

  }

});

export default router;