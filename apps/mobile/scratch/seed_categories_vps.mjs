import pg from '../../api/node_modules/pg/lib/index.js';
const { Client } = pg;

const connectionString = "postgresql://postgres:Tramp%40i2025!Secure@23.80.89.116:5437/postgres";

async function seedCategories() {
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("🔄 Conectando ao banco da VPS para popular categorias...");
    await client.connect();
    
    const categories = [
      ['Pedreiro', 'hammer-wrench'],
      ['Eletricista', 'flash'],
      ['Encanador', 'water-pump'],
      ['Pintor', 'format-paint'],
      ['Limpeza', 'broom'],
      ['Mudança', 'truck-delivery'],
      ['Outros', 'dots-horizontal']
    ];

    for (const [name, icon] of categories) {
      console.log(`Checking category: ${name}`);
      const res = await client.query('SELECT id FROM categories WHERE name = $1', [name]);
      if (res.rows.length === 0) {
        await client.query('INSERT INTO categories (name, icon) VALUES ($1, $2)', [name, icon]);
        console.log(`✅ Category ${name} created.`);
      } else {
        console.log(`🟡 Category ${name} already exists.`);
      }
    }

    console.log("🚀 SUCESSO! Banco de dados populado.");

  } catch (err) {
    console.error("\n❌ Erro na operação:", err.message);
  } finally {
    await client.end();
  }
}

seedCategories();
