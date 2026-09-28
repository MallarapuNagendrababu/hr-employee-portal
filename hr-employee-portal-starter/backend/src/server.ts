import express from 'express';
import { initializeDatabase, verifyDatabaseConnection } from './config/db.js';
import { dbPool } from './config/db';

const app = express();
const port = 3000;

app.use(express.json());

app.use((_: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.options(/.*/, (_: any, res: any) => {
  res.sendStatus(204);
});

app.get('/api/health', (_: any, res: any) => {
  res.json({ status: 'ok', service: 'hr-backend', timestamp: new Date().toISOString() });
});

app.get('/api/routes', (_: any, res: any) => {
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

app.get('/api/dashboard', (_: any, res: any) => {
  res.json({ message: 'Dashboard starter route' });
});



app.get('/api/employees', async (_req: any, res: any) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM employee_management');

    res.json({
      message: 'Employee data fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Database error'
    });
  }
});

app.put('/api/employees/:empId', async (req: any, res: any) => {
  const { empId } = req.params;
  const { first_name, last_name, phone_number, email } = req.body ?? {};

  if (!first_name || !last_name || !phone_number || !email) {
    return res.status(400).json({ message: 'Missing required employee fields' });
  }

  try {
    const [result] = await dbPool.query(
      `
      UPDATE employee_management
      SET first_name = ?, last_name = ?, phone_number = ?, email = ?
      WHERE emp_id = ?
      `,
      [first_name, last_name, phone_number, email, empId]
    );

    const updateResult = result as { affectedRows?: number };
    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
});

app.delete('/api/employees/:empId', async (req: any, res: any) => {
  const { empId } = req.params;

  try {
    const [result] = await dbPool.query('DELETE FROM employee_management WHERE emp_id = ?', [empId]);
    const deleteResult = result as { affectedRows?: number };

    if (!deleteResult.affectedRows) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/leaves', (_: any, res: any) => {
  res.json({ message: 'Leave Management starter route', data: [] });
});

app.get('/api/attendance', (_: any, res: any) => {
  res.json({ message: 'Attendance starter route', data: [] });
});

app.get('/api/payroll', (_: any, res: any) => {
  res.json({ message: 'Payroll starter route', data: [] });
});

app.get('/api/documents', (_: any, res: any) => {
  res.json({ message: 'Documents starter route', data: [] });
});

app.get('/api/documents', async (_req: any, res: any) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM documents');
    res.json({ message: 'Documents fetched successfully', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/documents', async (req: any, res: any) => {
  const { employee_id, doc_type, doc_name, issue_date, file_name } = req.body ?? {};
  if (!employee_id || !doc_type || !doc_name || !issue_date || !file_name) {
    return res.status(400).json({ message: 'Missing required document fields' });
  }

  try {
    const [result] = await dbPool.query(
      `INSERT INTO documents (employee_id, doc_type, doc_name, issue_date, file_name) VALUES (?, ?, ?, ?, ?)`,
      [employee_id, doc_type, doc_name, issue_date, file_name]
    );
    // @ts-ignore
    const insertId = (result as any).insertId;
    const [rows] = await dbPool.query('SELECT * FROM documents WHERE id = ?', [insertId]);
    const created = Array.isArray(rows) ? rows[0] : (rows as any);
    res.status(201).json({ message: 'Document created', data: created });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/documents/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const { employee_id, doc_type, doc_name, issue_date, file_name } = req.body ?? {};
  if (!employee_id || !doc_type || !doc_name || !issue_date || !file_name) {
    return res.status(400).json({ message: 'Missing required document fields' });
  }

  try {
    const [result] = await dbPool.query(
      `UPDATE documents SET employee_id = ?, doc_type = ?, doc_name = ?, issue_date = ?, file_name = ? WHERE id = ?`,
      [employee_id, doc_type, doc_name, issue_date, file_name, id]
    );
    // @ts-ignore
    if (!(result as any).affectedRows) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.delete('/api/documents/:id', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [result] = await dbPool.query('DELETE FROM documents WHERE id = ?', [id]);
    // @ts-ignore
    if (!(result as any).affectedRows) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

async function bootstrap(): Promise<void> {
  await verifyDatabaseConnection();
  await initializeDatabase();
  console.log('MySQL connection established successfully');

  app.listen(port, () => {
    console.log(`HR backend starter listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

