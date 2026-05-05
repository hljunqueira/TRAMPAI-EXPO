import { db, users } from "../packages/db/src";
import { desc } from "drizzle-orm";

async function listUsers() {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    console.log("=== USUÁRIOS CADASTRADOS NO BANCO (VPS) ===");
    console.table(allUsers.map(u => ({
      ID: u.id,
      Nome: u.name,
      Email: u.email,
      Role: u.role,
      Verified: u.emailVerifiedAt ? "SIM" : "NÃO",
      Status: u.verificationStatus || "PENDING",
      Banned: u.bannedAt ? "SIM" : "NÃO",
      Phone: u.phone || "---"
    })));
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
  } finally {
    process.exit(0);
  }
}

listUsers();
