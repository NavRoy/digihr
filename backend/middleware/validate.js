// backend/middleware/validate.js
// Input validation middleware using plain JS — no extra libraries needed

// ── Generic field validator ───────────────────────────────────────────────────
export const validate = (schema) => (req, res, next) => {
  const errors = [];
  const data = { ...req.body, ...req.params, ...req.query };

  for (const [field, rules] of Object.entries(schema)) {
    const val = data[field];

    if (rules.required && (val === undefined || val === null || val === "")) {
      errors.push(`${field} is required`);
      continue;
    }
    if (val === undefined || val === null || val === "") continue;

    if (rules.type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
        errors.push(`${field} must be a valid email`);
    }
    if (rules.type === "phone") {
      if (!/^[+\d\s\-()]{7,20}$/.test(val))
        errors.push(`${field} must be a valid phone number`);
    }
    if (rules.minLength && String(val).length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && String(val).length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    }
    if (rules.min !== undefined && Number(val) < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && Number(val) > rules.max) {
      errors.push(`${field} must be at most ${rules.max}`);
    }
    if (rules.enum && !rules.enum.includes(val)) {
      errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
    }
    if (rules.pattern && !rules.pattern.test(val)) {
      errors.push(`${field} format is invalid`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  next();
};

// ── Reusable schemas ──────────────────────────────────────────────────────────
export const schemas = {
  login: {
    email:    { required: true, type: "email" },
    password: { required: true, minLength: 6  },
  },
  createEmployee: {
    firstName:     { required: true, minLength: 2, maxLength: 100 },
    lastName:      { required: true, minLength: 1, maxLength: 100 },
    email:         { required: true, type: "email"                },
    dateOfJoining: { required: true                               },
    departmentId:  { required: true                               },
  },
  applyLeave: {
    employeeId: { required: true                                  },
    leaveType:  { required: true, enum: ["Annual Leave","Sick Leave","Casual Leave","Work From Home","Maternity Leave","Paternity Leave","Unpaid Leave"] },
    fromDate:   { required: true                                  },
    toDate:     { required: true                                  },
    days:       { required: true, min: 1                          },
  },
  submitExpense: {
    employeeId:  { required: true                                 },
    category:    { required: true, enum: ["Travel","Client Meals","Software","Office","Training","Medical","Other"] },
    description: { required: true, minLength: 5                  },
    amount:      { required: true, min: 1                         },
    expenseDate: { required: true                                 },
  },
  createGoal: {
    employeeId: { required: true                                  },
    cycle:      { required: true                                  },
    title:      { required: true, minLength: 5                    },
    weight:     { required: true, min: 0, max: 100                },
  },
  changePassword: {
    currentPassword: { required: true, minLength: 6 },
    newPassword:     { required: true, minLength: 8, pattern: /^(?=.*[A-Z])(?=.*\d)/ },
  },
};
