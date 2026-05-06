import { Router } from "express";
import { db, users, jobs, leads, transactions, appConfig, creditPackages, categories } from "@workspace/db";
import { CONFIG_KEYS, CONFIG_DEFAULTS } from "@workspace/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "../middlewares/auth";

const router = Router();

// ─── Utilitário: buscar valor de config com fallback ─────────────────────────
async function getConfig(key: string): Promise<string> {
  const [row] = await db.select().from(appConfig).where(eq(appConfig.key, key));
  return row?.value ?? CONFIG_DEFAULTS[key] ?? "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Buscar configs públicas (custos, PIX)
router.get("/config", async (req, res) => {
  try {
    const keys = [
      CONFIG_KEYS.LEAD_NORMAL_COST,
      CONFIG_KEYS.LEAD_EXCLUSIVE_COST,
      CONFIG_KEYS.PIX_KEY,
      CONFIG_KEYS.PIX_HOLDER_NAME,
      CONFIG_KEYS.PIX_KEY_TYPE,
      CONFIG_KEYS.APP_MAINTENANCE_MODE
    ];
    
    const rows = await db.select().from(appConfig).where(inArray(appConfig.key, keys as any));
    
    const result: Record<string, string> = {};
    keys.forEach(k => { result[k] = CONFIG_DEFAULTS[k]; });
    rows.forEach(r => { result[r.key] = r.value; });
    
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/admin/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const [userStats] = await db.select({
      total: sql<number>`count(*)`,
      clients: sql<number>`count(*) filter (where role = 'client')`,
      providers: sql<number>`count(*) filter (where role = 'provider')`,
      pending: sql<number>`count(*) filter (where "verification_status" = 'PENDING')`,
    }).from(users);

    const [jobStats] = await db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(*) filter (where status = 'open')`,
    }).from(jobs);

    const [revenueStats] = await db.select({
      totalCents: sql<number>`coalesce(sum("amount_cents"), 0)`,
    }).from(transactions).where(eq(transactions.type, "PURCHASE"));

    const [leadStats] = await db.select({
      total: sql<number>`count(*)`,
    }).from(leads);

    const [referralStats] = await db.select({
      total: sql<number>`count(*) filter (where referred_by is not null)`,
      bonusGiven: sql<number>`coalesce(sum(credits), 0) filter (where type = 'REFERRAL_BONUS')`,
    }).from(transactions);

    return res.json({
      users: {
        total: Number(userStats.total),
        clients: Number(userStats.clients),
        providers: Number(userStats.providers),
        pending: Number(userStats.pending),
      },
      jobs: {
        total: Number(jobStats.total),
        open: Number(jobStats.open),
      },
      revenue: {
        totalCents: Number(revenueStats.totalCents),
      },
      leads: {
        total: Number(leadStats.total),
      },
      referrals: {
        total: Number(referralStats.total / 2), // Cada indicação gera 2 transações de bônus no meu código
        bonusGiven: Number(referralStats.bonusGiven),
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// ─── Últimos jobs (para seção "Serviços Recentes" do dashboard) ───────────────
router.get("/admin/jobs/recent", authenticate, isAdmin, async (req, res) => {
  try {
    const recentJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        location: jobs.location,
        createdAt: jobs.createdAt,
        category: { id: categories.id, name: categories.name, icon: categories.icon },
        client: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .orderBy(desc(jobs.createdAt))
      .limit(10);

    return res.json(recentJobs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar serviços recentes" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES DO SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════

// Buscar todas as configs
router.get("/admin/config", authenticate, isAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(appConfig);
    // Incluir defaults para chaves que ainda não existem no banco
    const result: Record<string, string> = { ...CONFIG_DEFAULTS };
    rows.forEach(r => { result[r.key] = r.value; });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

// Atualizar uma config
router.patch("/admin/config/:key", authenticate, isAdmin, async (req, res) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: "Campo 'value' é obrigatório" });
    }

    // Upsert: inserir ou atualizar
    await db
      .insert(appConfig)
      .values({ key: key as any, value: String(value), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: { value: String(value), updatedAt: new Date() },
      });

    return res.json({ key, value: String(value) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar configuração" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PACOTES DE CRÉDITO
// ═══════════════════════════════════════════════════════════════════════════════

// Listar pacotes (público — usado na Carteira do prestador)
router.get("/packages", async (req, res) => {
  try {
    const pkgs = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.sortOrder);
    return res.json(pkgs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar pacotes" });
  }
});

// Listar todos (admin — inclui inativos)
router.get("/admin/packages", authenticate, isAdmin, async (req, res) => {
  try {
    const pkgs = await db.select().from(creditPackages).orderBy(creditPackages.sortOrder);
    return res.json(pkgs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar pacotes" });
  }
});

// Criar pacote
router.post("/admin/packages", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, credits, priceCents, bonusCredits, isHighlighted, sortOrder } = req.body;

    if (!name || !credits || !priceCents) {
      return res.status(400).json({ error: "name, credits e priceCents são obrigatórios" });
    }

    const [pkg] = await db.insert(creditPackages).values({
      name,
      credits: Number(credits),
      priceCents: Number(priceCents),
      bonusCredits: Number(bonusCredits ?? 0),
      isHighlighted: Boolean(isHighlighted ?? false),
      sortOrder: Number(sortOrder ?? 0),
    }).returning();

    return res.status(201).json(pkg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar pacote" });
  }
});

// Editar pacote
router.patch("/admin/packages/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, credits, priceCents, bonusCredits, isActive, isHighlighted, sortOrder } = req.body;

    const [updated] = await db
      .update(creditPackages)
      .set({
        ...(name !== undefined && { name }),
        ...(credits !== undefined && { credits: Number(credits) }),
        ...(priceCents !== undefined && { priceCents: Number(priceCents) }),
        ...(bonusCredits !== undefined && { bonusCredits: Number(bonusCredits) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isHighlighted !== undefined && { isHighlighted: Boolean(isHighlighted) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        updatedAt: new Date(),
      })
      .where(eq(creditPackages.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Pacote não encontrado" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar pacote" });
  }
});

// Deletar/desativar pacote
router.delete("/admin/packages/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.update(creditPackages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(creditPackages.id, id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao desativar pacote" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USUÁRIOS
// ═══════════════════════════════════════════════════════════════════════════════

// Listar todos os usuários
router.get("/admin/users", authenticate, isAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const safeUsers = allUsers.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return res.json(safeUsers);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Detalhe de um usuário
router.get("/admin/users/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const { password, ...safeUser } = user;

    // Histórico de transações
    const txHistory = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, id))
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    // Leads do usuário
    const userLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.providerId, id))
      .orderBy(desc(leads.createdAt))
      .limit(10);

    return res.json({ user: safeUser, transactions: txHistory, leads: userLeads });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

// Conceder créditos manualmente
router.post("/admin/users/:id/grant-credits", authenticate, isAdmin, async (req: AuthRequest, res: any) => {
  try {
    const id = req.params.id as string;
    const { credits, reason } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({ error: "Informe a quantidade de créditos" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ creditBalance: user.creditBalance + Number(credits) })
        .where(eq(users.id, id));

      await tx.insert(transactions).values({
        userId: id as any,
        type: "ADMIN_GRANT",
        credits: Number(credits),
        amountCents: 0,
        description: reason ?? `${credits} créditos concedidos pelo admin`,
      } as any);
    });

    return res.json({ ok: true, newBalance: user.creditBalance + Number(credits) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao conceder créditos" });
  }
});

// Banir usuário
router.patch("/admin/users/:id/ban", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const [updatedUser] = await (db.update(users)
      .set({
        bannedAt: new Date(),
        bannedReason: reason || "Violação dos termos de uso",
      })
      .where(eq(users.id, id))
      .returning() as Promise<any[]>);

    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao banir usuário" });
  }
});

// Desbanir usuário
router.patch("/admin/users/:id/unban", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const [updatedUser] = await (db.update(users)
      .set({
        bannedAt: null,
        bannedReason: null,
      })
      .where(eq(users.id, id))
      .returning() as Promise<any[]>);

    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao desbanir usuário" });
  }
});

// Atualizar verificação do usuário
router.patch("/admin/users/:id/verify", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const [updatedUser] = await (db.update(users)
      .set({
        verificationStatus: status,
        emailVerifiedAt: status === "APPROVED" ? new Date() : null,
      })
      .where(eq(users.id, id))
      .returning() as Promise<any[]>);

    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status do usuário" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// JOBS (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

// Listar todos os jobs (admin — sem filtro de status)
router.get("/admin/jobs", authenticate, isAdmin, async (req, res) => {
  try {
    const allJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        location: jobs.location,
        budget: jobs.budget,
        createdAt: jobs.createdAt,
        category: { id: categories.id, name: categories.name, icon: categories.icon },
        client: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .orderBy(desc(jobs.createdAt))
      .limit(50);

    return res.json(allJobs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar serviços" });
  }
});

// Forçar mudança de status de um job
router.patch("/admin/jobs/:id/status", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const [updated] = await (db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, id))
      .returning() as Promise<any[]>);

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status do serviço" });
  }
});

export { getConfig };
export default router;
