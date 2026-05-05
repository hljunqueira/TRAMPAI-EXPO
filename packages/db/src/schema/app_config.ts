import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppConfigSchema = createInsertSchema(appConfig);
export const selectAppConfigSchema = createSelectSchema(appConfig);

export type AppConfig = z.infer<typeof selectAppConfigSchema>;

// Chaves disponíveis no sistema
export const CONFIG_KEYS = {
  LEAD_NORMAL_COST: "lead_normal_cost",
  LEAD_EXCLUSIVE_COST: "lead_exclusive_cost",
  WELCOME_CREDITS: "welcome_credits",
  REFERRAL_BONUS: "referral_bonus",
  APP_MAINTENANCE_MODE: "app_maintenance_mode",
  PIX_KEY: "pix_key",
  PIX_HOLDER_NAME: "pix_holder_name",
  PIX_KEY_TYPE: "pix_key_type", // CPF, CNPJ, EMAIL, PHONE, RANDOM
} as const;

// Valores padrão
export const CONFIG_DEFAULTS: Record<string, string> = {
  [CONFIG_KEYS.LEAD_NORMAL_COST]: "1",
  [CONFIG_KEYS.LEAD_EXCLUSIVE_COST]: "3",
  [CONFIG_KEYS.WELCOME_CREDITS]: "5",
  [CONFIG_KEYS.REFERRAL_BONUS]: "3",
  [CONFIG_KEYS.APP_MAINTENANCE_MODE]: "false",
  [CONFIG_KEYS.PIX_KEY]: "",
  [CONFIG_KEYS.PIX_HOLDER_NAME]: "",
  [CONFIG_KEYS.PIX_KEY_TYPE]: "EMAIL",
};
