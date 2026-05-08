import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Tramp@i2025!Secure@localhost:5437/postgres"
});

async function run() {
  try {
    await client.connect();
    
    const userId = '90f330e5-9674-42ec-a7ea-3d7d01eef1d9';
    const creditsToAdd = 10;
    
    await client.query("BEGIN");
    
    // 1. Atualizar saldo
    await client.query("UPDATE users SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2", [creditsToAdd, userId]);
    
    // 2. Registrar transação
    await client.query(`
      INSERT INTO transactions (id, user_id, type, credits, amount_cents, description, created_at)
      VALUES (gen_random_uuid(), $1, 'PURCHASE', $2, 990, 'Compra de Pacote Básico (Recuperação Manual)', NOW())
    `, [userId, creditsToAdd]);
    
    await client.query("COMMIT");
    
    console.log("✅ Créditos adicionados e transação registrada!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro:", err);
  } finally {
    await client.end();
  }
}

run();
