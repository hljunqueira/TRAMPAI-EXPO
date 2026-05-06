import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // Ex: "BAN_USER", "GRANT_CREDITS", "UPDATE_CONFIG"
  targetId: text("target_id"), // ID do usuário, job ou pacote afetado
  entityType: text("entity_type"), // Ex: "USER", "JOB", "CONFIG"
  oldData: jsonb("old_data"), // Estado anterior (opcional)
  newData: jsonb("new_data"), // Novo estado (opcional)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
