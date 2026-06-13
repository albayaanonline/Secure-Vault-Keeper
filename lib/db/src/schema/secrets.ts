import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const secretsTable = pgTable("secrets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  title: text("title").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  description: text("description"),
  tags: text("tags").array().notNull().default([]),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecretSchema = createInsertSchema(secretsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSecret = z.infer<typeof insertSecretSchema>;
export type Secret = typeof secretsTable.$inferSelect;
