import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    vaultLocked: user.vaultLocked,
    autoLockMinutes: user.autoLockMinutes,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/me", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({
      ...(parsed.data.displayName !== undefined && { displayName: parsed.data.displayName }),
      ...(parsed.data.autoLockMinutes !== undefined && { autoLockMinutes: parsed.data.autoLockMinutes }),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl,
    vaultLocked: updated.vaultLocked,
    autoLockMinutes: updated.autoLockMinutes,
    twoFactorEnabled: updated.twoFactorEnabled,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
