import { db, users, transactions } from "../../../packages/db/src/index";
import { eq, sql } from "drizzle-orm";

async function grantCredits() {
  try {
    // Buscar o prestador Henrique - PC (ou o primeiro provider se não achar pelo nome)
    let provider = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, 'provider')
    });

    if (!provider) {
       console.log("Nenhum prestador encontrado no banco.");
       process.exit(1);
    }

    console.log(`Concedendo 1000 créditos para: ${provider.name} (${provider.id})`);

    await db.update(users)
      .set({ creditBalance: sql`credit_balance + 1000` })
      .where(eq(users.id, provider.id));

    await db.insert(transactions).values({
      userId: provider.id,
      type: "ADMIN_GRANT",
      credits: 1000,
      amountCents: 0,
      description: "Bônus de 1000 créditos concedido pelo sistema",
    });

    console.log("Créditos concedidos com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao conceder créditos:", error);
    process.exit(1);
  }
}

grantCredits();
