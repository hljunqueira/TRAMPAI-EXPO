import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: [
    "PURCHASE", 
    "UNLOCK_SPEND", 
    "WELCOME_BONUS", 
    "REFUND_ANTIVACUO", 
    "ADMIN_GRANT", 
    "REFERRAL_BONUS",
    "BOOST_SPEND",
    "PREMIUM_SPEND",
    "REFUND"
  ] }).notNull(),
  credits: integer("credits").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

// @ts-ignore
export type Transaction = z.infer<typeof selectTransactionSchema>;
// @ts-ignore
export type NewTransaction = z.infer<typeof insertTransactionSchema>;
