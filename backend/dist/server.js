"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.options(/.*/, (_, res) => {
    res.sendStatus(204);
});
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', service: 'hr-backend', timestamp: new Date().toISOString() });
});
app.get('/api/routes', (_, res) => {
    res.json([
        { path: '/api/health', method: 'GET', module: 'System' },
        { path: '/api/dashboard', method: 'GET', module: 'Dashboard' },
        { path: '/api/employees', method: 'GET', module: 'Employee Management' },
        { path: '/api/leaves', method: 'GET', module: 'Leave Management' },
        { path: '/api/attendance', method: 'GET', module: 'Attendance' },
        { path: '/api/payroll', method: 'GET', module: 'Payroll' },
        { path: '/api/documents', method: 'GET', module: 'Documents' }
    ]);
});
app.get('/api/dashboard', (_, res) => {
    res.json({ message: 'Dashboard starter route' });
});
app.get('/api/employees', async (_req, res) => {
    try {
        const [rows] = await db_1.dbPool.query('SELECT * FROM employee_management');
        res.json({
            message: 'Employee data fetched successfully',
            data: rows
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Database error'
        });
    }
});
app.post('/api/employees', async (req, res) => {
    const { emp_id, first_name, last_name, phone_number, email } = req.body ?? {};
    if (!emp_id || !first_name || !last_name || !phone_number || !email) {
        return res.status(400).json({ message: 'Missing required employee fields' });
    }
    try {
        await db_1.dbPool.query(`
      INSERT INTO employee_management (emp_id, first_name, last_name, phone_number, email)
      VALUES (?, ?, ?, ?, ?)
      `, [emp_id, first_name, last_name, phone_number, email]);
        const [rows] = await db_1.dbPool.query('SELECT * FROM employee_management WHERE emp_id = ?', [emp_id]);
        const created = Array.isArray(rows) ? rows[0] : rows;
        return res.status(201).json({ message: 'Employee created successfully', data: created });
    }
    catch (error) {
        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Employee ID already exists' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.put('/api/employees/:empId', async (req, res) => {
    const { empId } = req.params;
    const { first_name, last_name, phone_number, email } = req.body ?? {};
    if (!first_name || !last_name || !phone_number || !email) {
        return res.status(400).json({ message: 'Missing required employee fields' });
    }
    try {
        const [result] = await db_1.dbPool.query(`
      UPDATE employee_management
      SET first_name = ?, last_name = ?, phone_number = ?, email = ?
      WHERE emp_id = ?
      `, [first_name, last_name, phone_number, email, empId]);
        const updateResult = result;
        if (!updateResult.affectedRows) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        return res.json({ message: 'Employee updated successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.delete('/api/employees/:empId', async (req, res) => {
    const { empId } = req.params;
    try {
        const [result] = await db_1.dbPool.query('DELETE FROM employee_management WHERE emp_id = ?', [empId]);
        const deleteResult = result;
        if (!deleteResult.affectedRows) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        return res.json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.get('/api/leaves', async (_req, res) => {
    try {
        const [rows] = await db_1.dbPool.query('SELECT * FROM leaves ORDER BY id DESC');
        return res.json({ message: 'Leaves fetched successfully', data: rows });
    }
    catch (error) {
        try {
            const [legacyRows] = await db_1.dbPool.query(`
        SELECT
          leave_id AS id,
          emp_id AS employee_id,
          casual_leave,
          sick_leave,
          earned_leave,
          reason,
          start_date,
          end_date,
          leave_status AS status
        FROM leave_management
        ORDER BY leave_id DESC
        `);
            return res.json({ message: 'Leaves fetched successfully', data: legacyRows });
        }
        catch (legacyError) {
            console.error(error);
            console.error(legacyError);
            return res.status(500).json({ message: 'Database error' });
        }
    }
});
app.post('/api/leaves', async (req, res) => {
    const { employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status } = req.body ?? {};
    if (!employee_id ||
        casual_leave === undefined ||
        sick_leave === undefined ||
        earned_leave === undefined ||
        !reason ||
        !start_date ||
        !end_date ||
        !status) {
        return res.status(400).json({ message: 'Missing required leave fields' });
    }
    try {
        const [result] = await db_1.dbPool.query(`
      INSERT INTO leaves (employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status]);
        const insertId = result.insertId;
        const [rows] = await db_1.dbPool.query('SELECT * FROM leaves WHERE id = ?', [insertId]);
        const created = Array.isArray(rows) ? rows[0] : rows;
        return res.status(201).json({ message: 'Leave created successfully', data: created });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.put('/api/leaves/:id', async (req, res) => {
    const { id } = req.params;
    const { employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status } = req.body ?? {};
    if (!employee_id ||
        casual_leave === undefined ||
        sick_leave === undefined ||
        earned_leave === undefined ||
        !reason ||
        !start_date ||
        !end_date ||
        !status) {
        return res.status(400).json({ message: 'Missing required leave fields' });
    }
    try {
        const [result] = await db_1.dbPool.query(`
      UPDATE leaves
      SET employee_id = ?, casual_leave = ?, sick_leave = ?, earned_leave = ?, reason = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
      `, [employee_id, casual_leave, sick_leave, earned_leave, reason, start_date, end_date, status, id]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Leave record not found' });
        }
        return res.json({ message: 'Leave updated successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.delete('/api/leaves/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db_1.dbPool.query('DELETE FROM leaves WHERE id = ?', [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Leave record not found' });
        }
        return res.json({ message: 'Leave deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
async function getAttendanceEmployeeColumn() {
    const [rows] = await db_1.dbPool.query('SHOW COLUMNS FROM attendance');
    const columns = Array.isArray(rows) ? rows.map((column) => column.Field) : [];
    return columns.includes('emp_id') ? 'emp_id' : 'employee_id';
}
async function getPayrollIdColumn() {
    const [rows] = await db_1.dbPool.query('SHOW COLUMNS FROM payroll');
    const columns = Array.isArray(rows) ? rows.map((column) => column.Field) : [];
    return columns.includes('id') ? 'id' : 'payroll_id';
}
app.get('/api/attendance', async (_req, res) => {
    try {
        const idColumn = await getAttendanceEmployeeColumn();
        const [rows] = await db_1.dbPool.query(`
      SELECT *
      FROM attendance
      ORDER BY
        CASE WHEN CAST(${idColumn} AS UNSIGNED) >= 101 THEN 0 ELSE 1 END,
        CAST(${idColumn} AS UNSIGNED) ASC,
        attendance_date DESC
      `);
        return res.json({ message: 'Attendance fetched successfully', data: rows });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.post('/api/attendance', async (req, res) => {
    const { emp_id, employee_id, attendance_date, check_in_time, check_out_time } = req.body ?? {};
    const resolvedEmployeeId = emp_id ?? employee_id;
    if (!resolvedEmployeeId || !attendance_date || !check_in_time || !check_out_time) {
        return res.status(400).json({ message: 'Missing required attendance fields' });
    }
    try {
        const idColumn = await getAttendanceEmployeeColumn();
        await db_1.dbPool.query(`
      INSERT INTO attendance (${idColumn}, attendance_date, check_in_time, check_out_time, working_hours)
      VALUES (?, ?, ?, ?, TIMEDIFF(?, ?))
      `, [resolvedEmployeeId, attendance_date, check_in_time, check_out_time, check_out_time, check_in_time]);
        const [rows] = await db_1.dbPool.query(`SELECT * FROM attendance WHERE ${idColumn} = ? AND attendance_date = ?`, [resolvedEmployeeId, attendance_date]);
        const created = Array.isArray(rows) ? rows[0] : rows;
        return res.status(201).json({ message: 'Attendance created successfully', data: created });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.put('/api/attendance/:id', async (req, res) => {
    const { id } = req.params;
    const [previousEmpId, previousAttendanceDate] = String(id).split('__');
    const { emp_id, employee_id, attendance_date, check_in_time, check_out_time } = req.body ?? {};
    const resolvedEmployeeId = emp_id ?? employee_id;
    if (!previousEmpId || !previousAttendanceDate || !resolvedEmployeeId || !attendance_date || !check_in_time || !check_out_time) {
        return res.status(400).json({ message: 'Missing required attendance fields' });
    }
    try {
        const idColumn = await getAttendanceEmployeeColumn();
        const [result] = await db_1.dbPool.query(`
      UPDATE attendance
      SET ${idColumn} = ?, attendance_date = ?, check_in_time = ?, check_out_time = ?, working_hours = TIMEDIFF(?, ?)
      WHERE ${idColumn} = ? AND attendance_date = ?
      `, [
            resolvedEmployeeId,
            attendance_date,
            check_in_time,
            check_out_time,
            check_out_time,
            check_in_time,
            previousEmpId,
            previousAttendanceDate
        ]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        return res.json({ message: 'Attendance updated successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
app.delete('/api/attendance/:id', async (req, res) => {
    const { id } = req.params;
    const [empId, attendanceDate] = String(id).split('__');
    if (!empId || !attendanceDate) {
        return res.status(400).json({ message: 'Invalid attendance id format' });
    }
    try {
        const idColumn = await getAttendanceEmployeeColumn();
        const [result] = await db_1.dbPool.query(`DELETE FROM attendance WHERE ${idColumn} = ? AND attendance_date = ?`, [empId, attendanceDate]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        return res.json({ message: 'Attendance deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Database error' });
    }
});
// app.get('/api/payroll', async (_req: any, res: any) => {
//   try {
//     const payrollIdColumn = await getPayrollIdColumn();
//     const [rows] = await dbPool.query(`SELECT * FROM payroll ORDER BY ${payrollIdColumn} DESC`);
//     return res.json({ message: 'Payroll fetched successfully', data: rows });
//   } catch (error: any) {
//     if (error?.code === 'ER_NO_SUCH_TABLE') {
//       try {
//         await initializeDatabase();
//         const payrollIdColumn = await getPayrollIdColumn();
//         const [rows] = await dbPool.query(`SELECT * FROM payroll ORDER BY ${payrollIdColumn} DESC`);
//         return res.json({ message: 'Payroll fetched successfully', data: rows });
//       } catch (retryError) {
//         console.error(retryError);
//         return res.status(500).json({ message: 'Database error' });
//       }
//     }
//     console.error(error);
//     return res.status(500).json({ message: 'Database error' });
//   }
// });
// app.post('/api/payroll', async (req: any, res: any) => {
//   const {
//     employee_id,
//     payroll_month,
//     basic_salary,
//     allowances,
//     deductions,
//     net_salary
//   } = req.body ?? {};
//   if (
//     !employee_id ||
//     !payroll_month ||
//     basic_salary === undefined ||
//     allowances === undefined ||
//     deductions === undefined ||
//     net_salary === undefined
//   ) {
//     return res.status(400).json({ message: 'Missing required payroll fields' });
//   }
//   const parsedBasicSalary = Number(basic_salary);
//   const parsedAllowances = Number(allowances);
//   const parsedDeductions = Number(deductions);
//   const parsedNetSalary = Number(net_salary);
//   if (
//     !Number.isFinite(parsedBasicSalary) ||
//     !Number.isFinite(parsedAllowances) ||
//     !Number.isFinite(parsedDeductions) ||
//     !Number.isFinite(parsedNetSalary)
//   ) {
//     return res.status(400).json({ message: 'Payroll amount fields must be valid numbers' });
//   }
//   if (!/^\d{4}-\d{2}$/.test(String(payroll_month))) {
//     return res.status(400).json({ message: 'payroll_month must be in YYYY-MM format' });
//   }
//   try {
//     const payrollIdColumn = await getPayrollIdColumn();
//     const [result] = await dbPool.query(
//       `
//       INSERT INTO payroll (employee_id, payroll_month, basic_salary, allowances, deductions, net_salary)
//       VALUES (?, ?, ?, ?, ?, ?)
//       `,
//       [employee_id, payroll_month, parsedBasicSalary, parsedAllowances, parsedDeductions, parsedNetSalary]
//     );
//     const insertId = (result as any).insertId;
//     const [rows] = await dbPool.query(`SELECT * FROM payroll WHERE ${payrollIdColumn} = ?`, [insertId]);
//     const created = Array.isArray(rows) ? rows[0] : (rows as any);
//     return res.status(201).json({ message: 'Payroll created successfully', data: created });
//   } catch (error: any) {
//     if (error?.code === 'ER_NO_SUCH_TABLE') {
//       try {
//         await initializeDatabase();
//         const payrollIdColumn = await getPayrollIdColumn();
//         const [result] = await dbPool.query(
//           `
//           INSERT INTO payroll (employee_id, payroll_month, basic_salary, allowances, deductions, net_salary)
//           VALUES (?, ?, ?, ?, ?, ?)
//           `,
//           [employee_id, payroll_month, parsedBasicSalary, parsedAllowances, parsedDeductions, parsedNetSalary]
//         );
//         const insertId = (result as any).insertId;
//         const [rows] = await dbPool.query(`SELECT * FROM payroll WHERE ${payrollIdColumn} = ?`, [insertId]);
//         const created = Array.isArray(rows) ? rows[0] : (rows as any);
//         return res.status(201).json({ message: 'Payroll created successfully', data: created });
//       } catch (retryError) {
//         console.error(retryError);
//         return res.status(500).json({ message: 'Database error' });
//       }
//     }
//     console.error(error);
//     return res.status(500).json({ message: 'Database error' });
//   }
// });
// app.put('/api/payroll/:id', async (req: any, res: any) => {
//   const { id } = req.params;
//   const {
//     employee_id,
//     payroll_month,
//     basic_salary,
//     allowances,
//     deductions,
//     net_salary
//   } = req.body ?? {};
//   if (
//     !employee_id ||
//     !payroll_month ||
//     basic_salary === undefined ||
//     allowances === undefined ||
//     deductions === undefined ||
//     net_salary === undefined
//   ) {
//     return res.status(400).json({ message: 'Missing required payroll fields' });
//   }
//   const parsedBasicSalary = Number(basic_salary);
//   const parsedAllowances = Number(allowances);
//   const parsedDeductions = Number(deductions);
//   const parsedNetSalary = Number(net_salary);
//   if (
//     !Number.isFinite(parsedBasicSalary) ||
//     !Number.isFinite(parsedAllowances) ||
//     !Number.isFinite(parsedDeductions) ||
//     !Number.isFinite(parsedNetSalary)
//   ) {
//     return res.status(400).json({ message: 'Payroll amount fields must be valid numbers' });
//   }
//   if (!/^\d{4}-\d{2}$/.test(String(payroll_month))) {
//     return res.status(400).json({ message: 'payroll_month must be in YYYY-MM format' });
//   }
//   try {
//     const payrollIdColumn = await getPayrollIdColumn();
//     const [result] = await dbPool.query(
//       `
//       UPDATE payroll
//       SET employee_id = ?, payroll_month = ?, basic_salary = ?, allowances = ?, deductions = ?, net_salary = ?
//       WHERE ${payrollIdColumn} = ?
//       `,
//       [employee_id, payroll_month, parsedBasicSalary, parsedAllowances, parsedDeductions, parsedNetSalary, id]
//     );
//     if (!(result as any).affectedRows) {
//       return res.status(404).json({ message: 'Payroll record not found' });
//     }
//     return res.json({ message: 'Payroll updated successfully' });
//   } catch (error: any) {
//     if (error?.code === 'ER_NO_SUCH_TABLE') {
//       try {
//         await initializeDatabase();
//         const payrollIdColumn = await getPayrollIdColumn();
//         const [retryResult] = await dbPool.query(
//           `
//           UPDATE payroll
//           SET employee_id = ?, payroll_month = ?, basic_salary = ?, allowances = ?, deductions = ?, net_salary = ?
//           WHERE ${payrollIdColumn} = ?
//           `,
//           [employee_id, payroll_month, parsedBasicSalary, parsedAllowances, parsedDeductions, parsedNetSalary, id]
//         );
//         if (!(retryResult as any).affectedRows) {
//           return res.status(404).json({ message: 'Payroll record not found' });
//         }
//         return res.json({ message: 'Payroll updated successfully' });
//       } catch (retryError) {
//         console.error(retryError);
//         return res.status(500).json({ message: 'Database error' });
//       }
//     }
//     console.error(error);
//     return res.status(500).json({ message: 'Database error' });
//   }
// });
// app.delete('/api/payroll/:id', async (req: any, res: any) => {
//   const { id } = req.params;
//   try {
//     const payrollIdColumn = await getPayrollIdColumn();
//     const [result] = await dbPool.query(`DELETE FROM payroll WHERE ${payrollIdColumn} = ?`, [id]);
//     if (!(result as any).affectedRows) {
//       return res.status(404).json({ message: 'Payroll record not found' });
//     }
//     return res.json({ message: 'Payroll deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Database error' });
//   }
// });
// ============================================================
// PAYROLL API
// ============================================================
// GET ALL PAYROLL
app.get('/api/payroll', async (_req, res) => {
    try {
        const [rows] = await db_1.dbPool.query(`
      SELECT
        emp_id,
        payroll_month,
        basic_salary,
        allowances,
        deductions,
        net_salary
      FROM payroll
      ORDER BY emp_id DESC
    `);
        return res.status(200).json({
            message: 'Payroll records fetched successfully',
            data: rows
        });
    }
    catch (error) {
        console.error('GET /api/payroll error:', error);
        if (error?.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({
                message: 'Payroll table does not exist'
            });
        }
        return res.status(500).json({
            message: 'Database error',
            error: error?.message || 'Unknown database error'
        });
    }
});
// GET SINGLE PAYROLL
app.get('/api/payroll/:id', async (req, res) => {
    const { id } = req.params;
    const empId = Number(id);
    if (!Number.isInteger(empId)) {
        return res.status(400).json({
            message: 'Invalid employee ID'
        });
    }
    try {
        const [rows] = await db_1.dbPool.query(`
      SELECT
        emp_id,
        payroll_month,
        basic_salary,
        allowances,
        deductions,
        net_salary
      FROM payroll
      WHERE emp_id = ?
      `, [empId]);
        const data = Array.isArray(rows) ? rows : [];
        if (data.length === 0) {
            return res.status(404).json({
                message: 'Payroll record not found'
            });
        }
        return res.status(200).json({
            message: 'Payroll record fetched successfully',
            data: data[0]
        });
    }
    catch (error) {
        console.error('GET /api/payroll/:id error:', error);
        return res.status(500).json({
            message: 'Database error',
            error: error?.message || 'Unknown database error'
        });
    }
});
// CREATE PAYROLL
app.post('/api/payroll', async (req, res) => {
    const { emp_id, payroll_month, basic_salary, allowances = 0, deductions = 0, net_salary } = req.body ?? {};
    // ------------------------------------------
    // Required field validation
    // ------------------------------------------
    if (emp_id === undefined ||
        emp_id === null ||
        emp_id === '' ||
        !payroll_month ||
        basic_salary === undefined ||
        net_salary === undefined) {
        return res.status(400).json({
            message: 'Missing required payroll fields'
        });
    }
    // ------------------------------------------
    // Convert values to numbers
    // ------------------------------------------
    const parsedEmpId = Number(emp_id);
    const parsedBasicSalary = Number(basic_salary);
    const parsedAllowances = Number(allowances);
    const parsedDeductions = Number(deductions);
    const parsedNetSalary = Number(net_salary);
    // ------------------------------------------
    // Number validation
    // ------------------------------------------
    if (!Number.isInteger(parsedEmpId) ||
        !Number.isFinite(parsedBasicSalary) ||
        !Number.isFinite(parsedAllowances) ||
        !Number.isFinite(parsedDeductions) ||
        !Number.isFinite(parsedNetSalary)) {
        return res.status(400).json({
            message: 'Payroll amount fields must be valid numbers'
        });
    }
    // ------------------------------------------
    // Payroll month validation
    //
    // Example:
    // July 2026
    // August 2026
    // January 2027
    // ------------------------------------------
    if (!/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(String(payroll_month))) {
        return res.status(400).json({
            message: 'payroll_month must be in format like July 2026'
        });
    }
    try {
        // ------------------------------------------
        // Check if employee payroll already exists
        // ------------------------------------------
        const [existingRows] = await db_1.dbPool.query(`
      SELECT emp_id
      FROM payroll
      WHERE emp_id = ?
      `, [parsedEmpId]);
        if (Array.isArray(existingRows) && existingRows.length > 0) {
            return res.status(409).json({
                message: 'Payroll record already exists for this employee'
            });
        }
        // ------------------------------------------
        // Insert payroll
        // ------------------------------------------
        await db_1.dbPool.query(`
      INSERT INTO payroll
      (
        emp_id,
        payroll_month,
        basic_salary,
        allowances,
        deductions,
        net_salary
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `, [
            parsedEmpId,
            String(payroll_month),
            parsedBasicSalary,
            parsedAllowances,
            parsedDeductions,
            parsedNetSalary
        ]);
        // ------------------------------------------
        // Get created payroll
        // ------------------------------------------
        const [rows] = await db_1.dbPool.query(`
      SELECT
        emp_id,
        payroll_month,
        basic_salary,
        allowances,
        deductions,
        net_salary
      FROM payroll
      WHERE emp_id = ?
      `, [parsedEmpId]);
        const created = Array.isArray(rows)
            ? rows[0]
            : rows;
        return res.status(201).json({
            message: 'Payroll created successfully',
            data: created
        });
    }
    catch (error) {
        console.error('POST /api/payroll error:', error);
        // ------------------------------------------
        // Table does not exist
        // ------------------------------------------
        if (error?.code === 'ER_NO_SUCH_TABLE') {
            try {
                await (0, db_1.initializeDatabase)();
                await db_1.dbPool.query(`
          INSERT INTO payroll
          (
            emp_id,
            payroll_month,
            basic_salary,
            allowances,
            deductions,
            net_salary
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `, [
                    parsedEmpId,
                    String(payroll_month),
                    parsedBasicSalary,
                    parsedAllowances,
                    parsedDeductions,
                    parsedNetSalary
                ]);
                const [rows] = await db_1.dbPool.query(`
          SELECT
            emp_id,
            payroll_month,
            basic_salary,
            allowances,
            deductions,
            net_salary
          FROM payroll
          WHERE emp_id = ?
          `, [parsedEmpId]);
                const created = Array.isArray(rows)
                    ? rows[0]
                    : rows;
                return res.status(201).json({
                    message: 'Payroll created successfully',
                    data: created
                });
            }
            catch (retryError) {
                console.error('POST /api/payroll retry error:', retryError);
                return res.status(500).json({
                    message: 'Database error',
                    error: retryError?.message || 'Unknown database error'
                });
            }
        }
        // ------------------------------------------
        // Duplicate primary key
        // ------------------------------------------
        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Payroll record already exists for this employee'
            });
        }
        return res.status(500).json({
            message: 'Database error',
            error: error?.message || 'Unknown database error'
        });
    }
});
// UPDATE PAYROLL
app.put('/api/payroll/:id', async (req, res) => {
    const { id } = req.params;
    const { emp_id, payroll_month, basic_salary, allowances = 0, deductions = 0, net_salary } = req.body ?? {};
    // ------------------------------------------
    // Required field validation
    // ------------------------------------------
    if (emp_id === undefined ||
        emp_id === null ||
        emp_id === '' ||
        !payroll_month ||
        basic_salary === undefined ||
        net_salary === undefined) {
        return res.status(400).json({
            message: 'Missing required payroll fields'
        });
    }
    const payrollId = Number(id);
    const parsedEmpId = Number(emp_id);
    const parsedBasicSalary = Number(basic_salary);
    const parsedAllowances = Number(allowances);
    const parsedDeductions = Number(deductions);
    const parsedNetSalary = Number(net_salary);
    // ------------------------------------------
    // Number validation
    // ------------------------------------------
    if (!Number.isInteger(payrollId) ||
        !Number.isInteger(parsedEmpId) ||
        !Number.isFinite(parsedBasicSalary) ||
        !Number.isFinite(parsedAllowances) ||
        !Number.isFinite(parsedDeductions) ||
        !Number.isFinite(parsedNetSalary)) {
        return res.status(400).json({
            message: 'Payroll fields must contain valid numbers'
        });
    }
    // ------------------------------------------
    // Month validation
    // ------------------------------------------
    if (!/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(String(payroll_month))) {
        return res.status(400).json({
            message: 'payroll_month must be in format like July 2026'
        });
    }
    try {
        // ------------------------------------------
        // Update payroll
        // ------------------------------------------
        const [result] = await db_1.dbPool.query(`
      UPDATE payroll
      SET
        emp_id = ?,
        payroll_month = ?,
        basic_salary = ?,
        allowances = ?,
        deductions = ?,
        net_salary = ?
      WHERE emp_id = ?
      `, [
            parsedEmpId,
            String(payroll_month),
            parsedBasicSalary,
            parsedAllowances,
            parsedDeductions,
            parsedNetSalary,
            payrollId
        ]);
        if (!result.affectedRows) {
            return res.status(404).json({
                message: 'Payroll record not found'
            });
        }
        // ------------------------------------------
        // Get updated record
        // ------------------------------------------
        const [rows] = await db_1.dbPool.query(`
      SELECT
        emp_id,
        payroll_month,
        basic_salary,
        allowances,
        deductions,
        net_salary
      FROM payroll
      WHERE emp_id = ?
      `, [parsedEmpId]);
        const updated = Array.isArray(rows)
            ? rows[0]
            : rows;
        return res.status(200).json({
            message: 'Payroll updated successfully',
            data: updated
        });
    }
    catch (error) {
        console.error('PUT /api/payroll/:id error:', error);
        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Another payroll record already uses this employee ID'
            });
        }
        return res.status(500).json({
            message: 'Database error',
            error: error?.message || 'Unknown database error'
        });
    }
});
// DELETE PAYROLL
app.delete('/api/payroll/:id', async (req, res) => {
    const { id } = req.params;
    const empId = Number(id);
    if (!Number.isInteger(empId)) {
        return res.status(400).json({
            message: 'Invalid employee ID'
        });
    }
    try {
        const [result] = await db_1.dbPool.query(`
      DELETE FROM payroll
      WHERE emp_id = ?
      `, [empId]);
        if (!result.affectedRows) {
            return res.status(404).json({
                message: 'Payroll record not found'
            });
        }
        return res.status(200).json({
            message: 'Payroll deleted successfully'
        });
    }
    catch (error) {
        console.error('DELETE /api/payroll/:id error:', error);
        return res.status(500).json({
            message: 'Database error',
            error: error?.message || 'Unknown database error'
        });
    }
});
app.get('/api/documents', async (_req, res) => {
    try {
        const [rows] = await db_1.dbPool.query('SELECT * FROM documents');
        res.json({ message: 'Documents fetched successfully', data: rows });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});
app.post('/api/documents', async (req, res) => {
    const { employee_id, doc_type, doc_name, issue_date, file_name } = req.body ?? {};
    if (!employee_id || !doc_type || !doc_name || !issue_date || !file_name) {
        return res.status(400).json({ message: 'Missing required document fields' });
    }
    try {
        const [result] = await db_1.dbPool.query(`INSERT INTO documents (employee_id, doc_type, doc_name, issue_date, file_name) VALUES (?, ?, ?, ?, ?)`, [employee_id, doc_type, doc_name, issue_date, file_name]);
        // @ts-ignore
        const insertId = result.insertId;
        const [rows] = await db_1.dbPool.query('SELECT * FROM documents WHERE id = ?', [insertId]);
        const created = Array.isArray(rows) ? rows[0] : rows;
        res.status(201).json({ message: 'Document created', data: created });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});
app.put('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    const { employee_id, doc_type, doc_name, issue_date, file_name } = req.body ?? {};
    if (!employee_id || !doc_type || !doc_name || !issue_date || !file_name) {
        return res.status(400).json({ message: 'Missing required document fields' });
    }
    try {
        const [result] = await db_1.dbPool.query(`UPDATE documents SET employee_id = ?, doc_type = ?, doc_name = ?, issue_date = ?, file_name = ? WHERE id = ?`, [employee_id, doc_type, doc_name, issue_date, file_name, id]);
        // @ts-ignore
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json({ message: 'Document updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});
app.delete('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db_1.dbPool.query('DELETE FROM documents WHERE id = ?', [id]);
        // @ts-ignore
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});
async function bootstrap() {
    await (0, db_1.verifyDatabaseConnection)();
    await (0, db_1.initializeDatabase)();
    console.log('MySQL connection established successfully');
    app.listen(port, () => {
        console.log(`HR backend starter listening on http://localhost:${port}`);
    });
}
bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
