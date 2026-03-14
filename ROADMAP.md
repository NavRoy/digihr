# DIGIHR — Complete Development Roadmap
# What's done ✅ | What's next 🔲 | What's optional 💡

══════════════════════════════════════════════════════════
PHASE 1 — CORE (COMPLETE ✅)
══════════════════════════════════════════════════════════

FRONTEND (React + Vite)
  ✅ App.jsx              — Root with auth guard + sidebar routing
  ✅ Login.jsx            — Sign-in, forgot password, 4 demo accounts
  ✅ Dashboard.jsx        — Live clock, stats, activity feed, donut chart
  ✅ Employees.jsx        — List, search, filter, add form, profile view
  ✅ Attendance.jsx       — Daily log, leave requests approve/reject, balances
  ✅ Payroll.jsx          — Register, run payroll, payslip viewer
  ✅ PMS.jsx              — Goals/KPIs, manager reviews, HR approval, analytics
  ✅ Documents.jsx        — Grid/table views, upload, categories, detail modal
  ✅ Expenses.jsx         — Submit with UTR, approve/reject, status tabs
  ✅ Assets.jsx           — Inventory, assign/return, requests
  ✅ Settings.jsx         — Roles/RBAC, org config, payroll rules, security
  ✅ components/UI.jsx    — Shared component library
  ✅ utils/api.js         — Centralized API client with token refresh
  ✅ vite.config.js       — Dev server + API proxy
  ✅ index.html + main.jsx

BACKEND (Node.js + Express)
  ✅ server.js            — Express app, all routes mounted
  ✅ schema.sql           — Full PostgreSQL schema (15 tables)
  ✅ config/db.js         — Connection pool
  ✅ middleware/auth.js   — JWT access/refresh + RBAC
  ✅ middleware/validate.js — Input validation schemas
  ✅ middleware/errorHandler.js — Global error handler + rate limiter
  ✅ routes/auth.js       — Login, refresh, logout, forgot/reset password
  ✅ routes/employees.js
  ✅ routes/attendance.js
  ✅ routes/leaves.js
  ✅ routes/payroll.js
  ✅ routes/pms.js
  ✅ routes/documents.js
  ✅ routes/expenses.js
  ✅ routes/assets.js
  ✅ routes/dashboard.js

══════════════════════════════════════════════════════════
PHASE 2 — NEXT UP (HIGH PRIORITY) 🔲
══════════════════════════════════════════════════════════

FILE: backend/middleware/upload.js
  → Multer + file size limits + type validation
  CODE: npm install multer
  DOES: Handle receipt uploads (expenses), document uploads, profile photos

FILE: backend/utils/storage.js
  → Cloudinary or AWS S3 integration
  CODE: npm install cloudinary  OR  npm install @aws-sdk/client-s3
  DOES: Store and retrieve files, generate signed URLs

FILE: backend/utils/pdf.js
  → PDF payslip generation
  CODE: npm install pdfkit
  DOES: Generate branded payslip PDFs, email them to employees

FILE: backend/utils/email.js
  → Email notifications
  CODE: npm install nodemailer
  DOES: Leave approved/rejected, payslip ready, welcome email, password reset

FILE: backend/utils/notifications.js
  → In-app notification system
  CODE: Uses existing notifications table in schema
  DOES: Push badge counts, mark read, real-time via Socket.io

FILE: backend/utils/payslipGenerator.js
  → PDF payslip with DIGIHR branding
  CODE: Uses pdfkit
  DOES: Generate and store payslip, return download URL

FILE: frontend/src/hooks/useAuth.js
  → React auth context + hook
  CODE: Context + useReducer
  DOES: Share user state across all components, handle token refresh

FILE: frontend/src/hooks/useApi.js
  → Data fetching hook with loading/error states
  CODE: Custom hook with fetch + SWR pattern
  DOES: Auto-loading states, error handling, refetch on demand

══════════════════════════════════════════════════════════
PHASE 3 — ENHANCED FEATURES 🔲
══════════════════════════════════════════════════════════

FILE: backend/socket.js
  → Real-time notifications with Socket.io
  CODE: npm install socket.io
  DOES: Live attendance updates, instant leave notifications

FILE: frontend/src/pages/Reports.jsx
  → Analytics & reports dashboard
  FEATURES:
    - Headcount trends (monthly chart)
    - Department-wise salary analysis
    - Attendance heatmap (calendar view)
    - Leave utilization report
    - Expense category breakdown
    - PMS score distribution
    - Export to Excel/PDF

FILE: frontend/src/pages/Announcements.jsx
  → Company announcements
  FEATURES:
    - Create/publish announcements
    - Target by department or role
    - Priority levels (Normal/Urgent)
    - Archive old announcements

FILE: frontend/src/pages/Onboarding.jsx
  → New employee onboarding workflow
  FEATURES:
    - Onboarding checklist
    - Document collection tracker
    - IT asset assignment
    - Account creation steps
    - Welcome email trigger

FILE: backend/routes/reports.js
  → Report generation endpoints
  ENDPOINTS:
    GET /api/reports/headcount?month=&year=
    GET /api/reports/payroll-summary?year=
    GET /api/reports/attendance-monthly?empId=&month=&year=
    GET /api/reports/leave-utilization?year=
    GET /api/reports/expense-summary?month=&year=

══════════════════════════════════════════════════════════
PHASE 4 — PRODUCTION READY 🔲
══════════════════════════════════════════════════════════

FILE: docker-compose.yml
  → One-command full stack setup
  CODE: Docker + PostgreSQL + Node + React
  DOES: npm run docker:up spins everything

FILE: .github/workflows/deploy.yml
  → CI/CD pipeline
  CODE: GitHub Actions
  DOES: Auto-test + deploy on push to main

FILE: backend/tests/auth.test.js
  → API unit tests
  CODE: npm install jest supertest
  DOES: Test all auth endpoints

FILE: backend/scripts/seed.js
  → Full demo data seeder
  CODE: Faker.js + bulk inserts
  DOES: Populate DB with 100 demo employees, 6 months history

FILE: nginx.conf
  → Reverse proxy config
  DOES: Serve React build + proxy /api to Node

══════════════════════════════════════════════════════════
IMMEDIATE NEXT COMMANDS TO RUN
══════════════════════════════════════════════════════════

# 1. Start the app (with mock data — no DB needed)
cd frontend && npm install && npm run dev
→ Open http://localhost:5173
→ Login: admin@digihr.in / Admin@123

# 2. Connect real backend
cd backend && cp .env.example .env
# Edit .env with your Postgres password
npm install
psql -U postgres -c "CREATE DATABASE digihr;"
psql -U postgres -d digihr -f schema.sql
npm run dev
→ API at http://localhost:5000

# 3. Next file to build
→ Ask Claude: "Build backend/utils/pdf.js for payslip generation"
→ Ask Claude: "Build frontend/src/pages/Reports.jsx with charts"
→ Ask Claude: "Build backend/middleware/upload.js for file uploads"
→ Ask Claude: "Add real API calls to all frontend pages (replace mock data)"
→ Ask Claude: "Build docker-compose.yml for one-command setup"
→ Ask Claude: "Build frontend/src/hooks/useAuth.js auth context"
