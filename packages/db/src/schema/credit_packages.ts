import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const creditPackages = pgTable("credit_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  priceCents: integer("price_cents").notNull(),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isHighlighted: boolean("is_highlighted").notNull().default(false), // "mais popular"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages);
export const selectCreditPackageSchema = createSelectSchema(creditPackages);

export type CreditPackage = z.infer<typeof selectCreditPackageSchema>;
export type NewCreditPackage = z.infer<typeof insertCreditPackageSchema>;
