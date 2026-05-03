// @ts-nocheck
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(), // Nome do ícone do MaterialCommunityIcons
});

// @ts-ignore
export const insertCategorySchema = createInsertSchema(categories);
// @ts-ignore
export const selectCategorySchema = createSelectSchema(categories);

export type Category = z.infer<typeof selectCategorySchema>;
export type NewCategory = z.infer<typeof insertCategorySchema>;
