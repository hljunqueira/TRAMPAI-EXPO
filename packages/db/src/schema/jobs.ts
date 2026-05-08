// @ts-nocheck
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { categories } from "./categories";

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").references(() => categories.id).notNull(),
  clientId: uuid("client_id").references(() => users.id).notNull(),
  budget: integer("budget"), // em centavos
  status: text("status", { enum: ["open", "in_progress", "completed", "cancelled", "exclusive_pending"] }).notNull().default("open"),
  location: text("location").notNull(),
  city: text("city"),
  latitude: text("latitude"), // armazenado como string por precisão ou float
  longitude: text("longitude"),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    categoryIdx: index("category_idx").on(table.categoryId),
    cityIdx: index("city_idx").on(table.city),
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

// @ts-ignore
export const insertJobSchema = createInsertSchema(jobs);
// @ts-ignore
export const selectJobSchema = createSelectSchema(jobs);

export type Job = z.infer<typeof selectJobSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
