import { db, users, transactions } from "../../../packages/db/src/index";
import { eq, sql } from "drizzle-orm";

async function grantCreditsToSpecificUser() {
  try {
    const email = "henrique@trampai.com.br";
    
    let user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });

    if (!user) {
       console.log(`Usuário com email ${email} não encontrado.`);
       process.exit(1);
    }

    console.log(`Concedendo 1000 créditos para: ${user.name} (${user.id})`);

    await db.update(users)
      .set({ creditBalance: sql`credit_balance + 1000` })
      .where(eq(users.id, user.id));

    await db.insert(transactions).values({
      userId: user.id,
      type: "ADMIN_GRANT",
      credits: 1000,
      amountCents: 0,
      description: "Bônus de 1000 créditos concedido pelo sistema (Henrique)",
    });

    console.log("Créditos concedidos com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao conceder créditos:", error);
    process.exit(1);
  }
}

grantCreditsToSpecificUser();
