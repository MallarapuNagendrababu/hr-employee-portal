PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employee_management (
  emp_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL REFERENCES employee_management(emp_id) ON DELETE CASCADE,
  casual_leave INTEGER NOT NULL CHECK (casual_leave >= 0),
  sick_leave INTEGER NOT NULL CHECK (sick_leave >= 0),
  earned_leave INTEGER NOT NULL CHECK (earned_leave >= 0),
  reason TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL REFERENCES employee_management(emp_id) ON DELETE CASCADE,
  attendance_date TEXT NOT NULL,
  check_in_time TEXT NOT NULL,
  check_out_time TEXT NOT NULL,
  working_minutes INTEGER NOT NULL CHECK (working_minutes > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL REFERENCES employee_management(emp_id) ON DELETE CASCADE,
  payroll_month TEXT NOT NULL,
  basic_salary_cents INTEGER NOT NULL CHECK (basic_salary_cents >= 0),
  allowances_cents INTEGER NOT NULL CHECK (allowances_cents >= 0),
  deductions_cents INTEGER NOT NULL CHECK (deductions_cents >= 0),
  net_salary_cents INTEGER NOT NULL CHECK (net_salary_cents >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL REFERENCES employee_management(emp_id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_name TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates
  ON leave_requests(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_payroll_month
  ON payroll(payroll_month);
CREATE INDEX IF NOT EXISTS idx_documents_employee
  ON documents(employee_id);