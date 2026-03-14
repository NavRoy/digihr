// frontend/src/utils/api.js
// ─────────────────────────────────────────────────────────────
// All API calls for DIGIHR frontend → Node.js backend
// ─────────────────────────────────────────────────────────────

const BASE = "/api";

let _token = localStorage.getItem("digihr_token");
export const setToken = (t) => {
  _token = t;
  if (t) localStorage.setItem("digihr_token", t);
  else localStorage.removeItem("digihr_token");
};
export const getToken = () => _token || localStorage.getItem("digihr_token");

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const t = getToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

const get   = p     => req("GET",    p);
const post  = (p,b) => req("POST",   p, b);
const put   = (p,b) => req("PUT",    p, b);
const patch = (p,b) => req("PATCH",  p, b);
const del   = p     => req("DELETE", p);

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  login:          (email, password) => post("/auth/login", { email, password }),
  logout:         ()                => post("/auth/logout").catch(() => null),
  me:             ()                => get("/auth/me"),
  changePassword: (cur, next)       => post("/auth/change-password", { currentPassword: cur, newPassword: next }),
};

// ── Employees ─────────────────────────────────────────────────
export const employeesApi = {
  list:   (p = {}) => get(`/employees?${new URLSearchParams(p)}`),
  get:    id       => get(`/employees/${id}`),
  create: data     => post("/employees", data),
  update: (id, d)  => put(`/employees/${id}`, d),
  delete: id       => del(`/employees/${id}`),
};

// ── Attendance ────────────────────────────────────────────────
export const attendanceApi = {
  // Today / date filter / employee history
  list:    (p = {}) => get(`/attendance?${new URLSearchParams(p)}`),

  // Monthly report — GET /api/attendance/monthly?month=3&year=2026
  monthly: (month, year) => get(`/attendance/monthly?month=${month}&year=${year}`),

  // Employee history — GET /api/attendance/employee/:id
  history: (employeeId) => get(`/attendance/employee/${employeeId}`),

  // Check-in / check-out
  checkIn:  (data) => post("/attendance/checkin",  data),
  checkOut: (data) => post("/attendance/checkout", data),

  // Mark absent (HR only)
  markAbsent: (date) => post("/attendance/mark-absent", { date }),
};

// ── Leaves ────────────────────────────────────────────────────
export const leavesApi = {
  list:         (p = {})    => get(`/leaves?${new URLSearchParams(p)}`),
  apply:        data         => post("/leaves", data),
  updateStatus: (id, s, n)  => patch(`/leaves/${id}/status`, { status: s, notes: n }),
  cancel:       id           => patch(`/leaves/${id}/cancel`, {}),

  // Balance for one employee
  balance:   (employeeId) => get(`/leaves/balance/${employeeId}`),

  // All balances (HR view)
  balances:  () => get("/leaves/balances"),
};

// ── Payroll ───────────────────────────────────────────────────
export const payrollApi = {
  getRuns:    ()      => get("/payroll/runs"),
  getRecords: runId   => get(`/payroll/runs/${runId}/records`),
  getRecord:  (runId, recordId) => get(`/payroll/runs/${runId}/records/${recordId}`),
  runPayroll: data    => post("/payroll/runs", data),
  approveRecord: id   => patch(`/payroll/records/${id}/approve`, {}),
};

// ── PMS ───────────────────────────────────────────────────────
export const pmsApi = {
  getGoals:      (p = {}) => get(`/pms/goals?${new URLSearchParams(p)}`),
  createGoal:    data     => post("/pms/goals", data),
  updateGoal:    (id, d)  => patch(`/pms/goals/${id}`, d),
  getReviews:    (p = {}) => get(`/pms/reviews?${new URLSearchParams(p)}`),
  approveReview: (id, d)  => patch(`/pms/reviews/${id}`, d),
};

// ── Documents ─────────────────────────────────────────────────
export const documentsApi = {
  list:   (p = {}) => get(`/documents?${new URLSearchParams(p)}`),
  upload: data     => post("/documents", data),
  delete: id       => del(`/documents/${id}`),
};

// ── Expenses ──────────────────────────────────────────────────
export const expensesApi = {
  list:         (p = {})   => get(`/expenses?${new URLSearchParams(p)}`),
  submit:       data        => post("/expenses", data),
  updateStatus: (id, s, n) => patch(`/expenses/${id}/status`, { status: s, notes: n }),
};

// ── Assets ────────────────────────────────────────────────────
export const assetsApi = {
  list:          (p = {})   => get(`/assets?${new URLSearchParams(p)}`),
  create:        data        => post("/assets", data),
  assign:        (id, eId)  => patch(`/assets/${id}/assign`, { employeeId: eId }),
  return_:       id          => patch(`/assets/${id}/return`, {}),
  getRequests:   ()          => get("/assets/requests"),
  createRequest: data        => post("/assets/requests", data),
  updateRequest: (id, s, n) => patch(`/assets/requests/${id}/status`, { status: s, notes: n }),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  stats:             () => get("/dashboard/stats"),
  attendanceSummary: () => get("/dashboard/attendance-summary"),
};
