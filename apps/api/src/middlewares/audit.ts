import { Response, NextFunction } from "express";
import { db, auditLogs } from "@workspace/db";
import { AuthRequest } from "./auth";

export function auditLog(action: string, entityType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminId = req.user?.userId;
    if (!adminId) return next();

    // Capturamos o ID do alvo se estiver nos params
    const targetId = req.params.id || req.body.id || req.body.userId;

    // Hook no res.json para logar após o sucesso
    const originalJson = res.json;
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        db.insert(auditLogs).values({
          adminId: adminId as any,
          action,
          entityType,
          targetId: String(targetId || ""),
          newData: req.body,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        }).catch(err => console.error("Erro ao gravar audit log:", err));
      }
      return originalJson.call(this, data);
    };

    next();
  };
}
