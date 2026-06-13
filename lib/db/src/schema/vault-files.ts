import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vaultFilesTable = pgTable("vault_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  objectPath: text("object_path").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  encryptedKey: text("encrypted_key"),
  description: text("description"),
  tags: text("tags").array().notNull().default([]),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVaultFileSchema = createInsertSchema(vaultFilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVaultFile = z.infer<typeof insertVaultFileSchema>;
export type VaultFile = typeof vaultFilesTable.$inferSelect;
