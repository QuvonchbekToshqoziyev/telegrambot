import pg from "pg";
import { config } from "dotenv";

config({ silent: true });

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/tgbot";

export const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        
        await client.query(`
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
            );
            
            CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_is_admin ON users(is_admin);
        `);
        
        client.release();
        return pool;
    } catch (error) {
        console.error("❌ PostgreSQL connection failed:", error.message);
        return null;
    }
};

export const disconnectDB = async () => {
    try {
        await pool.end();
    } catch (error) {
        console.error("❌ PostgreSQL disconnection failed:", error.message);
    }
};

export default pool;
