import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp@i2025!Secure@localhost:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log("Conectado ao banco...");
    
    // Adicionar colunas faltantes se não existirem
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id uuid;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_id uuid;
    `);
    
    console.log("✅ Colunas adicionadas com sucesso!");
  } catch (err) {
    console.error("❌ Erro:", err);
  } finally {
    await client.end();
  }
}

run();
