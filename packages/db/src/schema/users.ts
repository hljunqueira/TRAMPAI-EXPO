// @ts-nocheck
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["client", "provider", "admin"] }).notNull().default("client"),
  password: text("password"), // Hash da senha
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"), // WhatsApp
  emailVerifiedAt: timestamp("email_verified_at"),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// @ts-ignore
export const insertUserSchema = createInsertSchema(users);
// @ts-ignore
export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
