-- ═══════════════════════════════════════════════════════════════
-- DIGIHR  — Complete PostgreSQL Schema
-- Run: psql -U postgres -d digihr -f schema.sql
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────────────────────────
CREATE TYPE emp_status       AS ENUM ('Active', 'Inactive', 'On Leave', 'Terminated');
CREATE TYPE gender_type      AS ENUM ('Male', 'Female', 'Other', 'Prefer not to say');
CREATE TYPE user_role        AS ENUM ('super_admin', 'hr_manager', 'manager', 'finance', 'employee');
CREATE TYPE leave_status     AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');
CREATE TYPE leave_type       AS ENUM ('Annual Leave', 'Sick Leave', 'Casual Leave', 'Work From Home', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave');
CREATE TYPE payroll_status   AS ENUM ('Draft', 'Processing', 'Processed', 'Pending', 'On Hold', 'Cancelled');
CREATE TYPE pay_cycle        AS ENUM ('Monthly', '21-20', '26-25');
CREATE TYPE goal_status      AS ENUM ('On Track', 'At Risk', 'Behind', 'Completed', 'Not Started');
CREATE TYPE review_status    AS ENUM ('Draft', 'Submitted', 'Pending Manager', 'Pending HR', 'Completed');
CREATE TYPE doc_status       AS ENUM ('Active', 'Confidential', 'Archived', 'Deleted');
CREATE TYPE expense_status   AS ENUM ('Pending', 'Approved', 'Rejected', 'Paid');
CREATE TYPE expense_category AS ENUM ('Travel', 'Client Meals', 'Software', 'Office', 'Training', 'Medical', 'Other');
CREATE TYPE asset_status     AS ENUM ('Available', 'Assigned', 'Under Repair', 'Disposed', 'Lost');
CREATE TYPE asset_condition  AS ENUM ('New', 'Good', 'Fair', 'Damaged');
CREATE TYPE req_status       AS ENUM ('Pending', 'Approved', 'Rejected', 'Fulfilled');
CREATE TYPE priority_type    AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- ── DEPARTMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  head_id     UUID,  -- FK added after employees table
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPLOYEES ─────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emp_code        VARCHAR(20) NOT NULL UNIQUE,  -- e.g. EMP001
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          gender_type,
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pincode         VARCHAR(10),
  department_id   UUID REFERENCES departments(id),
  designation     VARCHAR(150),
  reporting_to    UUID REFERENCES employees(id),
  date_of_joining DATE NOT NULL,
  date_of_leaving DATE,
  status          emp_status DEFAULT 'Active',
  employment_type VARCHAR(50) DEFAULT 'Full-Time', -- Full-Time, Part-Time, Contract
  basic_salary    NUMERIC(12,2) DEFAULT 0,
  hra             NUMERIC(12,2) DEFAULT 0,
  allowances      NUMERIC(12,2) DEFAULT 0,
  bank_name       VARCHAR(100),
  bank_account    VARCHAR(30),
  ifsc_code       VARCHAR(20),
  pan_number      VARCHAR(20),
  aadhar_number   VARCHAR(20),
  pf_number       VARCHAR(30),
  esi_number      VARCHAR(30),
  profile_photo   TEXT,  -- URL or base64
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add dept head FK
ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ── USERS (auth) ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            user_role DEFAULT 'employee',
  is_active       BOOLEAN DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  refresh_token   TEXT,
  reset_token     TEXT,
  reset_token_exp TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ATTENDANCE ────────────────────────────────────────────────────────────────
CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  worked_hours  NUMERIC(5,2),
  status        VARCHAR(30) DEFAULT 'Present', -- Present, Absent, Half Day, On Leave, Holiday
  location      VARCHAR(100),  -- Office, WFH, Client Site
  ip_address    VARCHAR(50),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ── LEAVE BALANCES ────────────────────────────────────────────────────────────
CREATE TABLE leave_balances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL,
  annual_total  INTEGER DEFAULT 18,
  annual_used   INTEGER DEFAULT 0,
  sick_total    INTEGER DEFAULT 12,
  sick_used     INTEGER DEFAULT 0,
  casual_total  INTEGER DEFAULT 6,
  casual_used   INTEGER DEFAULT 0,
  wfh_total     INTEGER DEFAULT 24,
  wfh_used      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year)
);

-- ── LEAVE REQUESTS ────────────────────────────────────────────────────────────
CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type      leave_type NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  days            INTEGER NOT NULL,
  reason          TEXT,
  status          leave_status DEFAULT 'Pending',
  applied_on      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by     UUID REFERENCES employees(id),
  reviewed_on     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYROLL RUNS ──────────────────────────────────────────────────────────────
CREATE TABLE payroll_runs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month         INTEGER NOT NULL,  -- 1-12
  year          INTEGER NOT NULL,
  pay_cycle     pay_cycle DEFAULT 'Monthly',
  cycle_from    DATE,
  cycle_to      DATE,
  status        payroll_status DEFAULT 'Draft',
  run_by        UUID REFERENCES users(id),
  run_at        TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year, pay_cycle)
);

-- ── PAYROLL RECORDS ───────────────────────────────────────────────────────────
CREATE TABLE payroll_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id  UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  basic           NUMERIC(12,2) DEFAULT 0,
  hra             NUMERIC(12,2) DEFAULT 0,
  special_allow   NUMERIC(12,2) DEFAULT 0,
  other_allow     NUMERIC(12,2) DEFAULT 0,
  gross           NUMERIC(12,2) DEFAULT 0,
  pf_employee     NUMERIC(12,2) DEFAULT 0,
  pf_employer     NUMERIC(12,2) DEFAULT 0,
  esi_employee    NUMERIC(12,2) DEFAULT 0,
  esi_employer    NUMERIC(12,2) DEFAULT 0,
  tds             NUMERIC(12,2) DEFAULT 0,
  advance_deduct  NUMERIC(12,2) DEFAULT 0,
  other_deduct    NUMERIC(12,2) DEFAULT 0,
  total_deduct    NUMERIC(12,2) DEFAULT 0,
  net_pay         NUMERIC(12,2) DEFAULT 0,
  days_worked     INTEGER,
  lop_days        INTEGER DEFAULT 0,  -- Loss of Pay
  status          payroll_status DEFAULT 'Pending',
  payslip_url     TEXT,
  paid_on         DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- ── PMS GOALS ─────────────────────────────────────────────────────────────────
CREATE TABLE pms_goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  cycle         VARCHAR(20) NOT NULL,  -- e.g. Q1 2025
  title         TEXT NOT NULL,
  description   TEXT,
  kpi_metric    TEXT,
  weight        INTEGER DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  target_value  TEXT,
  current_value TEXT,
  progress      INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date      DATE,
  status        goal_status DEFAULT 'Not Started',
  set_by        UUID REFERENCES employees(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── PMS REVIEWS ───────────────────────────────────────────────────────────────
CREATE TABLE pms_reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES employees(id),
  cycle             VARCHAR(20) NOT NULL,
  period_from       DATE,
  period_to         DATE,
  strengths         TEXT,
  improvements      TEXT,
  achievements      TEXT,
  self_rating       NUMERIC(3,1),
  manager_rating    NUMERIC(3,1),
  hr_rating         NUMERIC(3,1),
  final_rating      NUMERIC(3,1),
  status            review_status DEFAULT 'Draft',
  submitted_on      TIMESTAMPTZ,
  manager_reviewed_on TIMESTAMPTZ,
  hr_reviewed_on    TIMESTAMPTZ,
  hr_reviewer_id    UUID REFERENCES employees(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  doc_type      VARCHAR(100) NOT NULL,
  category      VARCHAR(100) NOT NULL,
  employee_id   UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_global     BOOLEAN DEFAULT FALSE,
  file_url      TEXT,
  file_size     VARCHAR(20),
  mime_type     VARCHAR(100),
  status        doc_status DEFAULT 'Active',
  tags          TEXT[],
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── EXPENSES ──────────────────────────────────────────────────────────────────
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category        expense_category NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  utr_number      VARCHAR(50),
  receipt_url     TEXT,
  expense_date    DATE NOT NULL,
  submitted_on    TIMESTAMPTZ DEFAULT NOW(),
  status          expense_status DEFAULT 'Pending',
  approved_by     UUID REFERENCES employees(id),
  approved_on     TIMESTAMPTZ,
  approver_notes  TEXT,
  paid_on         DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSETS ────────────────────────────────────────────────────────────────────
CREATE TABLE assets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_code      VARCHAR(30) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  brand           VARCHAR(100),
  model           VARCHAR(100),
  serial_number   VARCHAR(100) UNIQUE,
  purchase_date   DATE,
  purchase_value  NUMERIC(12,2),
  warranty_until  DATE,
  condition       asset_condition DEFAULT 'New',
  status          asset_status DEFAULT 'Available',
  assigned_to     UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_on     DATE,
  returned_on     DATE,
  location        VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSET REQUESTS ────────────────────────────────────────────────────────────
CREATE TABLE asset_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  asset_id        UUID REFERENCES assets(id),
  item_requested  VARCHAR(200) NOT NULL,
  description     TEXT,
  priority        priority_type DEFAULT 'Medium',
  status          req_status DEFAULT 'Pending',
  requested_on    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by     UUID REFERENCES employees(id),
  reviewed_on     TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  type        VARCHAR(50) DEFAULT 'info',  -- info, success, warning, error
  is_read     BOOLEAN DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  priority    priority_type DEFAULT 'Medium',
  audience    VARCHAR(50) DEFAULT 'All',  -- All, Department, Role
  dept_id     UUID REFERENCES departments(id),
  published   BOOLEAN DEFAULT FALSE,
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(100),
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(50),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX idx_employees_dept        ON employees(department_id);
CREATE INDEX idx_employees_status      ON employees(status);
CREATE INDEX idx_employees_emp_code    ON employees(emp_code);
CREATE INDEX idx_attendance_emp_date   ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date       ON attendance(date);
CREATE INDEX idx_leave_requests_emp    ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payroll_records_run   ON payroll_records(payroll_run_id);
CREATE INDEX idx_payroll_records_emp   ON payroll_records(employee_id);
CREATE INDEX idx_pms_goals_emp         ON pms_goals(employee_id);
CREATE INDEX idx_pms_goals_cycle       ON pms_goals(cycle);
CREATE INDEX idx_pms_reviews_emp       ON pms_reviews(employee_id);
CREATE INDEX idx_expenses_emp          ON expenses(employee_id);
CREATE INDEX idx_expenses_status       ON expenses(status);
CREATE INDEX idx_assets_assigned       ON assets(assigned_to);
CREATE INDEX idx_documents_emp         ON documents(employee_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);

-- ══════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════
INSERT INTO departments (id, name, code) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001','Engineering','ENG'),
  ('a1b2c3d4-0001-0001-0001-000000000002','Human Resources','HR'),
  ('a1b2c3d4-0001-0001-0001-000000000003','Sales','SALES'),
  ('a1b2c3d4-0001-0001-0001-000000000004','Finance','FIN'),
  ('a1b2c3d4-0001-0001-0001-000000000005','Marketing','MKT'),
  ('a1b2c3d4-0001-0001-0001-000000000006','Operations','OPS');

-- Seed admin user (password: Admin@123)
INSERT INTO employees (id, emp_code, first_name, last_name, email, phone, department_id, designation, date_of_joining, status)
VALUES ('b2c3d4e5-0001-0001-0001-000000000001','EMP001','Priya','Nair','admin@digihr.in','+91 98765 43210','a1b2c3d4-0001-0001-0001-000000000002','HR Manager','2021-07-01','Active');

INSERT INTO users (employee_id, email, password_hash, role)
VALUES ('b2c3d4e5-0001-0001-0001-000000000001','admin@digihr.in', crypt('Admin@123', gen_salt('bf', 12)), 'super_admin');
