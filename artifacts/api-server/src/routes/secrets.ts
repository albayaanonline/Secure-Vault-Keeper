import { Router } from "express";
import { db, secretsTable, categoriesTable, activityTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import {
  ListSecretsQueryParams,
  CreateSecretBody,
  GetSecretParams,
  UpdateSecretParams,
  UpdateSecretBody,
  DeleteSecretParams,
  ToggleFavoriteSecretParams,
  ToggleArchiveSecretParams,
  RecordSecretAccessParams,
} from "@workspace/api-zod";

const router = Router();

function formatSecretMeta(s: any, cat: any) {
  return {
    id: s.id,
    title: s.title,
    categorySlug: cat?.slug ?? "",
    categoryName: cat?.name ?? "",
    categoryIcon: cat?.icon ?? "key",
    categoryColor: cat?.color ?? "#3B82F6",
    description: s.description,
    tags: s.tags ?? [],
    isFavorite: s.isFavorite,
    isArchived: s.isArchived,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    lastAccessedAt: s.lastAccessedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = ListSecretsQueryParams.safeParse(req.query);

  let query = db
    .select({ secret: secretsTable, category: categoriesTable })
    .from(secretsTable)
    .leftJoin(categoriesTable, eq(secretsTable.categoryId, categoriesTable.id))
    .where(eq(secretsTable.userId, user.id));

  const secrets = await query;

  let result = secrets;

  if (params.success) {
    const { category, search, tag, archived, favorite } = params.data;
    result = result.filter(r => {
      if (category && r.category?.slug !== category) return false;
      if (search && !r.secret.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (tag && !(r.secret.tags ?? []).includes(tag)) return false;
      if (archived !== undefined && r.secret.isArchived !== archived) return false;
      if (favorite !== undefined && r.secret.isFavorite !== favorite) return false;
      return true;
    });
  }

  res.json(result.map(r => formatSecretMeta(r.secret, r.category)));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const parsed = CreateSecretBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [created] = await db.insert(secretsTable).values({
    userId: user.id,
    categoryId: parsed.data.categoryId,
    title: parsed.data.title,
    encryptedValue: parsed.data.encryptedValue,
    description: parsed.data.description,
    tags: parsed.data.tags ?? [],
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).returning();

  const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, created.categoryId) });

  await db.insert(activityTable).values({
    userId: user.id,
    action: "created",
    resourceType: "secret",
    resourceId: created.id,
    resourceTitle: created.title,
  });

  res.status(201).json({ ...formatSecretMeta(created, cat), encryptedValue: created.encryptedValue });
});

router.get("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = GetSecretParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const result = await db
    .select({ secret: secretsTable, category: categoriesTable })
    .from(secretsTable)
    .leftJoin(categoriesTable, eq(secretsTable.categoryId, categoriesTable.id))
    .where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)))
    .limit(1);

  if (!result.length) {
    res.status(404).json({ error: "Secret not found" });
    return;
  }

  const { secret, category } = result[0];
  res.json({ ...formatSecretMeta(secret, category), encryptedValue: secret.encryptedValue });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = UpdateSecretParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateSecretBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updateData: any = { updatedAt: new Date() };
  if (body.data.title !== undefined) updateData.title = body.data.title;
  if (body.data.categoryId !== undefined) updateData.categoryId = body.data.categoryId;
  if (body.data.encryptedValue !== undefined) updateData.encryptedValue = body.data.encryptedValue;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.tags !== undefined) updateData.tags = body.data.tags;
  if (body.data.expiresAt !== undefined) updateData.expiresAt = body.data.expiresAt ? new Date(body.data.expiresAt) : null;

  const [updated] = await db.update(secretsTable)
    .set(updateData)
    .where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Secret not found" });
    return;
  }

  const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, updated.categoryId) });

  await db.insert(activityTable).values({
    userId: user.id,
    action: "updated",
    resourceType: "secret",
    resourceId: updated.id,
    resourceTitle: updated.title,
  });

  res.json({ ...formatSecretMeta(updated, cat), encryptedValue: updated.encryptedValue });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = DeleteSecretParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const secret = await db.query.secretsTable.findFirst({
    where: and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)),
  });

  if (!secret) {
    res.status(404).json({ error: "Secret not found" });
    return;
  }

  await db.delete(secretsTable).where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)));

  await db.insert(activityTable).values({
    userId: user.id,
    action: "deleted",
    resourceType: "secret",
    resourceId: secret.id,
    resourceTitle: secret.title,
  });

  res.status(204).end();
});

router.patch("/:id/favorite", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = ToggleFavoriteSecretParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const secret = await db.query.secretsTable.findFirst({
    where: and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)),
  });
  if (!secret) {
    res.status(404).json({ error: "Secret not found" });
    return;
  }

  const [updated] = await db.update(secretsTable)
    .set({ isFavorite: !secret.isFavorite, updatedAt: new Date() })
    .where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)))
    .returning();

  const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, updated.categoryId) });
  res.json(formatSecretMeta(updated, cat));
});

router.patch("/:id/archive", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = ToggleArchiveSecretParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const secret = await db.query.secretsTable.findFirst({
    where: and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)),
  });
  if (!secret) {
    res.status(404).json({ error: "Secret not found" });
    return;
  }

  const [updated] = await db.update(secretsTable)
    .set({ isArchived: !secret.isArchived, updatedAt: new Date() })
    .where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)))
    .returning();

  const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, updated.categoryId) });
  res.json(formatSecretMeta(updated, cat));
});

router.post("/:id/access", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = RecordSecretAccessParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [updated] = await db.update(secretsTable)
    .set({ lastAccessedAt: new Date() })
    .where(and(eq(secretsTable.id, params.data.id), eq(secretsTable.userId, user.id)))
    .returning();

  if (updated) {
    await db.insert(activityTable).values({
      userId: user.id,
      action: "viewed",
      resourceType: "secret",
      resourceId: updated.id,
      resourceTitle: updated.title,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  res.json({ ok: true });
});

export default router;
