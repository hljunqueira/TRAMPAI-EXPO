import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { imageBase64, ext = "jpg" } = req.body;
    
    if (!imageBase64) {
      res.status(400).json({ error: "Nenhuma imagem base64 fornecida." });
      return;
    }

    // Remover header do base64 se vier com data:image/jpeg;base64,
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);
    
    // Garantir que a pasta existe
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Salvar o arquivo
    await fs.writeFile(filePath, buffer);

    const appUrl = process.env.APP_URL || "http://localhost:3007";
    const fileUrl = `${appUrl}/uploads/${fileName}`;

    res.json({ url: fileUrl });
  } catch (error) {
    logger.error({ error }, "Erro no upload de imagem");
    res.status(500).json({ error: "Falha ao fazer upload da imagem" });
  }
});

export default router;
