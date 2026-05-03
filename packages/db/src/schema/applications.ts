// @ts-nocheck
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { jobs } from "./jobs";

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  providerId: uuid("provider_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  priceProposal: integer("price_proposal"), // em centavos
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// @ts-ignore
export const insertApplicationSchema = createInsertSchema(applications);
// @ts-ignore
export const selectApplicationSchema = createSelectSchema(applications);

export type Application = z.infer<typeof selectApplicationSchema>;
export type NewApplication = z.infer<typeof insertApplicationSchema>;
