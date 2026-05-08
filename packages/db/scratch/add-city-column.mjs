import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PROD;

if (!databaseUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function migrate() {
    try {
        console.log("Adding 'city' column to 'jobs' table...");
        await pool.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city TEXT;");
        console.log("Success!");
    } catch (err) {
        console.error("Error migrating:", err);
    } finally {
        await pool.end();
    }
}

migrate();
