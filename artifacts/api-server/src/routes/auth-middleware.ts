import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
  });

  if (!user) {
    const email = (req as any).auth?.sessionClaims?.email as string ?? `${userId}@unknown.local`;
    [user] = await db.insert(usersTable).values({
      clerkId: userId,
      email,
    }).returning();
  }

  (req as any).dbUser = user;
  next();
}
