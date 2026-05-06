import { Router } from "express";
import { db, users, transactions, creditPackages } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { stripe } from "../lib/stripe";
import { createNotification } from "../utils/notifications";

const router = Router();

// Listar pacotes de créditos ativos
router.get("/payments/packages", async (req, res: any) => {
  try {
    const packages = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.sortOrder);

    return res.json(packages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar pacotes" });
  }
});

// Criar sessão de Checkout
router.post("/payments/checkout", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { packageId } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const [pkg] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, packageId));

    if (!pkg) return res.status(404).json({ error: "Pacote não encontrado" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: pkg.name,
              description: `${pkg.credits + pkg.bonusCredits} créditos para o Trampaí`,
            },
            unit_amount: pkg.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment-cancel`,
      customer_email: req.user.email,
      metadata: {
        userId: userId,
        packageId: pkg.id,
        credits: (pkg.credits + pkg.bonusCredits).toString(),
      },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

// Webhook para processar o pagamento
router.post("/payments/webhook", async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lidar com o evento
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { userId, credits, packageId } = session.metadata;

    console.log(`✅ Pagamento confirmado para o usuário ${userId}: ${credits} créditos`);

    try {
      await db.transaction(async (tx) => {
        // 1. Atualizar saldo do usuário
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user) {
          await tx
            .update(users)
            .set({ 
              creditBalance: user.creditBalance + parseInt(credits),
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));

          // 2. Registrar transação
          await tx.insert(transactions).values({
            userId: userId,
            type: "PURCHASE",
            credits: parseInt(credits),
            amountCents: session.amount_total,
            description: `Compra de Pacote: ${session.amount_total / 100} BRL`,
          });
        }
      });

      // 3. Notificar o usuário
      await createNotification(
        userId,
        "Créditos Adicionados! 💎",
        `Seu pagamento foi confirmado e ${credits} créditos foram adicionados à sua conta.`,
        "purchase",
        { amount: credits }
      );

    } catch (err) {
      console.error("Erro ao processar crédito do webhook:", err);
      return res.status(500).json({ error: "Erro interno ao processar créditos" });
    }
  }

  res.json({ received: true });
});

export default router;
