import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp@i2025!Secure@localhost:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, credit_balance, name FROM users WHERE email = 'henrique@trampai.com.br'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
