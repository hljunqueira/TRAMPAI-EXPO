import pg from '../../api/node_modules/pg/lib/index.js';
const { Client } = pg;
import bcrypt from '../../api/node_modules/bcryptjs/index.js';

const connectionString = "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres";

async function setupTestData() {
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("🔄 Conectando à VPS para configurar usuários...");
    await client.connect();
    
    const hashedPassword = await bcrypt.hash("123456", 10);
    const now = new Date();

    // 1. Configurar Administrador (Sempre verificado)
    await client.query(`
      UPDATE users SET 
        verification_status = 'APPROVED',
        email_verified_at = $1
      WHERE role = 'admin' OR email = 'henrique@trampai.com.br'
    `, [now]);

    // 2. Atualizar Prestador de Teste
    await client.query(`
      UPDATE users SET 
        name = 'Marcos Oliveira (Prestador)',
        phone = '(11) 97777-6666',
        city = 'São Paulo',
        neighborhood = 'Pinheiros',
        verification_status = 'APPROVED',
        email_verified_at = $1,
        password = $2,
        is_provider = true,
        provider_bio = 'Eletricista e encanador com 15 anos de experiência. Atendimento rápido e limpo.',
        provider_categories = ARRAY['Eletricista', 'Encanador']
      WHERE email = 'prestadorteste@trampai.com.br'
    `, [now, hashedPassword]);

    // 3. Atualizar Cliente de Teste
    await client.query(`
      UPDATE users SET 
        name = 'Julia Costa (Cliente)',
        phone = '(11) 96666-5555',
        city = 'São Paulo',
        neighborhood = 'Vila Madalena',
        verification_status = 'APPROVED',
        email_verified_at = $1,
        password = $2
      WHERE email = 'clienteteste@trampai.com.br'
    `, [now, hashedPassword]);

    console.log("\n✅ Usuários configurados!");
    console.log("Admin: henrique@trampai.com.br (Verificação removida/aprovada)");
    console.log("Prestador: prestadorteste@trampai.com.br (Senha: 123456)");
    console.log("Cliente: clienteteste@trampai.com.br (Senha: 123456)");
    
  } catch (err) {
    console.error("\n❌ Erro ao configurar dados:", err.message);
  } finally {
    await client.end();
  }
}

setupTestData();
