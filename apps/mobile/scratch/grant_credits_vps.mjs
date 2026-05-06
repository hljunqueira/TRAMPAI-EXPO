import pg from '../../api/node_modules/pg/lib/index.js';
const { Client } = pg;

const connectionString = "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres";

async function grantCreditsVPS() {
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const email = "henrique@trampai.com.br";
    console.log(`🔄 Conectando para adicionar créditos ao usuário: ${email}`);
    await client.connect();
    
    // 1. Buscar o usuário
    const userRes = await client.query('SELECT id, name, credit_balance FROM users WHERE email = $1', [email]);
    
    if (userRes.rows.length === 0) {
      console.log(`❌ Usuário ${email} não encontrado no banco da VPS.`);
      return;
    }

    const user = userRes.rows[0];
    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);
    console.log(`Saldo atual: ${user.credit_balance}`);

    // 2. Iniciar transação
    await client.query('BEGIN');

    // 3. Atualizar saldo
    await client.query('UPDATE users SET credit_balance = credit_balance + 1000 WHERE id = $1', [user.id]);

    // 4. Inserir transação de auditoria
    await client.query(`
      INSERT INTO transactions (user_id, type, credits, amount_cents, description, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      user.id, 
      'ADMIN_GRANT', 
      1000, 
      0, 
      'Bônus de 1000 créditos concedido pelo sistema (VPS)'
    ]);

    await client.query('COMMIT');
    console.log(`🚀 SUCESSO! 1000 créditos adicionados para ${email}.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("\n❌ Erro na operação:", err.message);
  } finally {
    await client.end();
  }
}

grantCreditsVPS();
