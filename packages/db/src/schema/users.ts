// @ts-nocheck
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { jobs } from "./jobs";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["client", "provider", "admin"] }).notNull().default("client"), // Mantemos por compatibilidade, mas admin é o principal uso agora
  password: text("password"), 
  avatarUrl: text("avatar_url"),
  phone: text("phone"), // WhatsApp
  
  // Novo modelo bidirecional
  isProvider: boolean("is_provider").notNull().default(false),
  isVerifiedProvider: boolean("is_verified_provider").notNull().default(false),
  providerBio: text("provider_bio"),
  providerCategories: text("provider_categories").array(), // IDs das categorias
  rating: text("rating").default("0.0"),
  reviewCount: integer("review_count").notNull().default(0),
  
  // Documentos para verificação
  documentUrl: text("document_url"),
  selfieUrl: text("selfie_url"),
  portfolioImages: text("portfolio_images").array(),
  
  // Localização
  city: text("city"),
  neighborhood: text("neighborhood"),
  state: text("state"),
  cep: text("cep"),
  address: text("address"),
  number: text("number"),
  complement: text("complement"),
  
  // Créditos e Indicação
  creditBalance: integer("credit_balance").notNull().default(0),
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by").references(() => users.id),
  
  // Status e Auditoria
  verificationStatus: text("verification_status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("PENDING"),
  bannedAt: timestamp("banned_at"),
  banReason: text("ban_reason"),
  pushToken: text("push_token"),
  boostedUntil: timestamp("boosted_until"),
  isPremium: boolean("is_premium").notNull().default(false),
  jobsPostedCount: integer("jobs_posted_count").notNull().default(0),
  jobsCompletedCount: integer("jobs_completed_count").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  fromUserId: uuid("from_user_id").references(() => users.id).notNull(),
  toUserId: uuid("to_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Review = z.infer<typeof selectReviewSchema>;
