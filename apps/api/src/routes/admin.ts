import { Router } from "express";
import { db, users, jobs, leads, transactions, appConfig, creditPackages, categories } from "@workspace/db";
import { CONFIG_KEYS, CONFIG_DEFAULTS } from "@workspace/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "../middlewares/auth";
import { auditLog } from "../middlewares/audit";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "../utils/mail";
import { sendPushNotifications, createNotification } from "../utils/notifications";




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
      total: sql<number>`count(*) filter (where type = 'REFERRAL_BONUS')`,
      bonusGiven: sql<number>`coalesce(sum(credits) filter (where type = 'REFERRAL_BONUS'), 0)`,
    }).from(transactions);

    // Faturamento dos últimos 30 dias (para o gráfico)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueHistory = await db.select({
      date: sql<string>`date_trunc('day', ${transactions.createdAt})::date`,
      totalCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.type, "PURCHASE"),
      sql`${transactions.createdAt} >= ${thirtyDaysAgo}`
    ))
    .groupBy(sql`date_trunc('day', ${transactions.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${transactions.createdAt})::date`);

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
        history: revenueHistory,
      },
      leads: {
        total: Number(leadStats.total),
      },
      referrals: {
        total: Number(referralStats.total / 2),
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
// Atualizar uma config
router.patch("/admin/config/:key", authenticate, isAdmin, auditLog("UPDATE_CONFIG", "CONFIG"), async (req, res) => {

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
// Criar pacote
router.post("/admin/packages", authenticate, isAdmin, auditLog("CREATE_PACKAGE", "PACKAGE"), async (req, res) => {

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
// Editar pacote
router.patch("/admin/packages/:id", authenticate, isAdmin, auditLog("UPDATE_PACKAGE", "PACKAGE"), async (req, res) => {

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
// Deletar/desativar pacote
router.delete("/admin/packages/:id", authenticate, isAdmin, auditLog("DELETE_PACKAGE", "PACKAGE"), async (req, res) => {

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
// Conceder créditos manualmente
router.post("/admin/users/:id/grant-credits", authenticate, isAdmin, auditLog("GRANT_CREDITS", "USER"), async (req: AuthRequest, res: any) => {

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
// Banir usuário
router.patch("/admin/users/:id/ban", authenticate, isAdmin, auditLog("BAN_USER", "USER"), async (req, res) => {

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

// Resetar senha do usuário
router.post("/admin/users/:id/reset-password", authenticate, isAdmin, auditLog("RESET_PASSWORD", "USER"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Gerar senha temporária aleatória (8 caracteres)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));

    // Enviar e-mail
    await sendPasswordResetEmail(user.email, tempPassword);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao resetar senha" });
  }
});


// Atualizar verificação do usuário
router.patch("/admin/users/:id/verify", authenticate, isAdmin, auditLog("VERIFY_USER", "USER"), async (req, res) => {
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

    // Notificar usuário sobre o status da verificação
    (async () => {
      try {
        const title = status === "APPROVED" ? "Conta Verificada! ✅" : "Verificação Recusada ❌";
        const body = status === "APPROVED" 
          ? "Parabéns! Sua conta foi aprovada e você já pode desbloquear leads." 
          : "Houve um problema com seus documentos. Verifique seu perfil para mais detalhes.";
        
        await createNotification(id, title, body, "verification", { status });
      } catch (e) {
        console.error("Erro ao notificar usuário sobre verificação:", e);
      }
    })();

    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status do usuário" });
  }
});

// Alterar cargo do usuário (Super Admin Only para cargo admin)
router.patch("/admin/users/:id/role", authenticate, isAdmin, auditLog("UPDATE_USER_ROLE", "USER"), async (req: AuthRequest, res: any) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    // Trava de segurança: apenas Henrique pode promover a Admin
    if (role === "admin" && req.user?.email !== "henrique@trampai.com.br") {
      return res.status(403).json({ error: "Apenas o Super Admin (Henrique) pode promover outros administradores." });
    }

    if (!["client", "provider", "admin"].includes(role)) {
      return res.status(400).json({ error: "Cargo inválido" });
    }

    const [updatedUser] = await (db.update(users)
      .set({ 
        role, 
        isProvider: role === "provider",
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning() as Promise<any[]>);

    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar cargo do usuário" });
  }
});

// Listar leads recentes para reembolso
router.get("/admin/leads/recent", authenticate, isAdmin, async (req, res) => {
  try {
    const recentLeads = await db
      .select({
        id: leads.id,
        jobTitle: jobs.title,
        providerName: users.name,
        providerId: users.id,
        cost: leads.cost,
        refundedAt: leads.refundedAt,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .innerJoin(jobs, eq(leads.jobId, jobs.id))
      .innerJoin(users, eq(leads.providerId, users.id))
      .orderBy(desc(leads.createdAt))
      .limit(50);

    return res.json(recentLeads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar leads" });
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
        description: jobs.description,
        budget: jobs.budget,
        createdAt: jobs.createdAt,
        category: { id: categories.id, name: categories.name, icon: categories.icon },
        client: { 
          id: users.id, 
          name: users.name, 
          email: users.email,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          jobsPostedCount: users.jobsPostedCount
        },
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
// Forçar mudança de status de um job
router.patch("/admin/jobs/:id/status", authenticate, isAdmin, auditLog("UPDATE_JOB_STATUS", "JOB"), async (req, res) => {

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

// Reembolsar um lead
router.post("/admin/leads/:id/refund", authenticate, isAdmin, auditLog("REFUND_LEAD", "LEAD"), async (req, res) => {
  try {
    const id = req.params.id as string;
    
    // 1. Buscar o lead
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    if (!lead) return res.status(404).json({ error: "Lead não encontrado" });
    if (lead.refundedAt) return res.status(400).json({ error: "Este lead já foi reembolsado" });

    // 2. Buscar o usuário (prestador)
    const [provider] = await db.select().from(users).where(eq(users.id, lead.providerId));
    if (!provider) return res.status(404).json({ error: "Prestador não encontrado" });

    // 3. Processar reembolso em transação
    await db.transaction(async (tx) => {
      // Marcar lead como reembolsado
      await tx.update(leads)
        .set({ refundedAt: new Date() })
        .where(eq(leads.id, id));

      // Devolver créditos
      await tx.update(users)
        .set({ creditBalance: provider.creditBalance + lead.cost })
        .where(eq(users.id, provider.id));

      // Registrar transação de reembolso
      await tx.insert(transactions).values({
        userId: provider.id,
        type: "REFUND",
        credits: lead.cost,
        amountCents: 0,
        description: `Reembolso de lead #${id.slice(0, 8)}`,
      } as any);
    });

    return res.json({ ok: true, refundedCredits: lead.cost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar reembolso" });
  }
});

// Enviar notificações push em massa
router.post("/admin/notifications/send", authenticate, isAdmin, auditLog("SEND_PUSH_MASS", "NOTIFICATION"), async (req, res) => {

  try {
    const { title, message, target } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Título e mensagem são obrigatórios" });
    }

    // Buscar tokens dos usuários alvo
    let query = db.select({ pushToken: users.pushToken }).from(users).where(sql`${users.pushToken} IS NOT NULL`);

    if (target === "CLIENTS") {
      query = db.select({ pushToken: users.pushToken }).from(users).where(and(eq(users.role, "client"), sql`${users.pushToken} IS NOT NULL`)) as any;
    } else if (target === "PROVIDERS") {
      query = db.select({ pushToken: users.pushToken }).from(users).where(and(eq(users.role, "provider"), sql`${users.pushToken} IS NOT NULL`)) as any;
    }

    const userTokens = await query;
    const tokens = userTokens.map(u => u.pushToken).filter(Boolean) as string[];

    if (tokens.length === 0) {
      return res.json({ ok: true, sentCount: 0, message: "Nenhum usuário com token encontrado" });
    }

    // Disparar notificações (em lotes se necessário, mas o Expo aceita até 100 por vez)
    // Para simplificar, vamos enviar todos de uma vez (Expo limita a 100 por request, mas o utility pode ser expandido)
    const result = await sendPushNotifications(tokens, title, message);

    return res.json({ ok: true, sentCount: tokens.length, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao enviar notificações" });
  }
});

export { getConfig };


export default router;
