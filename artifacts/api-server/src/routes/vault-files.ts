import { Router } from "express";
import { db, vaultFilesTable, activityTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

function formatFile(f: any) {
  return {
    id: f.id,
    name: f.name,
    originalName: f.originalName,
    objectPath: f.objectPath,
    contentType: f.contentType,
    size: f.size,
    description: f.description ?? null,
    tags: f.tags ?? [],
    isFavorite: f.isFavorite,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const { search, contentType, favorite } = req.query as Record<string, string>;

  let files = await db.query.vaultFilesTable.findMany({
    where: eq(vaultFilesTable.userId, user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  if (search) {
    const q = search.toLowerCase();
    files = files.filter(f => f.name.toLowerCase().includes(q) || f.originalName.toLowerCase().includes(q));
  }
  if (contentType) {
    files = files.filter(f => f.contentType.startsWith(contentType));
  }
  if (favorite !== undefined) {
    const fav = favorite === "true";
    files = files.filter(f => f.isFavorite === fav);
  }

  res.json(files.map(formatFile));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const { name, originalName, objectPath, contentType, size, description, tags, encryptedKey } = req.body;

  if (!name || !originalName || !objectPath || !contentType || !size) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [created] = await db.insert(vaultFilesTable).values({
    userId: user.id,
    name,
    originalName,
    objectPath,
    contentType,
    size: Number(size),
    description: description || null,
    tags: tags ?? [],
    encryptedKey: encryptedKey || null,
  }).returning();

  await db.insert(activityTable).values({
    userId: user.id,
    action: "uploaded",
    resourceType: "file",
    resourceId: created.id,
    resourceTitle: created.name,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json(formatFile(created));
});

router.get("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const id = Number(req.params.id);

  const file = await db.query.vaultFilesTable.findFirst({
    where: and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(formatFile(file));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const id = Number(req.params.id);
  const { name, description, tags } = req.body;

  const updateData: any = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (tags !== undefined) updateData.tags = tags;

  const [updated] = await db.update(vaultFilesTable)
    .set(updateData)
    .where(and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(formatFile(updated));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const id = Number(req.params.id);

  const file = await db.query.vaultFilesTable.findFirst({
    where: and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  await db.delete(vaultFilesTable).where(and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)));

  await db.insert(activityTable).values({
    userId: user.id,
    action: "deleted",
    resourceType: "file",
    resourceId: file.id,
    resourceTitle: file.name,
  });

  res.status(204).end();
});

router.patch("/:id/favorite", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const id = Number(req.params.id);

  const file = await db.query.vaultFilesTable.findFirst({
    where: and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const [updated] = await db.update(vaultFilesTable)
    .set({ isFavorite: !file.isFavorite, updatedAt: new Date() })
    .where(and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)))
    .returning();

  res.json(formatFile(updated));
});

router.get("/:id/download-url", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const id = Number(req.params.id);

  const file = await db.query.vaultFilesTable.findFirst({
    where: and(eq(vaultFilesTable.id, id), eq(vaultFilesTable.userId, user.id)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  await db.insert(activityTable).values({
    userId: user.id,
    action: "downloaded",
    resourceType: "file",
    resourceId: file.id,
    resourceTitle: file.name,
  });

  res.json({ url: `/api/storage${file.objectPath}` });
});

export default router;
