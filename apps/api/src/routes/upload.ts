import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const { imageBase64, ext = "jpg" } = req.body;
    
    if (!imageBase64) {
      res.status(400).json({ error: "Nenhuma imagem base64 fornecida." });
      return;
    }

    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    const fileExt = ext.toLowerCase();

    if (!allowedExts.includes(fileExt)) {
      res.status(400).json({ error: "Extensão de arquivo não permitida." });
      return;
    }

    // Remover header do base64 se vier com data:image/jpeg;base64,
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Validação básica de Magic Numbers (assinatura de arquivo)
    // JPG: FF D8 FF
    // PNG: 89 50 4E 47
    const isJPG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    if (!isJPG && !isPNG && !isWebP) {
      res.status(400).json({ error: "O arquivo enviado não é uma imagem válida." });
      return;
    }
    
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
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
