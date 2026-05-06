import { Router } from "express";
import { db, jobs, categories, users, leads, transactions, reviews } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { getConfig } from "./admin";
import { CONFIG_KEYS } from "@workspace/db/schema";
import { sanitizeDescription } from "../utils/anti-fraud";
import { createNotification } from "../utils/notifications";
import { and } from "drizzle-orm";



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
        images: jobs.images,
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
    const { title, description, categoryId, budget, location, images } = req.body;
    const clientId = req.user?.userId;

    if (!clientId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const [newJob] = await db.insert(jobs).values({
      title,
      description: sanitizeDescription(description),
      categoryId,
      clientId,
      budget,
      location,
      images,
      status: "open",
    }).returning();

    // Notificar prestadores da categoria (async para não travar a resposta)
    (async () => {
      try {
        const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId));
        const categoryName = cat?.name || "Nova Oportunidade";

        // Buscar prestadores que possam estar interessados (simplificado: todos que são providers)
        // No futuro podemos filtrar por categorias de interesse
        const providers = await db.select({ id: users.id }).from(users).where(eq(users.role, "provider"));
        
        for (const p of providers) {
          await createNotification(
            p.id,
            `Novo Trampo: ${categoryName}`,
            `${title} disponível agora no mural!`,
            "new_job",
            { jobId: newJob.id }
          );
        }
      } catch (e) {
        console.error("Erro ao notificar prestadores:", e);
      }
    })();

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
    const { type } = req.body; // NORMAL, PLUS ou EXCLUSIVE

    if (!providerId) return res.status(401).json({ error: "Não autorizado" });

    // 1. Buscar o job e o cliente
    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        clientId: jobs.clientId,
        client: {
          id: users.id,
          phone: users.phone,
          name: users.name,
          jobsPostedCount: users.jobsPostedCount,
          jobsCompletedCount: users.jobsCompletedCount,
        }
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.id, jobId));

    if (!job) return res.status(404).json({ error: "Trabalho não encontrado" });
    if (job.status !== "open") return res.status(400).json({ error: "Este lead já não está mais disponível" });

    // 2. Definir custo
    let cost = 1;
    if (type === "PLUS") cost = 3;
    if (type === "EXCLUSIVE") cost = 5;

    // 3. Buscar o prestador (para créditos)
    const [provider] = await db.select().from(users).where(eq(users.id, providerId));
    if (!provider) return res.status(404).json({ error: "Prestador não encontrado" });

    if (provider.creditBalance < cost) {
      return res.status(400).json({ error: "Créditos insuficientes" });
    }

    // 4. Gerar link do WhatsApp
    let cleanPhone = job.client.phone?.replace(/\D/g, "") || "";
    if (!cleanPhone) return res.status(400).json({ error: "Cliente não possui telefone cadastrado" });

    if (cleanPhone.startsWith("55") && cleanPhone.length > 11) {
      // Já tem DDI
    } else {
      cleanPhone = `55${cleanPhone}`;
    }
    
    const message = encodeURIComponent(`Olá ${job.client.name}, vi seu pedido no Trampaí: "${job.title}". Tenho interesse em ajudar!`);
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${message}`;

    // 5. Transação: Deduzir créditos e criar lead
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
        description: `Lead ${type}: ${job.title}`,
      });

      // Criar lead
      await tx.insert(leads).values({
        jobId,
        providerId,
        type,
        cost,
        whatsappLink,
      });

      // Lógica de Exclusividade
      if (type === "EXCLUSIVE") {
        // Coloca o job em pendência de match
        await tx.update(jobs)
          .set({ status: "exclusive_pending" })
          .where(eq(jobs.id, jobId));
      }
    });

    // Se for PLUS ou EXCLUSIVE, buscamos as avaliações do cliente para retornar
    let clientReviews: any[] = [];
    if (type === "PLUS" || type === "EXCLUSIVE") {
      clientReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.toUserId, job.clientId))
        .orderBy(desc(reviews.createdAt))
        .limit(5);
    }

    return res.json({ 
      whatsappLink, 
      job: {
        ...job,
        clientReviews
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao desbloquear lead" });
  }
});

// Aceitar ou Recusar Lead Exclusivo (Visão do Cliente)
router.post("/jobs/:id/respond-exclusive", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const jobId = req.params.id;
    const { action } = req.body; // ACCEPT ou DECLINE
    const clientId = req.user?.userId;

    if (!clientId) return res.status(401).json({ error: "Não autorizado" });

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId as string));
    if (!job) return res.status(404).json({ error: "Serviço não encontrado" });
    if (job.clientId !== clientId) return res.status(403).json({ error: "Apenas o dono do serviço pode responder" });
    if (job.status !== "exclusive_pending") return res.status(400).json({ error: "Este serviço não possui uma solicitação exclusiva pendente" });

    // Buscar o lead exclusivo pendente
    const [lead] = await db
      .select()
      .from(leads)
      .where(sql`${leads.jobId} = ${jobId} AND ${leads.type} = 'EXCLUSIVE'`)
      .orderBy(desc(leads.createdAt))
      .limit(1);

    if (!lead) return res.status(404).json({ error: "Lead não encontrado" });

    if (action === "ACCEPT") {
      await db.update(jobs)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(jobs.id, jobId as string));
      
      return res.json({ success: true, message: "Lead aceito com sucesso!" });
    } else {
      // RECUSOU: Reembolsar prestador e reabrir job
      await db.transaction(async (tx) => {
        // Reabrir job
        await tx.update(jobs)
          .set({ status: "open", updatedAt: new Date() })
          .where(eq(jobs.id, jobId as string));

        // Buscar prestador
        const [provider] = await tx.select().from(users).where(eq(users.id, lead.providerId));
        
        // Reembolsar créditos
        await tx.update(users)
          .set({ creditBalance: provider.creditBalance + lead.cost })
          .where(eq(users.id, lead.providerId));

        // Registrar transação de reembolso
        await tx.insert(transactions).values({
          userId: lead.providerId,
          type: "REFUND",
          credits: lead.cost,
          amountCents: 0,
          description: `Estorno Lead Exclusivo Recusado: ${job.title}`,
        });
        
        // Deletar o lead para o job voltar ao mural para outros
        await tx.delete(leads).where(eq(leads.id, lead.id));
      });

      return res.json({ success: true, message: "Lead recusado e prestador reembolsado." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao responder solicitação exclusiva" });
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
        images: jobs.images,
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
        images: jobs.images,
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
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          providerBio: users.providerBio,
          rating: users.rating,
          reviewCount: users.reviewCount,
          city: users.city,
        },
        whatsappLink: leads.whatsappLink,
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

router.put("/jobs/:id", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const jobId = req.params.id;
    const { title, description, categoryId, location, images } = req.body;
    const userId = req.user?.userId;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId as string));
    if (!job) return res.status(404).json({ error: "Serviço não encontrado" });

    if (job.clientId !== userId) {
      return res.status(403).json({ error: "Não autorizado a editar este serviço" });
    }

    const [updatedJob] = await db.update(jobs)
      .set({ 
        title, 
        description: sanitizeDescription(description), 
        categoryId, 
        location, 
        images, 
        updatedAt: new Date() 
      })

      .where(eq(jobs.id, jobId as string))
      .returning();

    return res.json(updatedJob);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar serviço" });
  }
});

export default router;
