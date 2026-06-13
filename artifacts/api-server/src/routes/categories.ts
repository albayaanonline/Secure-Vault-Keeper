import { Router } from "express";
import { db, categoriesTable, secretsTable } from "@workspace/db";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import { CreateCategoryBody, UpdateCategoryBody, UpdateCategoryParams, DeleteCategoryParams } from "@workspace/api-zod";

const router = Router();

const SYSTEM_CATEGORIES = [
  { slug: "passwords", name: "Passwords", icon: "lock", color: "#3B82F6" },
  { slug: "api-keys", name: "API Keys", icon: "key", color: "#8B5CF6" },
  { slug: "tokens", name: "Access Tokens", icon: "shield", color: "#06B6D4" },
  { slug: "ssh-keys", name: "SSH Keys", icon: "terminal", color: "#10B981" },
  { slug: "database", name: "Database Credentials", icon: "database", color: "#F59E0B" },
  { slug: "crypto-wallets", name: "Crypto Wallets", icon: "bitcoin", color: "#F97316" },
  { slug: "documents", name: "Documents", icon: "file-text", color: "#EC4899" },
  { slug: "notes", name: "Private Notes", icon: "sticky-note", color: "#6366F1" },
  { slug: "server-creds", name: "Server Credentials", icon: "server", color: "#14B8A6" },
];

async function ensureSystemCategories(userId: number) {
  for (const cat of SYSTEM_CATEGORIES) {
    const existing = await db.query.categoriesTable.findFirst({
      where: and(eq(categoriesTable.userId, userId), eq(categoriesTable.slug, cat.slug)),
    });
    if (!existing) {
      await db.insert(categoriesTable).values({
        userId,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
      });
    }
  }
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  await ensureSystemCategories(user.id);

  const cats = await db.query.categoriesTable.findMany({
    where: eq(categoriesTable.userId, user.id),
  });

  const secretCounts = await db
    .select({ categoryId: secretsTable.categoryId, count: sql<number>`count(*)::int` })
    .from(secretsTable)
    .where(and(eq(secretsTable.userId, user.id), eq(secretsTable.isArchived, false)))
    .groupBy(secretsTable.categoryId);

  const countMap = new Map(secretCounts.map(sc => [sc.categoryId, sc.count]));

  res.json(cats.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    isSystem: c.isSystem,
    secretCount: countMap.get(c.id) ?? 0,
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [created] = await db.insert(categoriesTable).values({
    userId: user.id,
    name: parsed.data.name,
    slug: `custom-${slug}-${Date.now()}`,
    icon: parsed.data.icon,
    color: parsed.data.color,
    isSystem: false,
  }).returning();

  res.status(201).json({ id: created.id, name: created.name, slug: created.slug, icon: created.icon, color: created.color, isSystem: created.isSystem, secretCount: 0 });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = UpdateCategoryParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db.update(categoriesTable)
    .set({ ...body.data })
    .where(and(eq(categoriesTable.id, params.data.id), eq(categoriesTable.userId, user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ id: updated.id, name: updated.name, slug: updated.slug, icon: updated.icon, color: updated.color, isSystem: updated.isSystem, secretCount: 0 });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = DeleteCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(categoriesTable)
    .where(and(eq(categoriesTable.id, params.data.id), eq(categoriesTable.userId, user.id), eq(categoriesTable.isSystem, false)));

  res.status(204).end();
});

export { ensureSystemCategories };
export default router;
