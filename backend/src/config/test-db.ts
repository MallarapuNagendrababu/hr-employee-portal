import {
  verifyDatabaseConnection,
  initializeDatabase
} from './db';

async function testDatabase() {
  try {
    await verifyDatabaseConnection();

    console.log(' MySQL connection successful');

    await initializeDatabase();

    console.log(' Database tables initialized successfully');

    process.exit(0);
  } catch (error) {
    console.error(' MySQL connection failed:', error);
    process.exit(1);
  }
}

testDatabase();
