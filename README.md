# HR & Employee Portal Starter

Roles:
- Admin
- HR
- Employee

Tech:
- React + TypeScript
- Node.js + TypeScript

This is a starter scaffold. Extend modules:
- Employee Management
- Leave Management
- Attendance
- Payroll
- Documents
- Dashboard

## MySQL connection setup (backend)

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create `backend/.env` using `backend/.env.example` values:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=nagababu123
   DB_NAME=employee_portal
   DB_CONNECTION_LIMIT=10
   ```

3. Start backend:

   ```bash
   npm run dev
   ```

Backend now initializes a MySQL pool and validates connectivity on startup before listening for requests.
