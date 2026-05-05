import { Router } from "express";
import { db, jobs, categories, users, leads, transactions } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { getConfig } from "./admin";
import { CONFIG_KEYS } from "@workspace/db/schema";


const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const allJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        categoryId: jobs.categoryId,
        clientId: jobs.clientId,
        budget: jobs.budget,
        status: jobs.status,
        location: jobs.location,
        createdAt: jobs.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        },
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.createdAt));

    return res.json(allJobs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar trampos" });
  }
});

router.post("/jobs", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { title, description, categoryId, budget, location } = req.body;
    const clientId = req.user?.userId;

    if (!clientId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const [newJob] = await db.insert(jobs).values({
      title,
      description,
      categoryId,
      clientId,
      budget,
      location,
      status: "open",
    }).returning();

    return res.status(201).json(newJob);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar trampo" });
  }
});

router.post("/jobs/:id/unlock", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const jobId = req.params.id as string;
    const providerId = req.user?.userId;
    const { type } = req.body; // NORMAL ou EXCLUSIVE

    if (!providerId) return res.status(401).json({ error: "Não autorizado" });

    // 1. Buscar o job e o cliente
    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        client: {
          phone: users.phone,
          name: users.name,
        }
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.id, jobId));

    if (!job) return res.status(404).json({ error: "Trabalho não encontrado" });
    if (job.status !== "open") return res.status(400).json({ error: "Este lead já não está mais disponível" });

    // 2. Buscar o prestador (para créditos)
    const [provider] = await db.select().from(users).where(eq(users.id, providerId));
    if (!provider) return res.status(404).json({ error: "Prestador não encontrado" });

    const cost = type === "EXCLUSIVE"
      ? Number(await getConfig(CONFIG_KEYS.LEAD_EXCLUSIVE_COST))
      : Number(await getConfig(CONFIG_KEYS.LEAD_NORMAL_COST));

    if (provider.creditBalance < cost) {
      return res.status(400).json({ error: "Créditos insuficientes" });
    }

    // 3. Gerar link do WhatsApp
    const phone = job.client.phone?.replace(/\D/g, "");
    if (!phone) return res.status(400).json({ error: "Cliente não possui telefone cadastrado" });
    
    const message = encodeURIComponent(`Olá ${job.client.name}, vi seu pedido no Trampaí: "${job.title}". Tenho interesse em ajudar!`);
    const whatsappLink = `https://wa.me/55${phone}?text=${message}`;

    // 4. Transação: Deduzir créditos e criar lead
    await db.transaction(async (tx) => {
      // Deduzir créditos
      await tx.update(users)
        .set({ creditBalance: provider.creditBalance - cost })
        .where(eq(users.id, providerId));

      // Registrar transação de gasto
      await tx.insert(transactions).values({
        userId: providerId,
        type: "UNLOCK_SPEND",
        credits: -cost,
        amountCents: 0,
        description: `Lead ${type === "EXCLUSIVE" ? "exclusivo" : "normal"}: ${job.title}`,
      });

      // Criar lead
      await tx.insert(leads).values({
        jobId,
        providerId,
        type,
        cost,
        whatsappLink,
      });

      // Se for exclusivo, fecha o job para outros
      if (type === "EXCLUSIVE") {
        await tx.update(jobs)
          .set({ status: "in_progress" })
          .where(eq(jobs.id, jobId));
      }
    });


    return res.json({ whatsappLink, job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao desbloquear lead" });
  }
});

router.get("/jobs/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const clientId = req.user?.userId;
    if (!clientId) return res.status(401).json({ error: "Não autorizado" });

    const myJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        categoryId: jobs.categoryId,
        clientId: jobs.clientId,
        budget: jobs.budget,
        status: jobs.status,
        location: jobs.location,
        createdAt: jobs.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        },
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .where(eq(jobs.clientId, clientId))
      .orderBy(desc(jobs.createdAt));

    // For each job, check how many leads it has
    const jobsWithLeads = await Promise.all(myJobs.map(async (j) => {
      const jobLeads = await db.select().from(leads).where(eq(leads.jobId, j.id));
      return { ...j, unlockedByProviders: jobLeads };
    }));

    return res.json(jobsWithLeads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar seus serviços" });
  }
});

router.get("/jobs/:id", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const jobId = req.params.id;
    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        categoryId: jobs.categoryId,
        clientId: jobs.clientId,
        budget: jobs.budget,
        status: jobs.status,
        location: jobs.location,
        createdAt: jobs.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .where(eq(jobs.id, jobId as string));

    if (!job) return res.status(404).json({ error: "Serviço não encontrado" });

    // Fetch leads for this job with provider info
    const jobLeads = await db
      .select({
        id: leads.id,
        providerId: leads.providerId,
        type: leads.type,
        createdAt: leads.createdAt,
        provider: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          providerBio: users.providerBio,
          rating: users.rating,
          reviewCount: users.reviewCount,
          city: users.city,
        },
      })
      .from(leads)
      .innerJoin(users, eq(leads.providerId, users.id))
      .where(eq(leads.jobId, jobId as string));

    return res.json({ ...job, leads: jobLeads });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar detalhes do serviço" });
  }
});

router.patch("/jobs/:id/status", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const jobId = req.params.id;
    const { status } = req.body;
    const userId = req.user?.userId;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId as string));
    if (!job) return res.status(404).json({ error: "Serviço não encontrado" });

    // Only client or admin can change status
    if (job.clientId !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Não autorizado" });
    }

    const [updatedJob] = await db.update(jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobs.id, jobId as string))
      .returning();

    return res.json(updatedJob);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

export default router;
