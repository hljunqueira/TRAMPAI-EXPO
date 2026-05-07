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

export type AppConfig = typeof appConfig.$inferSelect;
export type NewAppConfig = typeof appConfig.$inferInsert;

// Chaves disponíveis no sistema
export const CONFIG_KEYS = {
  LEAD_NORMAL_COST: "lead_normal_cost",
  LEAD_PLUS_COST: "lead_plus_cost",
  LEAD_EXCLUSIVE_COST: "lead_exclusive_cost",
  WELCOME_CREDITS: "welcome_credits",
  REFERRAL_BONUS: "referral_bonus",
  APP_MAINTENANCE_MODE: "app_maintenance_mode",
  PIX_KEY: "pix_key",
  PIX_HOLDER_NAME: "pix_holder_name",
  PIX_KEY_TYPE: "pix_key_type", // CPF, CNPJ, EMAIL, PHONE, RANDOM
  CAKTO_PAYMENT_LINKS: "cakto_payment_links", // JSON string with package links
  CREDIT_UNIT_PRICE_CENTS: "credit_unit_price_cents", // Price in cents for 1 credit (float as string)
  BOOST_COST: "boost_cost", // Cost in credits for 24h boost
  PREMIUM_COST: "premium_cost", // Cost in credits for 30d premium
} as const;

// Valores padrão
export const CONFIG_DEFAULTS: Record<string, string> = {
  [CONFIG_KEYS.LEAD_NORMAL_COST]: "1",
  [CONFIG_KEYS.LEAD_PLUS_COST]: "3",
  [CONFIG_KEYS.LEAD_EXCLUSIVE_COST]: "5",
  [CONFIG_KEYS.WELCOME_CREDITS]: "5",
  [CONFIG_KEYS.REFERRAL_BONUS]: "3",
  [CONFIG_KEYS.APP_MAINTENANCE_MODE]: "false",
  [CONFIG_KEYS.PIX_KEY]: "",
  [CONFIG_KEYS.PIX_HOLDER_NAME]: "",
  [CONFIG_KEYS.PIX_KEY_TYPE]: "EMAIL",
  [CONFIG_KEYS.CAKTO_PAYMENT_LINKS]: JSON.stringify({
    "36559e79-e48f-49aa-9e00-ae9649aa2d55": "https://pay.cakto.com.br/gc8cotk_876296",
    "eca03f34-6159-42cf-8227-8d1519d1db35": "https://pay.cakto.com.br/358tydq_876298",
    "f1bb360b-cbae-4bea-b016-d9ce8c357549": "https://pay.cakto.com.br/dvn7jft_876300",
    "custom": "https://pay.cakto.com.br/jsb3zkt_876302"
  }),
  [CONFIG_KEYS.CREDIT_UNIT_PRICE_CENTS]: "99.9",
  [CONFIG_KEYS.BOOST_COST]: "5",
  [CONFIG_KEYS.PREMIUM_COST]: "20",
};
