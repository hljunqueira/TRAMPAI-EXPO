import pg from '../../api/node_modules/pg/lib/index.js';
const { Client } = pg;

// Credenciais da VPS extraídas do deploy.sh e .env
const connectionString = "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres";

async function listUsers() {
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("🔄 Conectando ao banco de dados na VPS (23.80.89.116:5437)...");
    await client.connect();
    
    const res = await client.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        is_provider,
        email_verified_at, 
        verification_status, 
        banned_at,
        phone,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log("\n=== USUÁRIOS CADASTRADOS NO BANCO DA VPS ===\n");
    
    const formattedUsers = res.rows.map(u => ({
      Nome: u.name,
      Email: u.email,
      Role: u.role,
      Prestador: u.is_provider ? "🛠️ SIM" : "👤 NÃO",
      Verificado: u.email_verified_at ? "✅ SIM" : "❌ NÃO",
      Status: u.verification_status || "PENDING",
      Banido: u.banned_at ? "🚫 SIM" : "✅ NÃO",
      Cidade: u.city || "---",
      Bairro: u.neighborhood || "---",
      WhatsApp: u.phone || "---",
      Criado_Em: new Date(u.created_at).toLocaleDateString('pt-BR')
    }));

    console.table(formattedUsers);
    
    if (res.rows.length === 0) {
      console.log("Nenhum usuário encontrado.");
    }

  } catch (err) {
    console.error("\n❌ Erro ao conectar à VPS:", err.message);
    console.log("\nDICA: Certifique-se de que a porta 5437 está aberta no firewall da VPS.");
  } finally {
    await client.end();
  }
}

listUsers();
