"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_js_1 = require("./config/db.js");
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
app.get('/api/leaves', (_, res) => {
    res.json({ message: 'Leave Management starter route', data: [] });
});
app.get('/api/attendance', (_, res) => {
    res.json({ message: 'Attendance starter route', data: [] });
});
app.get('/api/payroll', (_, res) => {
    res.json({ message: 'Payroll starter route', data: [] });
});
app.get('/api/documents', (_, res) => {
    res.json({ message: 'Documents starter route', data: [] });
});
async function bootstrap() {
    await (0, db_js_1.verifyDatabaseConnection)();
    await (0, db_js_1.initializeDatabase)();
    console.log('MySQL connection established successfully');
    app.listen(port, () => {
        console.log(`HR backend starter listening on http://localhost:${port}`);
    });
}
bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
