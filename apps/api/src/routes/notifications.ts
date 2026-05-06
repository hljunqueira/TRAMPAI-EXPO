import { Router } from "express";
import { db, notifications } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();

// Listar notificações do usuário
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// Marcar uma como lida
router.patch("/:id/read", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar notificação" });
  }
});

// Marcar todas como lidas
router.post("/read-all", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar notificações" });
  }
});

export default router;
