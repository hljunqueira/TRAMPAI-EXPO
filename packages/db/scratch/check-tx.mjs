import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp@i2025!Secure@localhost:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT * FROM transactions WHERE user_id = '90f330e5-9674-42ec-a7ea-3d7d01eef1d9' ORDER BY created_at DESC LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
