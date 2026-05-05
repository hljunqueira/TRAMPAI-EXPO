import { Router } from "express";
import { db, users, creditPackages, transactions, leads, jobs, categories } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { supabase } from "../lib/supabase";

const router = Router();

// Ativar modo prestador
router.patch("/users/me/become-provider", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { bio, categories } = req.body;

    const [updatedUser] = await db.update(users)
      .set({
        isProvider: true,
        providerBio: bio,
        providerCategories: categories,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId as string))
      .returning();

    // @ts-ignore
    delete updatedUser.password;
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao ativar modo prestador" });
  }
});

// Upload de documentos (placeholder/Supabase)
// Nota: Em produção, usaríamos multer ou processaríamos o buffer
router.post("/users/me/documents", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { documentBase64, selfieBase64 } = req.body;
    
    // Se não enviou nada, apenas retorna
    if (!documentBase64 && !selfieBase64) {
      return res.status(400).json({ error: "Nenhum documento fornecido" });
    }

    const updates: any = { verificationStatus: "PENDING" };

    // Upload Documento
    if (documentBase64) {
      const buffer = Buffer.from(documentBase64, 'base64');
      const fileName = `${userId}/document_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('verifications')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });
      
      if (error) throw error;
      updates.documentUrl = supabase.storage.from('verifications').getPublicUrl(fileName).data.publicUrl;
    }

    // Upload Selfie
    if (selfieBase64) {
      const buffer = Buffer.from(selfieBase64, 'base64');
      const fileName = `${userId}/selfie_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('verifications')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });
      
      if (error) throw error;
      updates.selfieUrl = supabase.storage.from('verifications').getPublicUrl(fileName).data.publicUrl;
    }

    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId as string))
      .returning();

    // @ts-ignore
    delete updatedUser.password;
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao enviar documentos" });
  }
});

// Placeholder para compra de pacotes (Sprint 2 skip Stripe)
router.post("/packages/buy", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    const { packageId, customCredits } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const [user] = await db.select().from(users).where(eq(users.id, userId as string));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    let creditsToAdd = 0;
    let amountCents = 0;
    let description = "";

    if (packageId) {
      const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId));
      if (!pkg) return res.status(404).json({ error: "Pacote não encontrado" });
      creditsToAdd = pkg.credits + (pkg.bonusCredits || 0);
      amountCents = pkg.priceCents;
      description = `Compra do pacote: ${pkg.name}`;
    } else if (customCredits) {
      creditsToAdd = Number(customCredits);
      amountCents = creditsToAdd * 100; // R$ 1,00 por crédito
      description = `Compra personalizada: ${creditsToAdd} créditos`;
    }

    if (creditsToAdd <= 0) return res.status(400).json({ error: "Quantidade inválida" });

    // Fluxo fake: concede créditos imediatamente (já que o usuário confirmou o PIX no app)
    // Em produção real, isso esperaria o webhook do Stripe/MercadoPago
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ creditBalance: user.creditBalance + creditsToAdd })
        .where(eq(users.id, userId as string));

      await tx.insert(transactions).values({
        userId: userId as string,
        type: "PURCHASE",
        credits: creditsToAdd,
        amountCents,
        description,
      });
    });

    return res.json({ success: true, newBalance: user.creditBalance + creditsToAdd });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar compra" });
  }
});

router.get("/leads/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) return res.status(401).json({ error: "Não autorizado" });

    const myLeads = await db
      .select({
        id: leads.id,
        jobId: leads.jobId,
        type: leads.type,
        cost: leads.cost,
        whatsappLink: leads.whatsappLink,
        createdAt: leads.createdAt,
        jobTitle: jobs.title,
        jobCategory: categories.name,
        clientName: users.name,
        clientPhone: users.phone,
        city: users.city,
        neighborhood: users.neighborhood,
      })
      .from(leads)
      .innerJoin(jobs, eq(leads.jobId, jobs.id))
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(leads.providerId, providerId))
      .orderBy(desc(leads.createdAt));

    return res.json(myLeads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar seus leads" });
  }
});

router.get("/transactions/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const myTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));

    return res.json(myTransactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

export default router;
