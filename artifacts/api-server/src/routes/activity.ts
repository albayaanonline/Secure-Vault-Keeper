import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth-middleware";
import { ListActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).dbUser;
  const params = ListActivityQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 50;
  const offset = params.success && params.data.offset ? Number(params.data.offset) : 0;

  const activities = await db.query.activityTable.findMany({
    where: eq(activityTable.userId, user.id),
    orderBy: desc(activityTable.createdAt),
    limit,
    offset,
  });

  res.json(activities.map(a => ({
    id: a.id,
    action: a.action,
    resourceType: a.resourceType,
    resourceId: a.resourceId,
    resourceTitle: a.resourceTitle,
    ipAddress: a.ipAddress,
    userAgent: a.userAgent,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
