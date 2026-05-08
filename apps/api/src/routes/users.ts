import { Router } from "express";
import { db, users, creditPackages, transactions, leads, jobs, categories, reviews } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { supabase } from "../lib/supabase";
import { createNotification } from "../utils/notifications";
import { getConfig } from "./admin";
import { CONFIG_KEYS } from "@workspace/db/schema";

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


router.get("/leads/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) return res.status(401).json({ error: "Não autorizado" });

    const myLeads = await db
      .select({
        id: leads.id,
        jobId: leads.jobId,
        providerId: leads.providerId,
        type: leads.type,
        cost: leads.cost,
        whatsappLink: leads.whatsappLink,
        createdAt: leads.createdAt,
        jobTitle: jobs.title,
        jobCategory: categories.name,
        clientName: users.name,
        clientAvatarUrl: users.avatarUrl,
        clientPhone: users.phone,
        city: users.city,
        neighborhood: users.neighborhood,
        jobLocation: jobs.location,
        jobDescription: jobs.description,
        jobImages: jobs.images,
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
      .select({
        id: transactions.id,
        type: transactions.type,
        credits: transactions.credits,
        amountCents: transactions.amountCents,
        description: transactions.description,
        createdAt: transactions.createdAt,
        referenceId: transactions.referenceId,
        jobTitle: jobs.title,
      })
      .from(transactions)
      .leftJoin(jobs, eq(transactions.referenceId, jobs.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));

    return res.json(myTransactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

router.patch("/users/me/boost", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const [user] = await db.select().from(users).where(eq(users.id, userId as string));
    const boostCostStr = await getConfig(CONFIG_KEYS.BOOST_COST);
    const cost = parseInt(boostCostStr || "5"); // 5 créditos por 24h de boost

    if (user.creditBalance < cost) {
      return res.status(400).json({ error: "Créditos insuficientes" });
    }

    const boostUntil = new Date();
    boostUntil.setHours(boostUntil.getHours() + 24);

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ 
          creditBalance: user.creditBalance - cost,
          boostedUntil: boostUntil,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId as string));

      await tx.insert(transactions).values({
        userId: userId as string,
        type: "BOOST_SPEND",
        credits: -cost,
        amountCents: 0,
        description: "Impulsionamento de perfil (24h)",
      });
    });

    return res.json({ success: true, boostedUntil: boostUntil });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao impulsionar perfil" });
  }
});

router.patch("/users/me/premium", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const [user] = await db.select().from(users).where(eq(users.id, userId as string));
    const premiumCostStr = await getConfig(CONFIG_KEYS.PREMIUM_COST);
    const cost = parseInt(premiumCostStr || "20"); // 20 créditos por 30 dias de Premium

    if (user.creditBalance < cost) {
      return res.status(400).json({ error: "Créditos insuficientes" });
    }

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ 
          creditBalance: user.creditBalance - cost,
          isPremium: true,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId as string));

      await tx.insert(transactions).values({
        userId: userId as string,
        type: "PREMIUM_SPEND",
        credits: -cost,
        amountCents: 0,
        description: "Assinatura Selo Premium (30 dias)",
      });
    });

    return res.json({ success: true, isPremium: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao assinar premium" });
  }
});

// Buscar avaliações de um usuário (para Lead Plus/Exclusivo)
router.get("/users/:id/reviews", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const targetUserId = req.params.id;

    const userReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        fromUser: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.fromUserId, users.id))
      .where(eq(reviews.toUserId, targetUserId as string))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    // Calcular a média
    const avgRating = userReviews.length > 0
      ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length).toFixed(1)
      : null;

    return res.json({ reviews: userReviews, avgRating, total: userReviews.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar avaliações" });
  }
});

export default router;
