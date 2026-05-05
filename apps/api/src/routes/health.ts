import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Tenta uma consulta simples no banco
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json({ ...data, database: "connected" });
  } catch (err: any) {
    res.status(500).json({ status: "error", database: "disconnected", error: err.message });
  }
});

export default router;
