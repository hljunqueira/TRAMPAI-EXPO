import { Router } from "express";
import { db, categories } from "@workspace/db";
import { authenticate, isAdmin, AuthRequest } from "../middlewares/auth";
import { auditLog } from "../middlewares/audit";
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

// Criar nova categoria
router.post("/categories", authenticate, auditLog("CREATE_CATEGORY", "CATEGORY"), async (req: AuthRequest, res: any) => {
  try {
    const { name, icon } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nome da categoria é obrigatório" });

    // Verificar se já existe
    const existing = await db.select().from(categories).where(eq(categories.name, name.trim()));
    if (existing.length > 0) return res.json(existing[0]);

    const [newCat] = await db.insert(categories).values({ 
      name: name.trim(), 
      icon: icon || "tag-outline" 
    }).returning();
    
    return res.status(201).json(newCat);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

// Atualizar categoria (Admin)
router.patch("/admin/categories/:id", authenticate, isAdmin, auditLog("UPDATE_CATEGORY", "CATEGORY"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, icon } = req.body;

    const [updated] = await db.update(categories)
      .set({
        ...(name && { name: name.trim() }),
        ...(icon && { icon }),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Categoria não encontrada" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

// Deletar categoria (Admin)
router.delete("/admin/categories/:id", authenticate, isAdmin, auditLog("DELETE_CATEGORY", "CATEGORY"), async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(categories).where(eq(categories.id, id));
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao deletar categoria. Verifique se existem serviços vinculados." });
  }
});

export default router;
