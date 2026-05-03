import { Router } from "express";
import { db, categories } from "@workspace/db";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

export default router;
