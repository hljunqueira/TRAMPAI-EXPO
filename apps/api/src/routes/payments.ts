import { Router } from "express";
import { db, users, transactions, creditPackages } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { stripe } from "../lib/stripe";
import { createNotification } from "../utils/notifications";
import { getConfig } from "./admin";
import { CONFIG_KEYS } from "@workspace/db/schema";

const router = Router();

// Listar pacotes de creditos ativos
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

// Criar sessao de Checkout
router.post("/payments/checkout", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { packageId } = req.body;
    console.log("🛒 [Checkout] Iniciando para pacote:", packageId);

    if (!req.user?.userId) {
      console.log("❌ [Checkout] Usuario não identificado no req");
      return res.status(401).json({ error: "Nao autorizado" });
    }

    let pkgName, pkgCredits, pkgPriceCents, pkgId;

    if (packageId === "custom") {
      const customCredits = parseInt(req.body.customCredits, 10);
      if (!customCredits || isNaN(customCredits) || customCredits < 10) {
        return res.status(400).json({ error: "Minimo de 10 creditos" });
      }
      
      // Buscar preço unitário da config
      const unitPriceStr = await getConfig(CONFIG_KEYS.CREDIT_UNIT_PRICE_CENTS);
      const unitPrice = parseFloat(unitPriceStr || "99.9");

      pkgName = `Avulso (${customCredits} CR)`;
      pkgCredits = customCredits;
      pkgPriceCents = Math.round(customCredits * unitPrice);
      pkgId = "custom";
    } else {
      console.log("🔍 [Checkout] Buscando pacote no banco...");
      const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId)).limit(1);

      if (!pkg) {
        console.log("❌ [Checkout] Pacote nao encontrado:", packageId);
        return res.status(404).json({ error: "Pacote nao encontrado" });
      }

      pkgName = pkg.name;
      pkgCredits = pkg.credits + pkg.bonusCredits;
      pkgPriceCents = pkg.priceCents;
      pkgId = pkg.id;
    }

    const paymentMethods = ["card"];

    console.log("💳 [Checkout] Criando sessao no Stripe para:", pkgName);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods as any,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Creditos Trampai - ${pkgName}`,
              description: `${pkgCredits} creditos para sua conta`,
            },
            unit_amount: Math.round(pkgPriceCents),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL}/api/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/api/payment-cancel`,
      metadata: {
        userId: req.user.userId,
        packageId: pkgId,
        credits: pkgCredits.toString(),
      },
    });

    console.log("✅ [Checkout] Sessao criada com sucesso:", session.id);
    return res.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("❌ [Checkout] Erro fatal:", err);
    return res.status(500).json({ error: "Erro ao criar sessao de pagamento", details: err.message });
  }
});

// Webhook para processar o pagamento
router.post("/payments/webhook", async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];
  let event;

  console.log("🔔 [Webhook] Recebido pedido do Stripe...");
  console.log("Headers:", JSON.stringify(req.headers));

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

    console.log(`✅ Pagamento confirmado para o usuario ${userId}: ${credits} creditos`);

    try {
      await db.transaction(async (tx) => {
        // 1. Atualizar saldo do usuario
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

          // 2. Registrar transacao
          await tx.insert(transactions).values({
            userId: userId,
            type: "PURCHASE",
            credits: parseInt(credits),
            amountCents: session.amount_total,
            description: `Compra de Pacote: ${session.amount_total / 100} BRL`,
          });
        }
      });

      // 3. Notificar o usuario
      await createNotification(
        userId,
        "Creditos Adicionados! 💎",
        `Seu pagamento foi confirmado e ${credits} creditos foram adicionados a sua conta.`,
        "purchase",
        { amount: credits }
      );

    } catch (err) {
      console.error("Erro ao processar credito do webhook:", err);
      return res.status(500).json({ error: "Erro interno ao processar creditos" });
    }
  }

  res.json({ received: true });
});

// Rota de Sucesso (Visível para o usuário)
router.get("/payment-success", async (req, res: any) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Confirmado | Trampaí</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; margin: 0; background-color: #F4F7FE;
                color: #0B1339; text-align: center;
            }
            .card { 
                background: white; padding: 40px; border-radius: 24px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 400px; width: 90%;
            }
            .icon { color: #16A34A; margin-bottom: 20px; }
            h1 { font-family: 'Outfit', sans-serif; font-size: 24px; margin-bottom: 10px; }
            p { color: #718096; line-height: 1.5; margin-bottom: 30px; }
            .btn { 
                background: #F69926; color: #0B1339; text-decoration: none; 
                padding: 12px 30px; border-radius: 12px; font-weight: 700;
                display: inline-block; transition: transform 0.2s;
            }
            .btn:hover { transform: scale(1.05); }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon"><i data-lucide="check-circle" size="64"></i></div>
            <h1>Pagamento Confirmado!</h1>
            <p>Seus créditos foram adicionados à sua conta. Você já pode voltar para o aplicativo e continuar seus trampos.</p>
            <a href="trampai://" class="btn">Voltar para o App</a>
        </div>
        <script>lucide.createIcons();</script>
    </body>
    </html>
  `);
});

// Rota de Cancelamento
router.get("/payment-cancel", async (req, res: any) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Cancelado | Trampaí</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; margin: 0; background-color: #F4F7FE;
                color: #0B1339; text-align: center;
            }
            .card { 
                background: white; padding: 40px; border-radius: 24px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 400px; width: 90%;
            }
            .icon { color: #EF4444; margin-bottom: 20px; }
            h1 { font-family: 'Outfit', sans-serif; font-size: 24px; margin-bottom: 10px; }
            p { color: #718096; line-height: 1.5; margin-bottom: 30px; }
            .btn { 
                background: #0B1339; color: white; text-decoration: none; 
                padding: 12px 30px; border-radius: 12px; font-weight: 700;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon"><i data-lucide="x-circle" size="64"></i></div>
            <h1>Pagamento Cancelado</h1>
            <p>O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada.</p>
            <a href="trampai://" class="btn">Voltar para o App</a>
        </div>
        <script>lucide.createIcons();</script>
    </body>
    </html>
  `);
});

export default router;
