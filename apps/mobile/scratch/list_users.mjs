import pg from '../../api/node_modules/pg/lib/index.js';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ler .env manualmente para pegar a DATABASE_URL
const envPath = path.join(__dirname, '..', '..', '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

if (!dbUrlMatch) {
  console.error("DATABASE_URL não encontrada no .env");
  process.exit(1);
}

const connectionString = dbUrlMatch[1].trim();

async function listUsers() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        email_verified_at, 
        verification_status, 
        banned_at,
        phone
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log("\n=== USUÁRIOS CADASTRADOS NO BANCO (VPS/LOCAL) ===\n");
    
    const formattedUsers = res.rows.map(u => ({
      ID: u.id.slice(0, 8) + "...",
      Nome: u.name,
      Email: u.email,
      Role: u.role,
      Verified: u.email_verified_at ? "✅ SIM" : "❌ NÃO",
      Status: u.verification_status || "PENDING",
      Banned: u.banned_at ? "🚫 SIM" : "✅ NÃO",
      Phone: u.phone || "---"
    }));

    console.table(formattedUsers);
    
  } catch (err) {
    console.error("Erro ao conectar ou consultar o banco:", err.message);
    console.log("\nDICA: Verifique se o container do banco está rodando e se a porta 5437 está acessível.");
  } finally {
    await client.end();
  }
}

listUsers();
