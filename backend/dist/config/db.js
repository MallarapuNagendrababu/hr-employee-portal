"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = void 0;
exports.verifyDatabaseConnection = verifyDatabaseConnection;
exports.initializeDatabase = initializeDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
const promise_1 = __importDefault(require("mysql2/promise"));
dotenv_1.default.config();
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
function getDatabaseConfig() {
    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        dateStrings: true,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
        queueLimit: 0
    };
}
exports.dbPool = promise_1.default.createPool(getDatabaseConfig());
async function verifyDatabaseConnection() {
    const connection = await exports.dbPool.getConnection();
    try {
        await connection.query('SELECT 1');
    }
    finally {
        connection.release();
    }
}
async function initializeDatabase() {
    const connection = await exports.dbPool.getConnection();
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
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`leaves\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) NOT NULL,
        casual_leave INT NOT NULL,
        sick_leave INT NOT NULL,
        earned_leave INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`attendance\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id VARCHAR(20) NOT NULL,
        attendance_date DATE NOT NULL,
        check_in_time TIME NOT NULL,
        check_out_time TIME NOT NULL,
        working_hours VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`payroll\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) NOT NULL,
        payroll_month VARCHAR(7) NOT NULL,
        basic_salary DECIMAL(12, 2) NOT NULL,
        allowances DECIMAL(12, 2) NOT NULL,
        deductions DECIMAL(12, 2) NOT NULL,
        net_salary DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
    finally {
        connection.release();
    }
}
