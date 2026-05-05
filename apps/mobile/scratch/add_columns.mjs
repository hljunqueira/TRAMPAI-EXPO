import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_images text[];");
    console.log("Column portfolio_images added successfully (or already exists)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_unlocked_portfolio boolean DEFAULT false;");
    console.log("Column has_unlocked_portfolio added successfully (or already exists)");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
