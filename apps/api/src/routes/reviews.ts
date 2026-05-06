import { Router } from "express";
import { db, reviews, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/reviews", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { jobId, toUserId, rating, comment } = req.body;
    const fromUserId = req.user?.userId;

    if (!fromUserId) return res.status(401).json({ error: "Não autorizado" });

    // 1. Inserir a avaliação
    const [newReview] = await db.insert(reviews).values({
      jobId,
      fromUserId,
      toUserId,
      rating: Math.round(rating),
      comment,
    }).returning();

    // 2. Calcular a nova média e contagem usando SQL direto para garantir precisão
    const [stats] = await db
      .select({
        avgRating: sql<string>`ROUND(AVG(rating)::numeric, 1)::text`,
        totalReviews: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.toUserId, toUserId));

    // 3. Atualizar o perfil do usuário
    await db.update(users)
      .set({
        rating: stats.avgRating || "0.0",
        reviewCount: stats.totalReviews || 0,
      })
      .where(eq(users.id, toUserId));

    return res.status(201).json(newReview);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar avaliação" });
  }
});

router.get("/reviews/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const userReviews = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      fromUserName: users.name,
      fromUserAvatar: users.avatarUrl,
    })
      .from(reviews)
      .leftJoin(users, eq(reviews.fromUserId, users.id))
      .where(eq(reviews.toUserId, userId))
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(10);

    return res.json(userReviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar avaliações" });
  }
});

export default router;
