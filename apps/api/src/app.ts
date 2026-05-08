import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Segurança: Headers HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Necessário para carregar imagens estáticas no mobile
}));

// Limite de requisições (Prevenção contra Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // Limite de 100 requests por IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas requisições deste IP. Tente novamente em 15 minutos." },
});

// Aplicar limite em rotas sensíveis
app.use("/api/auth", limiter);
app.use("/api/jobs", limiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// CORS: Restringir em produção
const allowedOrigins = [
  "https://trampai.com.br",
  "https://www.trampai.com.br",
  "https://app.trampai.com.br",
  "https://api.trampai.com.br",
  "http://localhost:3000",
  "http://localhost:8081", // Expo local
  "http://localhost:8082",
];

app.use(cors({
  origin: (origin, callback) => {
    // Mobile apps geralmente não enviam 'origin' no header
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS não permitido para esta origem"));
    }
  }
}));

// Webhook do Stripe precisa de raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

import path from "path";
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.use("/api", router);

export default app;
