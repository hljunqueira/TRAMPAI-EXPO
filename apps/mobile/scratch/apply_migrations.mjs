import { db } from "../../../packages/db/src/index.ts";

import { sql } from "drizzle-orm";

async function applyMigrationsManually() {
  try {
    console.log("🚀 Iniciando migração manual na VPS...");

    // 1. Adicionar campo push_token na tabela users
    console.log("🔹 Adicionando campo 'push_token' em 'users'...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;`);

    // 2. Adicionar campo refunded_at na tabela leads
    console.log("🔹 Adicionando campo 'refunded_at' em 'leads'...");
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;`);

    // 3. Criar tabela audit_logs
    console.log("🔹 Criando tabela 'audit_logs'...");
    await db.execute(sql`
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
    `);

    console.log("✅ Migração concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    process.exit(1);
  }
}

applyMigrationsManually();
