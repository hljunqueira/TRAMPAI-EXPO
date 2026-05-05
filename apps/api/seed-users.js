import bcrypt from "bcryptjs";
import pg from "pg";

// Abordagem direta via pg para garantir que funcione sem erros de importação de workspace
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5437/postgres";

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log("Conectado ao banco de dados...");

    const usersToCreate = [
      {
        name: "Henrique Linhares Junqueira",
        email: "henrique@trampai.com.br",
        password: "183834@Hlj",
        role: "admin",
      },
      {
        name: "Cliente Teste",
        email: "clienteteste@trampai.com.br",
        password: "123456",
        role: "client",
      },
      {
        name: "Prestador Teste",
        email: "prestadorteste@trampai.com.br",
        password: "123456",
        role: "provider",
      },
    ];

    for (const u of usersToCreate) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const now = new Date();

      try {
        // Inserção direta via SQL
        await client.query(
          `INSERT INTO users (name, email, password, role, email_verified_at, verification_status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           ON CONFLICT (email) DO UPDATE SET 
           password = EXCLUDED.password, 
           name = EXCLUDED.name, 
           role = EXCLUDED.role,
           email_verified_at = EXCLUDED.email_verified_at,
           verification_status = EXCLUDED.verification_status,
           updated_at = EXCLUDED.updated_at`,
          [u.name, u.email, hashedPassword, u.role, now, 'APPROVED', now, now]
        );
        console.log(`Usuário ${u.email} criado/atualizado com sucesso!`);
      } catch (err) {
        console.error(`Erro ao criar ${u.email}:`, err.message);
      }
    }
  } finally {
    await client.end();
    console.log("Processo concluído.");
  }
}

seed().catch(console.error);
