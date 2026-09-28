import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'] as const;

function getDatabaseConfig() {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME as string,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
  };
}

export const dbPool = mysql.createPool(getDatabaseConfig());

export async function verifyDatabaseConnection(): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

export async function initializeDatabase(): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`employee_management\` (
        emp_id VARCHAR(20) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`documents\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) NOT NULL,
        doc_type VARCHAR(100) NOT NULL,
        doc_name VARCHAR(255) NOT NULL,
        issue_date DATE NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    connection.release();
  }
}

