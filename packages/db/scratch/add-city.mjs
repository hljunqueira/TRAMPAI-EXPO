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
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city TEXT;
    `);
    
    console.log("✅ Coluna 'city' adicionada com sucesso!");
  } catch (err) {
    console.error("❌ Erro:", err);
  } finally {
    await client.end();
  }
}

run();
