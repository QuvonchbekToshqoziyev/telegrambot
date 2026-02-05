import pg from "pg";
import { config } from "dotenv";

config();

const { Pool } = pg;

// Connect to default postgres database to create tgbot database
const adminPool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: "postgres"
});

// Connect to app database to create tables
const appPool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE || "tgbot"
});

const initializeDatabase = async () => {
    try {
        // Step 1: Create database if it doesn't exist
        const adminClient = await adminPool.connect();
        console.log("\u2705 Connected to PostgreSQL server");

        const dbCheckResult = await adminClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.DB_DATABASE || "tgbot"]
        );

        if (dbCheckResult.rows.length === 0) {
            await adminClient.query(`CREATE DATABASE "${process.env.DB_DATABASE || "tgbot"}"`);
            console.log(`\u2705 Database "${process.env.DB_DATABASE || "tgbot"}" created successfully`);
        } else {
            console.log(`\u2705 Database "${process.env.DB_DATABASE || "tgbot"}" already exists`);
        }

        adminClient.release();
        await adminPool.end();

        // Step 2: Create tables
        const appClient = await appPool.connect();
        console.log("\u2705 Connected to app database");

        // Create users table
        await appClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                username VARCHAR(20) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                region VARCHAR(100) DEFAULT 'Noma''lum',
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                channel_joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("\u2705 Users table created/verified");

        // Create indexes
        await appClient.query(`CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id)`);
        await appClient.query(`CREATE INDEX IF NOT EXISTS idx_username ON users(username)`);
        await appClient.query(`CREATE INDEX IF NOT EXISTS idx_is_admin ON users(is_admin)`);
        console.log("\u2705 Indexes created/verified");

        appClient.release();
        await appPool.end();

        console.log("\u2705 Database initialization complete\n");
        process.exit(0);
    } catch (error) {
        console.error("\u274c Database initialization failed:", error.message);
        console.log("Make sure PostgreSQL is running and credentials are correct");
        process.exit(1);
    }
};

initializeDatabase();
