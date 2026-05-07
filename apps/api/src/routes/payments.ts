import { Router } from "express";
import { db, users, transactions, creditPackages } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { stripe } from "../lib/stripe";
import { createNotification } from "../utils/notifications";

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
      pkgName = `Avulso (${customCredits} CR)`;
      pkgCredits = customCredits;
      // 10 CR = R$ 9.99 -> 99.9 cents per credit
      pkgPriceCents = Math.round(customCredits * 99.9);
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
    if (pkgPriceCents >= 9990) {
      paymentMethods.push("boleto");
    }

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
      success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment-cancel`,
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

// --- CAKTO PIX INTEGRATION ---

const CAKTO_LINKS: Record<string, string> = {
  "36559e79-e48f-49aa-9e00-ae9649aa2d55": "https://pay.cakto.com.br/gc8cotk_876296", // 10 CR
  "eca03f34-6159-42cf-8227-8d1519d1db35": "https://pay.cakto.com.br/358tydq_876298", // 30+5 CR
  "f1bb360b-cbae-4bea-b016-d9ce8c357549": "https://pay.cakto.com.br/dvn7jft_876300", // 100+20 CR
  "custom": "https://pay.cakto.com.br/jsb3zkt_876302" // Avulso
};

// Checkout Cakto
router.post("/payments/cakto/checkout", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { packageId } = req.body;
    let pkgCredits, baseUrl;

    if (packageId === "custom") {
      const customCredits = parseInt(req.body.customCredits, 10);
      if (!customCredits || isNaN(customCredits) || customCredits < 10) {
        return res.status(400).json({ error: "Minimo de 10 creditos" });
      }
      pkgCredits = customCredits;
      baseUrl = CAKTO_LINKS["custom"];
    } else {
      const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId)).limit(1);
      if (!pkg) return res.status(404).json({ error: "Pacote nao encontrado" });
      
      pkgCredits = pkg.credits + pkg.bonusCredits;
      baseUrl = CAKTO_LINKS[pkg.id];
    }

    if (!baseUrl) {
      return res.status(400).json({ error: "Checkout Cakto nao configurado para este pacote" });
    }

    // Passamos o userId e credits no SRC para identificar no webhook
    const checkoutUrl = `${baseUrl}?src=${req.user?.userId}:${pkgCredits}&email=${encodeURIComponent(req.user?.email || "")}`;

    return res.json({ url: checkoutUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao gerar link de pagamento Pix" });
  }
});

// Webhook Cakto
router.post("/payments/cakto/webhook", async (req: any, res: any) => {
  try {
    const payload = req.body;
    console.log("🔔 [Cakto Webhook] Recebido:", JSON.stringify(payload, null, 2));

    // O evento de compra aprovada na Cakto e 'purchase_approved'
    // Alguns webhooks da Cakto podem vir dentro de um array ou objeto 'event'
    const eventType = payload.event?.custom_id || payload.event_type; 
    
    // Na Cakto, o payload costuma vir com os dados da venda em 'data' ou na raiz
    const sale = payload.data || payload;

    if (eventType === "purchase_approved" || payload.status === "approved" || payload.event === "purchase_approved") {
      const src = sale.src || ""; // Nosso userId:credits
      const [userId, creditsStr] = src.split(":");
      const credits = parseInt(creditsStr, 10);

      if (!userId || !credits) {
        console.warn("⚠️ [Cakto Webhook] SRC invalido ou ausente:", src);
        return res.status(200).json({ message: "SRC invalido, ignorando" });
      }

      console.log(`✅ [Cakto] Pagamento confirmado: ${credits} creditos para ${userId}`);

      await db.transaction(async (tx) => {
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (user) {
          await tx.update(users).set({ 
            creditBalance: user.creditBalance + credits,
            updatedAt: new Date()
          }).where(eq(users.id, userId));

          await tx.insert(transactions).values({
            userId: userId,
            type: "PURCHASE",
            credits: credits,
            amountCents: Math.round((sale.amount || sale.price || 0) * 100),
            description: `Pix via Cakto: ${credits} creditos`,
          });
        }
      });

      await createNotification(
        userId,
        "Pix Confirmado! 💎",
        `Seu Pix foi processado e ${credits} creditos ja estao disponiveis.`,
        "purchase",
        { amount: credits.toString() }
      );
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ [Cakto Webhook] Erro:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
