"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function testDatabase() {
    try {
        await (0, db_1.verifyDatabaseConnection)();
        console.log(' MySQL connection successful');
        await (0, db_1.initializeDatabase)();
        console.log(' Database tables initialized successfully');
        process.exit(0);
    }
    catch (error) {
        console.error(' MySQL connection failed:', error);
        process.exit(1);
    }
}
testDatabase();
