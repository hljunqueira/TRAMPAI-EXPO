const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("🚀 Conectado à VPS. Iniciando migração...");

    // 1. push_token
    console.log("🔹 Adicionando 'push_token'...");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;").catch(e => console.log(e.message));

    // 2. refunded_at
    console.log("🔹 Adicionando 'refunded_at'...");
    await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;").catch(e => console.log(e.message));

    // 3. audit_logs
    console.log("🔹 Criando 'audit_logs'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `).catch(e => console.log(e.message));

    console.log("✅ Migração concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro fatal:", err);
  } finally {
    await client.end();
  }
}

runMigration();
