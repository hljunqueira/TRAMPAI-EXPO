import { Router } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/mail";

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
    
    const [newUser] = await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role,
      verificationToken,
    }).returning();

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

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    
    // @ts-ignore - remover password do retorno
    delete user.password;

    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao realizar login" });
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

export default router;
