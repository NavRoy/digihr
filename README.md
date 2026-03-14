# DIGIHR — Complete HRMS Platform

Complete HR Management System built with React + Node.js + PostgreSQL.

---

## 📁 Project Structure

```
digihr/
├── frontend/                   # React + Vite
│   └── src/
│       ├── App.jsx             # Root app with auth + routing
│       ├── components/
│       │   └── UI.jsx          # Shared component library
│       └── pages/
│           ├── Login.jsx       # Auth screen
│           ├── Dashboard.jsx   # Overview dashboard
│           ├── Employees.jsx   # Employee management
│           ├── Attendance.jsx  # Attendance + leave
│           ├── Payroll.jsx     # Payroll processing
│           ├── PMS.jsx         # Performance management
│           ├── Documents.jsx   # Document management
│           ├── Expenses.jsx    # Expense reimbursements
│           ├── Assets.jsx      # Asset management
│           └── Settings.jsx    # Roles + settings
│
└── backend/                    # Node.js + Express
    ├── server.js               # Entry point
    ├── schema.sql              # Full PostgreSQL schema
    ├── .env.example            # Environment template
    ├── config/
    │   └── db.js               # Database connection pool
    ├── middleware/
    │   └── auth.js             # JWT auth + RBAC
    └── routes/
        ├── auth.js             # Login, refresh, logout
        ├── employees.js        # CRUD employees
        ├── attendance.js       # Check-in/out, records
        ├── leaves.js           # Leave requests + approvals
        ├── payroll.js          # Payroll runs + records
        ├── pms.js              # Goals + reviews
        ├── documents.js        # Document management
        ├── expenses.js         # Expense tracking
        ├── assets.js           # Asset inventory + requests
        └── dashboard.js        # Stats + analytics
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE digihr;"

# Run schema (creates all tables + seed admin user)
psql -U postgres -d digihr -f backend/schema.sql
```

**Default Admin Login after seed:**
- Email: `admin@digihr.in`
- Password: `Admin@123`

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

# Start development server
npm run dev
# API runs at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs at http://localhost:5173
```

---

## 🔐 Demo Accounts (Frontend Mock)

| Role        | Email                   | Password   |
|-------------|-------------------------|------------|
| Super Admin | admin@digihr.in         | Admin@123  |
| HR Manager  | hr@digihr.in            | HR@123     |
| Manager     | manager@digihr.in       | Mgr@123    |
| Employee    | employee@digihr.in      | Emp@123    |

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
```

### Employees
```
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
```

### Attendance
```
GET    /api/attendance
POST   /api/attendance/checkin
POST   /api/attendance/checkout
```

### Leaves
```
GET    /api/leaves
POST   /api/leaves
PATCH  /api/leaves/:id/status
```

### Payroll
```
GET    /api/payroll/runs
GET    /api/payroll/runs/:runId/records
POST   /api/payroll/runs
```

### PMS
```
GET    /api/pms/goals
POST   /api/pms/goals
PATCH  /api/pms/goals/:id
GET    /api/pms/reviews
PATCH  /api/pms/reviews/:id
```

### Documents
```
GET    /api/documents
POST   /api/documents
DELETE /api/documents/:id
```

### Expenses
```
GET    /api/expenses
POST   /api/expenses
PATCH  /api/expenses/:id/status
```

### Assets
```
GET    /api/assets
POST   /api/assets
PATCH  /api/assets/:id/assign
PATCH  /api/assets/:id/return
GET    /api/assets/requests
POST   /api/assets/requests
PATCH  /api/assets/requests/:id/status
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/attendance-summary
```

---

## 🔧 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, Google Fonts (Syne + DM Sans) |
| Backend   | Node.js 18, Express 4, ES Modules       |
| Database  | PostgreSQL 14+ with UUID, pgcrypto     |
| Auth      | JWT (access + refresh tokens), bcrypt  |
| Security  | Helmet, CORS, RBAC middleware          |

---

## 🏗️ Next Steps (Suggested)

- [ ] File upload with Multer + S3/Cloudinary (documents, receipts, photos)
- [ ] PDF payslip generation with Puppeteer or PDFKit
- [ ] Email notifications with Nodemailer
- [ ] Real-time notifications with Socket.io
- [ ] Multi-tenancy (multiple companies)
- [ ] Mobile app (React Native)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose for one-click setup

---

## 📞 Support

Website: [www.digihr.in](https://www.digihr.in)
