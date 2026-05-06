import { Router } from "express";
import { db, categories } from "@workspace/db";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { eq } from "drizzle-orm";

const router = Router();

// Listar todas as categorias
router.get("/categories", async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

// Criar nova categoria (quando o cliente não encontrar a que quer)
router.post("/categories", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nome da categoria é obrigatório" });

    // Verificar se já existe
    const existing = await db.select().from(categories).where(eq(categories.name, name.trim()));
    if (existing.length > 0) return res.json(existing[0]);

    const [newCat] = await db.insert(categories).values({ name: name.trim(), icon: "tag-outline" }).returning();
    return res.status(201).json(newCat);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

export default router;
