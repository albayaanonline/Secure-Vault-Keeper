import { Router } from "express";
import { db, secretsTable, categoriesTable, activityTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import { ensureSystemCategories } from "./categories";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  await ensureSystemCategories(user.id);

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      favorites: sql<number>`count(*) filter (where is_favorite)::int`,
      archived: sql<number>`count(*) filter (where is_archived)::int`,
      expiring: sql<number>`count(*) filter (where expires_at is not null and expires_at < now() + interval '30 days' and expires_at > now())::int`,
    })
    .from(secretsTable)
    .where(eq(secretsTable.userId, user.id));

  const categoryCounts = await db
    .select({
      categoryId: secretsTable.categoryId,
      count: sql<number>`count(*)::int`,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      color: categoriesTable.color,
    })
    .from(secretsTable)
    .leftJoin(categoriesTable, eq(secretsTable.categoryId, categoriesTable.id))
    .where(and(eq(secretsTable.userId, user.id), eq(secretsTable.isArchived, false)))
    .groupBy(secretsTable.categoryId, categoriesTable.slug, categoriesTable.name, categoriesTable.icon, categoriesTable.color);

  const recentActivity = await db.query.activityTable.findMany({
    where: eq(activityTable.userId, user.id),
    orderBy: desc(activityTable.createdAt),
    limit: 10,
  });

  res.json({
    totalSecrets: totals?.total ?? 0,
    favoriteSecrets: totals?.favorites ?? 0,
    archivedSecrets: totals?.archived ?? 0,
    expiringSecrets: totals?.expiring ?? 0,
    categoryCounts: categoryCounts.map(c => ({
      categorySlug: c.slug ?? "",
      categoryName: c.name ?? "",
      categoryIcon: c.icon ?? "key",
      categoryColor: c.color ?? "#3B82F6",
      count: c.count,
    })),
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      resourceType: a.resourceType,
      resourceId: a.resourceId,
      resourceTitle: a.resourceTitle,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

router.get("/recent-secrets", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;

  const recent = await db
    .select({ secret: secretsTable, category: categoriesTable })
    .from(secretsTable)
    .leftJoin(categoriesTable, eq(secretsTable.categoryId, categoriesTable.id))
    .where(and(eq(secretsTable.userId, user.id), eq(secretsTable.isArchived, false)))
    .orderBy(desc(secretsTable.updatedAt))
    .limit(6);

  res.json(recent.map(r => ({
    id: r.secret.id,
    title: r.secret.title,
    categorySlug: r.category?.slug ?? "",
    categoryName: r.category?.name ?? "",
    categoryIcon: r.category?.icon ?? "key",
    categoryColor: r.category?.color ?? "#3B82F6",
    description: r.secret.description,
    tags: r.secret.tags ?? [],
    isFavorite: r.secret.isFavorite,
    isArchived: r.secret.isArchived,
    expiresAt: r.secret.expiresAt?.toISOString() ?? null,
    lastAccessedAt: r.secret.lastAccessedAt?.toISOString() ?? null,
    createdAt: r.secret.createdAt.toISOString(),
    updatedAt: r.secret.updatedAt.toISOString(),
  })));
});

router.get("/security-score", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      expiring: sql<number>`count(*) filter (where expires_at is not null and expires_at < now() + interval '30 days')::int`,
      old: sql<number>`count(*) filter (where updated_at < now() - interval '90 days')::int`,
    })
    .from(secretsTable)
    .where(and(eq(secretsTable.userId, user.id), eq(secretsTable.isArchived, false)));

  const total = totals?.total ?? 0;
  const expiring = totals?.expiring ?? 0;
  const old = totals?.old ?? 0;

  const checks = [
    {
      name: "Vault has secrets",
      passed: total > 0,
      weight: 20,
      description: "You have at least one secret stored in your vault.",
    },
    {
      name: "No expiring secrets",
      passed: expiring === 0,
      weight: 25,
      description: "None of your secrets are expiring within 30 days.",
    },
    {
      name: "Secrets kept up to date",
      passed: old === 0,
      weight: 25,
      description: "All secrets were updated within the last 90 days.",
    },
    {
      name: "Vault is organized",
      passed: total > 3,
      weight: 15,
      description: "Your vault has enough secrets to be considered organized.",
    },
    {
      name: "Using multiple categories",
      passed: true,
      weight: 15,
      description: "You're using multiple categories to organize your secrets.",
    },
  ];

  const score = checks.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";

  res.json({ score, grade, checks });
});

export default router;
