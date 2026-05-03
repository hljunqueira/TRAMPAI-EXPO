import { Router } from "express";
import { db, jobs } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const allJobs = await db.select().from(jobs).where(eq(jobs.status, "open"));
    res.json(allJobs);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar trampos" });
  }
});

router.post("/jobs", async (req, res) => {
  try {
    const { title, description, categoryId, budget, location } = req.body;
    // TODO: Pegar clientId do token JWT (middleware de auth)
    // Por enquanto, usaremos um placeholder ou pediremos no body se não houver auth middleware
    const clientId = req.body.clientId; 

    const [newJob] = await db.insert(jobs).values({
      title,
      description,
      categoryId,
      clientId,
      budget,
      location,
      status: "open",
    }).returning();

    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar trampo" });
  }
});

export default router;
