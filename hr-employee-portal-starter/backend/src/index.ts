import { createRemoteJWKSet, jwtVerify } from 'jose';

interface Env {
  DB: D1Database;
  DOCUMENTS?: R2Bucket;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

type EmployeeRow = {
  emp_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  created_at: string;
};

type DocumentRow = {
  id: number;
  employee_id: string;
  doc_type: string;
  doc_name: string;
  issue_date: string;
  file_name: string;
  object_key: string | null;
  created_at: string;
};

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const remoteJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

function getObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail(400, 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 64_000) fail(413, 'Request body is too large');

  let text: string;
  try {
    text = await request.text();
  } catch {
    return fail(400, 'Invalid request body');
  }
  if (text.length > 64_000) fail(413, 'Request body is too large');

  try {
    return getObject(JSON.parse(text));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return fail(400, 'Request body must contain valid JSON');
  }
}

function textField(body: Record<string, unknown>, key: string, maxLength = 255): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    return fail(400, `${key} is required and must be at most ${maxLength} characters`);
  }
  return value.trim();
}

function dateField(value: unknown, key: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fail(400, `${key} must be a valid YYYY-MM-DD date`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    return fail(400, `${key} must be a valid YYYY-MM-DD date`);
  }
  return value;
}

function integerField(value: unknown, key: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return fail(400, `${key} must be a non-negative integer`);
  }
  return parsed;
}

function moneyToCents(value: unknown, key: string): number {
  const amount = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amount)) {
    return fail(400, `${key} must be a non-negative amount with at most two decimal places`);
  }
  const [whole, fraction = ''] = amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

function centsToMoney(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function isDatabaseConflict(error: unknown): boolean {
  return /UNIQUE constraint failed|FOREIGN KEY constraint failed/i.test(String(error));
}

async function authorize(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim();
  const audience = env.ACCESS_AUD?.trim();

  if (teamDomain === 'local' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    return null;
  }
  // Access is optional until the account has a team domain and audience configured.
  if (!teamDomain || !audience) {
    return null;
  }

  const host = teamDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!/^[a-z0-9.-]+$/i.test(host)) {
    return json({ message: 'Cloudflare Access configuration is invalid' }, 503);
  }

  const issuer = `https://${host}`;
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return json({ message: 'Authentication required' }, 401);

  try {
    let jwks = remoteJwks.get(issuer);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      remoteJwks.set(issuer, jwks);
    }
    await jwtVerify(token, jwks, { issuer, audience });
    return null;
  } catch {
    return json({ message: 'Authentication required' }, 401);
  }
}

async function getEmployee(db: D1Database, empId: string): Promise<EmployeeRow | null> {
  return db.prepare('SELECT * FROM employee_management WHERE emp_id = ?').bind(empId).first<EmployeeRow>();
}

async function employeeRoutes(request: Request, env: Env, segments: string[]): Promise<Response> {
  const { DB: db } = env;
  const method = request.method;

  if (segments.length === 1 && method === 'GET') {
    const result = await db.prepare('SELECT * FROM employee_management ORDER BY emp_id').all<EmployeeRow>();
    return json({ message: 'Employee data fetched successfully', data: result.results });
  }

  if (segments.length === 1 && method === 'POST') {
    const body = await readJson(request);
    const employee = {
      emp_id: textField(body, 'emp_id', 20),
      first_name: textField(body, 'first_name', 100),
      last_name: textField(body, 'last_name', 100),
      phone_number: textField(body, 'phone_number', 20),
      email: textField(body, 'email', 255).toLowerCase()
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) fail(400, 'email must be valid');

    try {
      await db.prepare(`
        INSERT INTO employee_management (emp_id, first_name, last_name, phone_number, email)
        VALUES (?, ?, ?, ?, ?)
      `).bind(employee.emp_id, employee.first_name, employee.last_name, employee.phone_number, employee.email).run();
    } catch (error) {
      if (isDatabaseConflict(error)) fail(409, 'Employee ID or email already exists');
      throw error;
    }
    return json({ message: 'Employee created successfully', data: await getEmployee(db, employee.emp_id) }, 201);
  }

  if (segments.length === 2 && ['PUT', 'DELETE'].includes(method)) {
    const empId = decodeURIComponent(segments[1]);
    if (!(await getEmployee(db, empId))) fail(404, 'Employee not found');

    if (method === 'DELETE') {
      await db.prepare('DELETE FROM employee_management WHERE emp_id = ?').bind(empId).run();
      return json({ message: 'Employee deleted successfully' });
    }

    const body = await readJson(request);
    const employee = {
      first_name: textField(body, 'first_name', 100),
      last_name: textField(body, 'last_name', 100),
      phone_number: textField(body, 'phone_number', 20),
      email: textField(body, 'email', 255).toLowerCase()
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) fail(400, 'email must be valid');

    try {
      await db.prepare(`
        UPDATE employee_management
        SET first_name = ?, last_name = ?, phone_number = ?, email = ?
        WHERE emp_id = ?
      `).bind(employee.first_name, employee.last_name, employee.phone_number, employee.email, empId).run();
    } catch (error) {
      if (isDatabaseConflict(error)) fail(409, 'Email already exists');
      throw error;
    }
    return json({ message: 'Employee updated successfully', data: await getEmployee(db, empId) });
  }

  return json({ message: 'Not found' }, 404);
}

type LeaveRow = {
  id: number;
  employee_id: string;
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

function mapLeave(row: LeaveRow) {
  return {
    id: String(row.id),
    employeeId: row.employee_id,
    casualLeave: String(row.casual_leave),
    sickLeave: String(row.sick_leave),
    earnedLeave: String(row.earned_leave),
    reason: row.reason,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status
  };
}

function readLeave(body: Record<string, unknown>) {
  const startDate = dateField(body.startDate, 'startDate');
  const endDate = dateField(body.endDate, 'endDate');
  if (endDate < startDate) fail(400, 'endDate must be on or after startDate');
  const status = body.status;
  if (!['Pending', 'Approved', 'Rejected'].includes(String(status))) fail(400, 'status is invalid');
  return {
    employeeId: textField(body, 'employeeId', 20),
    casualLeave: integerField(body.casualLeave, 'casualLeave'),
    sickLeave: integerField(body.sickLeave, 'sickLeave'),
    earnedLeave: integerField(body.earnedLeave, 'earnedLeave'),
    reason: textField(body, 'reason', 500),
    startDate,
    endDate,
    status: status as LeaveRow['status']
  };
}

async function leaveRoutes(request: Request, env: Env, segments: string[]): Promise<Response> {
  const method = request.method;
  if (segments.length === 1 && method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM leave_requests ORDER BY id DESC').all<LeaveRow>();
    return json({ message: 'Leave requests fetched successfully', data: result.results.map(mapLeave) });
  }

  if (segments.length === 1 && method === 'POST') {
    const leave = readLeave(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        INSERT INTO leave_requests
          (employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(leave.employeeId, leave.casualLeave, leave.sickLeave, leave.earnedLeave, leave.reason,
        leave.startDate, leave.endDate, leave.status).first<LeaveRow>();
      return json({ message: 'Leave request created successfully', data: result && mapLeave(result) }, 201);
    } catch (error) {
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
  }

  if (segments.length === 2 && ['PUT', 'DELETE'].includes(method)) {
    const id = Number(segments[1]);
    if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Leave ID is invalid');
    const current = await env.DB.prepare('SELECT id FROM leave_requests WHERE id = ?').bind(id).first();
    if (!current) fail(404, 'Leave request not found');
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM leave_requests WHERE id = ?').bind(id).run();
      return json({ message: 'Leave request deleted successfully' });
    }

    const leave = readLeave(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        UPDATE leave_requests
        SET employee_id = ?, casual_leave = ?, sick_leave = ?, earned_leave = ?, reason = ?,
            start_date = ?, end_date = ?, status = ?
        WHERE id = ? RETURNING *
      `).bind(leave.employeeId, leave.casualLeave, leave.sickLeave, leave.earnedLeave, leave.reason,
        leave.startDate, leave.endDate, leave.status, id).first<LeaveRow>();
      return json({ message: 'Leave request updated successfully', data: result && mapLeave(result) });
    } catch (error) {
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
  }

  return json({ message: 'Not found' }, 404);
}

type AttendanceRow = {
  id: number;
  employee_id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  working_minutes: number;
};

function mapAttendance(row: AttendanceRow) {
  return {
    id: String(row.id),
    employeeId: row.employee_id,
    attendanceDate: row.attendance_date,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    workingHours: `${Math.floor(row.working_minutes / 60)}h ${row.working_minutes % 60}m`
  };
}

function readAttendance(body: Record<string, unknown>) {
  const checkInTime = body.checkInTime;
  const checkOutTime = body.checkOutTime;
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (typeof checkInTime !== 'string' || !timePattern.test(checkInTime)) fail(400, 'checkInTime must use HH:mm');
  if (typeof checkOutTime !== 'string' || !timePattern.test(checkOutTime)) fail(400, 'checkOutTime must use HH:mm');
  const [inHour, inMinute] = checkInTime.split(':').map(Number);
  const [outHour, outMinute] = checkOutTime.split(':').map(Number);
  const workingMinutes = outHour * 60 + outMinute - inHour * 60 - inMinute;
  if (workingMinutes <= 0) fail(400, 'checkOutTime must be after checkInTime');
  return {
    employeeId: textField(body, 'employeeId', 20),
    attendanceDate: dateField(body.attendanceDate, 'attendanceDate'),
    checkInTime,
    checkOutTime,
    workingMinutes
  };
}

async function attendanceRoutes(request: Request, env: Env, segments: string[]): Promise<Response> {
  const method = request.method;
  if (segments.length === 1 && method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM attendance_records ORDER BY attendance_date DESC, id DESC')
      .all<AttendanceRow>();
    return json({ message: 'Attendance fetched successfully', data: result.results.map(mapAttendance) });
  }

  if (segments.length === 1 && method === 'POST') {
    const attendance = readAttendance(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        INSERT INTO attendance_records
          (employee_id, attendance_date, check_in_time, check_out_time, working_minutes)
        VALUES (?, ?, ?, ?, ?) RETURNING *
      `).bind(attendance.employeeId, attendance.attendanceDate, attendance.checkInTime,
        attendance.checkOutTime, attendance.workingMinutes).first<AttendanceRow>();
      return json({ message: 'Attendance created successfully', data: result && mapAttendance(result) }, 201);
    } catch (error) {
      if (isDatabaseConflict(error)) {
        fail(409, /UNIQUE constraint failed/i.test(String(error))
          ? 'Attendance already exists for this employee and date'
          : 'Employee does not exist');
      }
      throw error;
    }
  }

  if (segments.length === 2 && ['PUT', 'DELETE'].includes(method)) {
    const id = Number(segments[1]);
    if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Attendance ID is invalid');
    const current = await env.DB.prepare('SELECT id FROM attendance_records WHERE id = ?').bind(id).first();
    if (!current) fail(404, 'Attendance record not found');
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM attendance_records WHERE id = ?').bind(id).run();
      return json({ message: 'Attendance deleted successfully' });
    }

    const attendance = readAttendance(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        UPDATE attendance_records
        SET employee_id = ?, attendance_date = ?, check_in_time = ?, check_out_time = ?, working_minutes = ?
        WHERE id = ? RETURNING *
      `).bind(attendance.employeeId, attendance.attendanceDate, attendance.checkInTime,
        attendance.checkOutTime, attendance.workingMinutes, id).first<AttendanceRow>();
      return json({ message: 'Attendance updated successfully', data: result && mapAttendance(result) });
    } catch (error) {
      if (isDatabaseConflict(error)) fail(409, 'Employee or attendance date conflicts with an existing record');
      throw error;
    }
  }

  return json({ message: 'Not found' }, 404);
}

type PayrollRow = {
  id: number;
  employee_id: string;
  payroll_month: string;
  basic_salary_cents: number;
  allowances_cents: number;
  deductions_cents: number;
  net_salary_cents: number;
};

function mapPayroll(row: PayrollRow) {
  return {
    id: String(row.id),
    employeeId: row.employee_id,
    payrollMonth: row.payroll_month,
    basicSalary: centsToMoney(row.basic_salary_cents),
    allowances: centsToMoney(row.allowances_cents),
    deductions: centsToMoney(row.deductions_cents),
    netSalary: centsToMoney(row.net_salary_cents)
  };
}

function readPayroll(body: Record<string, unknown>) {
  const field = (camel: string, snake: string) => body[camel] ?? body[snake];
  const payrollMonth = field('payrollMonth', 'payroll_month');
  if (typeof payrollMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(payrollMonth)) {
    fail(400, 'payrollMonth must use YYYY-MM format');
  }
  const basicSalary = moneyToCents(field('basicSalary', 'basic_salary'), 'basicSalary');
  const allowances = moneyToCents(body.allowances, 'allowances');
  const deductions = moneyToCents(body.deductions, 'deductions');
  const netSalary = basicSalary + allowances - deductions;
  if (netSalary < 0) fail(400, 'deductions cannot exceed basic salary plus allowances');
  return {
    employeeId: textField(body, 'employeeId', 20),
    payrollMonth,
    basicSalary,
    allowances,
    deductions,
    netSalary
  };
}

async function payrollRoutes(request: Request, env: Env, segments: string[]): Promise<Response> {
  const method = request.method;
  if (segments.length === 1 && method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM payroll ORDER BY id DESC').all<PayrollRow>();
    return json({ message: 'Payroll fetched successfully', data: result.results.map(mapPayroll) });
  }

  if (segments.length === 1 && method === 'POST') {
    const payroll = readPayroll(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        INSERT INTO payroll
          (employee_id, payroll_month, basic_salary_cents, allowances_cents, deductions_cents, net_salary_cents)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *
      `).bind(payroll.employeeId, payroll.payrollMonth, payroll.basicSalary, payroll.allowances,
        payroll.deductions, payroll.netSalary).first<PayrollRow>();
      return json({ message: 'Payroll created successfully', data: result && mapPayroll(result) }, 201);
    } catch (error) {
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
  }

  if (segments.length === 2 && ['PUT', 'DELETE'].includes(method)) {
    const id = Number(segments[1]);
    if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Payroll ID is invalid');
    const current = await env.DB.prepare('SELECT id FROM payroll WHERE id = ?').bind(id).first();
    if (!current) fail(404, 'Payroll record not found');
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM payroll WHERE id = ?').bind(id).run();
      return json({ message: 'Payroll deleted successfully' });
    }

    const payroll = readPayroll(await readJson(request));
    try {
      const result = await env.DB.prepare(`
        UPDATE payroll
        SET employee_id = ?, payroll_month = ?, basic_salary_cents = ?, allowances_cents = ?,
            deductions_cents = ?, net_salary_cents = ? WHERE id = ? RETURNING *
      `).bind(payroll.employeeId, payroll.payrollMonth, payroll.basicSalary, payroll.allowances,
        payroll.deductions, payroll.netSalary, id).first<PayrollRow>();
      return json({ message: 'Payroll updated successfully', data: result && mapPayroll(result) });
    } catch (error) {
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
  }

  return json({ message: 'Not found' }, 404);
}

type DocumentInput = {
  employeeId: string;
  docType: string;
  docName: string;
  issueDate: string;
  fileName: string;
  file: File | null;
};

async function readDocument(request: Request): Promise<DocumentInput> {
  const contentType = request.headers.get('content-type') || '';
  let body: Record<string, unknown>;
  let file: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 10_500_000) fail(413, 'Document upload must be 10 MB or smaller');
    const form = await request.formData();
    body = Object.fromEntries([...form.entries()].filter((entry) => typeof entry[1] === 'string'));
    const candidate = form.get('file');
    if (candidate instanceof File && candidate.size > 0) file = candidate;
    if (file && file.size > 10_000_000) fail(413, 'Document upload must be 10 MB or smaller');
  } else {
    body = await readJson(request);
  }

  const rawName = file?.name || body.file_name;
  const fileName = typeof rawName === 'string' ? rawName.split(/[\\/]/).pop()?.trim() : '';
  if (!fileName || fileName.length > 180) fail(400, 'file_name is required and must be at most 180 characters');
  return {
    employeeId: textField(body, 'employee_id', 20),
    docType: textField(body, 'doc_type', 100),
    docName: textField(body, 'doc_name', 255),
    issueDate: dateField(body.issue_date, 'issue_date'),
    fileName,
    file
  };
}

function documentsBucket(env: Env): R2Bucket {
  if (!env.DOCUMENTS) {
    return fail(503, 'Document file storage is unavailable until R2 is enabled on this Cloudflare account');
  }
  return env.DOCUMENTS;
}

function mapDocument(row: DocumentRow) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    doc_type: row.doc_type,
    doc_name: row.doc_name,
    issue_date: row.issue_date,
    file_name: row.file_name,
    file_url: row.object_key ? `/api/documents/${row.id}/file` : null,
    created_at: row.created_at
  };
}

async function documentRoutes(request: Request, env: Env, segments: string[]): Promise<Response> {
  const method = request.method;
  if (segments.length === 1 && method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM documents ORDER BY id DESC').all<DocumentRow>();
    return json({ message: 'Documents fetched successfully', data: result.results.map(mapDocument) });
  }

  if (segments.length === 1 && method === 'POST') {
    const document = await readDocument(request);
    const objectKey = document.file ? `${crypto.randomUUID()}/${document.fileName}` : null;
    if (document.file && objectKey) {
      await documentsBucket(env).put(objectKey, document.file, {
        httpMetadata: { contentType: document.file.type || 'application/octet-stream' }
      });
    }
    try {
      const result = await env.DB.prepare(`
        INSERT INTO documents (employee_id, doc_type, doc_name, issue_date, file_name, object_key)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *
      `).bind(document.employeeId, document.docType, document.docName, document.issueDate,
        document.fileName, objectKey).first<DocumentRow>();
      return json({ message: 'Document created successfully', data: result && mapDocument(result) }, 201);
    } catch (error) {
      if (objectKey) await documentsBucket(env).delete(objectKey);
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
  }

  if (segments.length === 3 && segments[2] === 'file' && method === 'GET') {
    const id = Number(segments[1]);
    const document = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>();
    if (!document) fail(404, 'Document not found');
    if (!document.object_key) fail(404, 'No uploaded file is stored for this document');
    const object = await documentsBucket(env).get(document.object_key);
    if (!object) fail(404, 'Document file not found');
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.file_name)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  if (segments.length === 2 && ['PUT', 'DELETE'].includes(method)) {
    const id = Number(segments[1]);
    if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Document ID is invalid');
    const current = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>();
    if (!current) fail(404, 'Document not found');
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
      if (current.object_key) await documentsBucket(env).delete(current.object_key);
      return json({ message: 'Document deleted successfully' });
    }

    const document = await readDocument(request);
    const objectKey = document.file ? `${crypto.randomUUID()}/${document.fileName}` : current.object_key;
    if (document.file && objectKey) {
      await documentsBucket(env).put(objectKey, document.file, {
        httpMetadata: { contentType: document.file.type || 'application/octet-stream' }
      });
    }
    let result: DocumentRow | null;
    try {
      result = await env.DB.prepare(`
        UPDATE documents
        SET employee_id = ?, doc_type = ?, doc_name = ?, issue_date = ?, file_name = ?, object_key = ?
        WHERE id = ? RETURNING *
      `).bind(document.employeeId, document.docType, document.docName, document.issueDate,
        document.file ? document.fileName : current.file_name, objectKey, id).first<DocumentRow>();
    } catch (error) {
      if (document.file && objectKey) await documentsBucket(env).delete(objectKey);
      if (isDatabaseConflict(error)) fail(400, 'Employee does not exist');
      throw error;
    }
    if (document.file && current.object_key) {
      try {
        await documentsBucket(env).delete(current.object_key);
      } catch (error) {
        console.error('Failed to delete replaced R2 object', error);
      }
    }
    return json({ message: 'Document updated successfully', data: result && mapDocument(result) });
  }

  return json({ message: 'Not found' }, 404);
}

async function dashboardRoute(env: Env): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const [employees, onLeave, pendingLeaves, present, approvedLeaves, pendingPayroll] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS total FROM employee_management').first<{ total: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS total FROM leave_requests
      WHERE status = 'Approved' AND start_date <= ? AND end_date >= ?`).bind(today, today).first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM leave_requests WHERE status = 'Pending'").first<{ total: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS total FROM attendance_records WHERE attendance_date = ?').bind(today).first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM leave_requests WHERE status = 'Approved'").first<{ total: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS total FROM payroll WHERE payroll_month = ?').bind(month).first<{ total: number }>()
  ]);
  return json({
    data: {
      totalEmployees: employees?.total ?? 0,
      onLeaveToday: onLeave?.total ?? 0,
      totalDepartments: 0,
      pendingApprovals: pendingLeaves?.total ?? 0,
      presentToday: present?.total ?? 0,
      totalAnnouncements: 0,
      approvedLeave: approvedLeaves?.total ?? 0,
      pendingPayrolls: pendingPayroll?.total ?? 0
    }
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/').filter(Boolean).slice(1);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders });

  if (segments.length === 1 && segments[0] === 'health' && request.method === 'GET') {
    try {
      await env.DB.prepare('SELECT 1').first();
      return json({ status: 'ok', service: 'hr-backend', timestamp: new Date().toISOString() });
    } catch {
      return json({ status: 'unavailable', service: 'hr-backend' }, 503);
    }
  }

  const authResponse = await authorize(request, env);
  if (authResponse) return authResponse;

  try {
    if (segments.length === 1 && segments[0] === 'routes' && request.method === 'GET') {
      return json([
        { path: '/api/health', method: 'GET', module: 'System' },
        { path: '/api/dashboard', method: 'GET', module: 'Dashboard' },
        { path: '/api/employees', methods: ['GET', 'POST', 'PUT', 'DELETE'], module: 'Employee Management' },
        { path: '/api/leaves', methods: ['GET', 'POST', 'PUT', 'DELETE'], module: 'Leave Management' },
        { path: '/api/attendance', methods: ['GET', 'POST', 'PUT', 'DELETE'], module: 'Attendance' },
        { path: '/api/payroll', methods: ['GET', 'POST', 'PUT', 'DELETE'], module: 'Payroll' },
        { path: '/api/documents', methods: ['GET', 'POST', 'PUT', 'DELETE'], module: 'Documents' }
      ]);
    }
    if (segments.length === 1 && segments[0] === 'dashboard' && request.method === 'GET') {
      return dashboardRoute(env);
    }

    const resource = segments[0];
    if (resource === 'employees') return await employeeRoutes(request, env, segments);
    if (resource === 'leaves') return await leaveRoutes(request, env, segments);
    if (resource === 'attendance') return await attendanceRoutes(request, env, segments);
    if (resource === 'payroll') return await payrollRoutes(request, env, segments);
    if (resource === 'documents') return await documentRoutes(request, env, segments);
    return json({ message: 'Not found' }, 404);
  } catch (error) {
    if (error instanceof ApiError) return json({ message: error.message }, error.status);
    console.error('API request failed', error);
    return json({ message: 'Internal server error' }, 500);
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};