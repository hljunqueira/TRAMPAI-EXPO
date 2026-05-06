import { Router } from "express";
import { db, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { sendVerificationEmail } from "../utils/mail";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { OAuth2Client } from "google-auth-library";
import { generateReferralCode } from "../utils/referral";
import { transactions } from "@workspace/db";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

router.post("/auth/register", async (req: any, res: any) => {
  try {
    const { email, name, password, role } = req.body;
    
    // Verificar se já existe
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();
    const myReferralCode = generateReferralCode();
    
    // Referral logic
    const { referralCode: appliedCode } = req.body;
    let referredBy: string | null = null;
    
    if (appliedCode) {
      const [referrer] = await db.select().from(users).where(eq(users.referralCode, appliedCode));
      if (referrer) {
        referredBy = referrer.id;
      }
    }
    
    const [newUser] = await (db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role,
      verificationToken,
      referralCode: myReferralCode,
      referredBy: referredBy as any,
      creditBalance: referredBy ? 10 : 0, // Bônus para quem é indicado
    }).returning() as Promise<any[]>);

    // Se foi indicado, dar bônus para quem indicou também
    if (referredBy) {
      await db.update(users)
        .set({ creditBalance: db.select({ bal: users.creditBalance }).from(users).where(eq(users.id, referredBy)) as any }) // Incremento simples
        .where(eq(users.id, referredBy));
      
      // Criar transações para auditoria
      await db.insert(transactions).values([
        {
          userId: newUser.id,
          type: "REFERRAL_BONUS",
          credits: 10,
          description: "Bônus por ser indicado",
        },
        {
          userId: referredBy,
          type: "REFERRAL_BONUS",
          credits: 5,
          description: `Bônus por indicar ${newUser.name}`,
        }
      ]);
      
      // Atualizar saldo do padrinho (incremento manual por segurança no SQLite/PG)
      await db.execute(sql`UPDATE users SET credit_balance = credit_balance + 5 WHERE id = ${referredBy}`);
    }

    // Enviar e-mail de verificação (sem travar a resposta)
    sendVerificationEmail(email, verificationToken).catch(console.error);

    // @ts-ignore - remover password do retorno
    delete newUser.password;

    return res.status(201).json({
      message: "Usuário registrado. Verifique seu e-mail para ativar a conta.",
      user: newUser
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

router.post("/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.password) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Verificar se e-mail está verificado
    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: "E-mail não verificado. Verifique sua caixa de entrada." });
    }

    // Verificar se usuário está banido
    if (user.bannedAt) {
      return res.status(403).json({ 
        error: "Sua conta foi suspensa.", 
        reason: user.bannedReason || "Violação dos termos de uso" 
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    
    // @ts-ignore - remover password do retorno
    delete user.password;

    return res.json({ token, user });
  } catch (err: any) {
    logger.error({ err, email: req.body?.email }, "Erro ao realizar login");
    return res.status(500).json({ error: "Erro ao realizar login" });
  }
});

router.post("/auth/google", async (req: any, res: any) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "ID Token não fornecido" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const email = payload.email;
    const name = payload.name || "Usuário Google";
    const avatarUrl = payload.picture;

    // Verificar se usuário já existe
    let [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      const myReferralCode = generateReferralCode();
      // Criar novo usuário (já verificado)
      [user] = await (db.insert(users).values({
        email,
        name,
        avatarUrl,
        role: "client",
        emailVerifiedAt: new Date(),
        verificationStatus: "APPROVED" as any,
        referralCode: myReferralCode,
      }).returning() as Promise<any[]>);
    } else if (!user.emailVerifiedAt) {
      // Se já existia mas não estava verificado, marca como verificado
      [user] = await (db.update(users)
        .set({ emailVerifiedAt: new Date(), verificationStatus: "APPROVED" as any })
        .where(eq(users.id, user.id))
        .returning() as Promise<any[]>);
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    
    // @ts-ignore
    delete user.password;

    return res.json({ token, user });
  } catch (err) {
    console.error("Google Auth Error:", err);
    return res.status(500).json({ error: "Erro na autenticação com Google" });
  }
});

// Rota de verificação
router.get("/auth/verify", async (req: any, res: any) => {
  try {
    const { token } = req.query;
    
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token as string));
    
    if (!user) {
      return res.status(400).json({ error: "Token de verificação inválido" });
    }

    await db.update(users)
      .set({ emailVerifiedAt: new Date(), verificationToken: null })
      .where(eq(users.id, user.id));

    return res.json({ message: "E-mail verificado com sucesso! Agora você pode fazer login." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao verificar e-mail" });
  }
});

router.get("/auth/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // @ts-ignore
    delete user.password;
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

router.patch("/auth/me", authenticate, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const body = req.body;
    
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Mapeamento explícito para evitar problemas de camelCase/snake_case com o Drizzle
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.cep !== undefined) updateData.cep = body.cep;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.number !== undefined) updateData.number = body.number;
    if (body.complement !== undefined) updateData.complement = body.complement;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isProvider !== undefined) updateData.isProvider = body.isProvider;
    if (body.providerBio !== undefined) updateData.providerBio = body.providerBio;
    if (body.providerCategories !== undefined) updateData.providerCategories = body.providerCategories;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.portfolioImages !== undefined) updateData.portfolioImages = body.portfolioImages;
    if (body.pushToken !== undefined) updateData.pushToken = body.pushToken;
    if (body.onboardingCompletedAt !== undefined) {
      updateData.onboardingCompletedAt = new Date(body.onboardingCompletedAt);
    }


    const [updatedUser] = await (db.update(users)
      .set(updateData)
      .where(eq(users.id, userId as string))
      .returning() as Promise<any[]>);

    // @ts-ignore
    delete updatedUser.password;
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

export default router;
