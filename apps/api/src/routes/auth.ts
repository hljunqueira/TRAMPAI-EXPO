import { Router } from "express";
import { db, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { sendVerificationEmail, sendForgotPasswordEmail } from "../utils/mail";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { OAuth2Client } from "google-auth-library";
import { generateReferralCode } from "../utils/referral";
import { transactions } from "@workspace/db";
import { getConfig } from "./admin";
import { CONFIG_KEYS } from "@workspace/db/schema";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

router.post("/auth/register", async (req: any, res: any) => {
  try {
    const { email, name, password, role } = req.body;
    
    // Verificar se já existe
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existing) {
      if (existing.emailVerifiedAt) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      } else {
        // Se existe mas não está verificado, gera novo token e reenvia e-mail
        const newToken = crypto.randomUUID();
        await db.update(users)
          .set({ verificationToken: newToken, name, password: await bcrypt.hash(password, 10) })
          .where(eq(users.id, existing.id));
          
        sendVerificationEmail(email, newToken).catch(console.error);
        return res.status(200).json({ 
          message: "E-mail de confirmação reenviado. Verifique sua caixa de entrada.",
          user: existing
        });
      }
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
      creditBalance: referredBy ? parseInt(await getConfig(CONFIG_KEYS.WELCOME_CREDITS)) || 10 : 0, // Bônus para quem é indicado
    }).returning() as Promise<any[]>);

    // Se foi indicado, dar bônus para quem indicou também
    if (referredBy) {
      const welcomeBonus = parseInt(await getConfig(CONFIG_KEYS.WELCOME_CREDITS)) || 10;
      const referralBonus = parseInt(await getConfig(CONFIG_KEYS.REFERRAL_BONUS)) || 5;

      // Criar transações para auditoria
      await db.insert(transactions).values([
        {
          userId: newUser.id,
          type: "REFERRAL_BONUS",
          credits: welcomeBonus,
          description: "Bônus por ser indicado",
        },
        {
          userId: referredBy,
          type: "REFERRAL_BONUS",
          credits: referralBonus,
          description: `Bônus por indicar ${newUser.name}`,
        }
      ]);
      
      // Atualizar saldo do padrinho (incremento manual por segurança no SQLite/PG)
      await db.execute(sql`UPDATE users SET credit_balance = credit_balance + ${referralBonus} WHERE id = ${referredBy}`);
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET
    );
    
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET
    );
    
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

    return res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>E-mail Verificado - Trampaí</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Outfit', sans-serif;
                  background-color: #f8fafc;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  color: #21284E;
              }
              .card {
                  background: white;
                  padding: 48px;
                  border-radius: 32px;
                  box-shadow: 0 20px 40px rgba(33, 40, 78, 0.08);
                  text-align: center;
                  max-width: 400px;
                  width: 90%;
              }
              .icon-circle {
                  width: 80px;
                  height: 80px;
                  background: linear-gradient(135deg, #F69926, #FFB14A);
                  border-radius: 50%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  margin: 0 auto 24px;
                  box-shadow: 0 8px 16px rgba(246, 153, 38, 0.3);
              }
              .icon-circle svg {
                  width: 40px;
                  height: 40px;
                  color: white;
              }
              h1 {
                  margin: 0 0 16px;
                  font-size: 28px;
                  font-weight: 700;
              }
              p {
                  color: #64748b;
                  font-size: 16px;
                  line-height: 1.6;
                  margin-bottom: 32px;
              }
              .btn {
                  display: inline-block;
                  background-color: #21284E;
                  color: white;
                  padding: 16px 32px;
                  text-decoration: none;
                  border-radius: 16px;
                  font-weight: 600;
                  font-size: 16px;
                  transition: all 0.2s ease;
                  box-shadow: 0 4px 12px rgba(33, 40, 78, 0.2);
              }
              .btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(33, 40, 78, 0.3);
                  background-color: #2a3363;
              }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
              </div>
              <h1>E-mail Verificado!</h1>
              <p>Sua conta está ativa e pronta para uso. Agora você já pode acessar todas as oportunidades do Trampaí.</p>
              <a href="trampai://" class="btn">Abrir Aplicativo</a>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("ERRO VERIFICACAO:", err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Erro na Verificação - Trampaí</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; }
              .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
              h1 { color: #e11d48; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>Ops! Algo deu errado</h1>
              <p>Não conseguimos verificar seu e-mail. O link pode ter expirado ou já foi utilizado.</p>
              <a href="/" style="color: #21284E; text-decoration: none; font-weight: bold;">Voltar ao início</a>
          </div>
      </body>
      </html>
    `);
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
    logger.info({ userId, body: req.body }, "Iniciando PATCH /auth/me");
    
    if (!userId) {
      return res.status(401).json({ error: "Token inválido ou ID de usuário ausente" });
    }

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
    if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl;
    if (body.selfieUrl !== undefined) updateData.selfieUrl = body.selfieUrl;
    if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus;

    logger.info({ updateData }, "DADOS PARA UPDATE NO BANCO");

    const results = await (db.update(users)
      .set(updateData)
      .where(eq(users.id, userId as string))
      .returning() as Promise<any[]>);

    logger.info({ resultsCount: results?.length }, "RESULTADO DO BANCO");

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado para atualização" });
    }

    const updatedUser = results[0];

    // @ts-ignore
    if (updatedUser && updatedUser.password) {
      delete updatedUser.password;
    }
    
    return res.json(updatedUser);
  } catch (err) {
    logger.error({ err, userId: req.user?.userId }, "ERRO DETALHADO NO PATCH ME");
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

// Solicitar recuperação de senha
router.post("/auth/forgot-password", async (req: any, res: any) => {
  try {
    const { email } = req.body;
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    // Por segurança, não informamos se o e-mail existe ou não
    if (!user) {
      return res.json({ message: "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora de validade

    await db.update(users)
      .set({ 
        resetPasswordToken: resetToken, 
        resetPasswordExpires: resetExpires 
      })
      .where(eq(users.id, user.id));

    await sendForgotPasswordEmail(email, resetToken);

    return res.json({ message: "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

// Tela de Redefinição de Senha (GET)
router.get("/auth/reset-password", async (req: any, res: any) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Erro - Trampaí</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 400px; width: 90%; }
              h1 { color: #e11d48; margin-bottom: 16px; }
              p { color: #64748b; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>Link Inválido</h1>
              <p>O link de redefinição de senha está incompleto ou expirou. Por favor, solicite um novo link no aplicativo.</p>
          </div>
      </body>
      </html>
    `);
  }

  return res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - Trampaí</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: white; padding: 40px; border-radius: 28px; width: 100%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); text-align: center; }
            .logo { font-weight: 800; font-size: 32px; color: #21284E; margin-bottom: 8px; letter-spacing: -1px; }
            h1 { font-size: 24px; color: #1e293b; margin-bottom: 12px; }
            p { color: #64748b; margin-bottom: 32px; font-size: 15px; line-height: 1.5; }
            .form-group { text-align: left; margin-bottom: 20px; }
            label { display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px; }
            input { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 16px; transition: all 0.2s; outline: none; }
            input:focus { border-color: #F69926; box-shadow: 0 0 0 4px rgba(246, 153, 38, 0.1); }
            button { width: 100%; background: #21284E; color: white; border: none; padding: 18px; border-radius: 18px; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s, background 0.2s; margin-top: 10px; }
            button:hover { background: #2a3363; transform: translateY(-2px); }
            button:active { transform: translateY(0); }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">Trampaí</div>
            <h1>Nova Senha</h1>
            <p>Digite sua nova senha abaixo para recuperar o acesso à sua conta.</p>
            
            <form action="/api/auth/reset-password" method="POST">
                <input type="hidden" name="token" value="${token}">
                <div class="form-group">
                    <label>Nova Senha</label>
                    <input type="password" name="password" placeholder="Mínimo 6 caracteres" required minlength="6">
                </div>
                <div class="form-group">
                    <label>Confirmar Nova Senha</label>
                    <input type="password" placeholder="Repita a nova senha" required minlength="6" oninput="if(this.value != document.getElementsByName('password')[0].value) this.setCustomValidity('As senhas não coincidem'); else this.setCustomValidity('');">
                </div>
                <button type="submit">Redefinir Senha</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

// Redefinir senha com o token (POST)
router.post("/auth/reset-password", async (req: any, res: any) => {
  try {
    const { token, password } = req.body;
    const isBrowser = req.headers["content-type"]?.includes("application/x-www-form-urlencoded");

    const [user] = await db.select()
      .from(users)
      .where(eq(users.resetPasswordToken, token));

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      if (isBrowser) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>Erro - Trampaí</title>
              <style>
                  body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; margin: 0; }
                  .card { background: white; padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                  h1 { color: #e11d48; }
              </style>
          </head>
          <body>
              <div class="card">
                  <h1>Erro!</h1>
                  <p>O token é inválido ou já expirou.</p>
                  <a href="/" style="color: #21284E; text-decoration: none; font-weight: bold;">Voltar ao início</a>
              </div>
          </body>
          </html>
        `);
      }
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.update(users)
      .set({ 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id));

    if (isBrowser) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Sucesso - Trampaí</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .success-icon { font-size: 48px; margin-bottom: 20px; }
                h1 { color: #10b981; margin-bottom: 16px; }
                .btn { display: inline-block; background: #21284E; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="success-icon">✅</div>
                <h1>Senha Alterada!</h1>
                <p>Sua nova senha foi salva com sucesso. Agora você já pode entrar no aplicativo.</p>
                <a href="trampai://" class="btn">Abrir Aplicativo</a>
            </div>
        </body>
        </html>
      `);
    }

    return res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error(err);
    if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
      return res.status(500).send("<h1>Erro interno no servidor</h1>");
    }
    return res.status(500).json({ error: "Erro ao redefinir senha" });
  }
});

export default router;
