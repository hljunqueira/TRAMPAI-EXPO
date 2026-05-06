import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS images text[];");
    console.log("Column images added successfully to jobs table (or already exists)");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
