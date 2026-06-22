import { Router, type IRouter } from "express";
import { desc, count, eq, avg, max, sql, and, ilike } from "drizzle-orm";
import { db, prdsTable, tasksTable, adminLogsTable, sprintConfigTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
  GetSprintConfigResponse,
  UpdateSprintConfigBody,
  UpdateSprintConfigResponse,
  GetAdminLogsResponse,
  GetAdminPrdsResponse,
} from "@workspace/api-zod";
import { requireAdminAuth, issueAdminToken, revokeAdminToken } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Derive a priority label from average priority score */
function priorityLabel(score: number): string {
  if (score >= 18) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

/**
 * POST /admin/login — authenticate with ADMIN_PASSWORD, return session token
 */
router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD not configured");
    res.status(500).json({ error: "Admin not configured" });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null;
  const userAgent = req.headers["user-agent"] ?? null;

  if (parsed.data.password !== adminPassword) {
    req.log.warn("Failed admin login attempt");
    await db.insert(adminLogsTable).values({
      eventType: "admin_login_failed",
      prdId: null,
      details: "Failed login attempt",
      ipAddress: ip,
      userAgent,
    });
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = issueAdminToken();

  await db.insert(adminLogsTable).values({
    eventType: "admin_login",
    prdId: null,
    details: "Admin logged in successfully",
    ipAddress: ip,
    userAgent,
  });

  req.log.info("Admin login successful");
  res.json(AdminLoginResponse.parse({ token }));
});

/**
 * GET /admin/verify — confirm the bearer token is still valid (protected).
 * requireAdminAuth returns 401 if not; reaching the handler means it is valid.
 */
router.get("/admin/verify", requireAdminAuth, (_req, res): void => {
  res.json({ valid: true });
});

/**
 * POST /admin/logout — invalidate the current token server-side (protected)
 */
router.post("/admin/logout", requireAdminAuth, (req, res): void => {
  const token = (req.headers.authorization ?? "").slice(7);
  revokeAdminToken(token);
  req.log.info("Admin logged out");
  res.json({ valid: false });
});

/**
 * GET /admin/stats — aggregate stats (protected)
 */
router.get("/admin/stats", requireAdminAuth, async (req, res): Promise<void> => {
  const [{ totalPrds }] = await db
    .select({ totalPrds: count() })
    .from(prdsTable);

  const [{ totalTasks }] = await db
    .select({ totalTasks: count() })
    .from(tasksTable);

  // Average priority and effort across all tasks
  const [aggRow] = await db
    .select({
      avgPriority: avg(tasksTable.priorityScore),
      avgEffort: avg(tasksTable.effortPoints),
    })
    .from(tasksTable);

  // Count tasks with high/critical priority score (>= 12)
  const [{ highCount }] = await db
    .select({ highCount: count() })
    .from(tasksTable)
    .where(sql`CAST(${tasksTable.priorityScore} AS NUMERIC) >= 12`);

  // Average sprint count per PRD
  const sprintAgg = await db
    .select({
      prdId: tasksTable.prdId,
      maxSprint: max(tasksTable.sprintNumber),
    })
    .from(tasksTable)
    .groupBy(tasksTable.prdId);

  const avgSprintCount =
    sprintAgg.length > 0
      ? sprintAgg.reduce((sum, r) => sum + (r.maxSprint ?? 0), 0) / sprintAgg.length
      : 0;

  // Most recent PRD date
  const [mostRecent] = await db
    .select({ createdAt: prdsTable.createdAt })
    .from(prdsTable)
    .orderBy(desc(prdsTable.createdAt))
    .limit(1);

  const tasksByRisk = await db
    .select({
      riskLevel: tasksTable.riskLevel,
      count: count(),
    })
    .from(tasksTable)
    .groupBy(tasksTable.riskLevel);

  const tasksBySprint = await db
    .select({
      sprintNumber: tasksTable.sprintNumber,
      taskCount: count(),
    })
    .from(tasksTable)
    .groupBy(tasksTable.sprintNumber)
    .orderBy(tasksTable.sprintNumber);

  res.json(
    GetAdminStatsResponse.parse({
      totalPrds,
      totalTasks,
      highPriorityCount: highCount,
      avgPriorityScore: Number(aggRow?.avgPriority ?? 0),
      avgEffortScore: Number(aggRow?.avgEffort ?? 0),
      avgSprintCount: Math.round(avgSprintCount * 10) / 10,
      mostRecentDate: mostRecent?.createdAt.toISOString() ?? null,
      tasksByRisk: tasksByRisk.map((r) => ({ riskLevel: r.riskLevel, count: r.count })),
      tasksBySprint: tasksBySprint.map((s) => ({
        sprintNumber: s.sprintNumber,
        taskCount: s.taskCount,
      })),
    })
  );
});

/**
 * GET /admin/prds — full PRD list for admin table with filters (protected)
 */
router.get("/admin/prds", requireAdminAuth, async (req, res): Promise<void> => {
  const { urgency, complexity, priorityLabel: labelFilter } = req.query as Record<string, string | undefined>;

  // Subquery: per-prd task aggregates
  const taskAgg = db
    .select({
      prdId: tasksTable.prdId,
      avgPriority: avg(tasksTable.priorityScore).as("avg_priority"),
      avgEffort: avg(tasksTable.effortPoints).as("avg_effort"),
      sprintCount: sql<number>`MAX(${tasksTable.sprintNumber})`.as("sprint_count"),
    })
    .from(tasksTable)
    .groupBy(tasksTable.prdId)
    .as("task_agg");

  const whereConditions = [];
  if (urgency && urgency !== "all") whereConditions.push(eq(prdsTable.urgency, urgency));
  if (complexity && complexity !== "all") whereConditions.push(eq(prdsTable.complexity, complexity));

  const rows = await db
    .select({
      id: prdsTable.id,
      title: prdsTable.title,
      targetUser: prdsTable.targetUser,
      urgency: prdsTable.urgency,
      complexity: prdsTable.complexity,
      createdAt: prdsTable.createdAt,
      avgPriority: taskAgg.avgPriority,
      avgEffort: taskAgg.avgEffort,
      sprintCount: taskAgg.sprintCount,
    })
    .from(prdsTable)
    .leftJoin(taskAgg, eq(prdsTable.id, taskAgg.prdId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(prdsTable.createdAt));

  let result = rows.map((r) => {
    const avgPriorityScore = Number(r.avgPriority ?? 0);
    return {
      id: r.id,
      title: r.title,
      targetUser: r.targetUser,
      urgency: r.urgency,
      complexity: r.complexity,
      priorityLabel: priorityLabel(avgPriorityScore),
      avgPriorityScore,
      avgEffortScore: Number(r.avgEffort ?? 0),
      sprintCount: Number(r.sprintCount ?? 0),
      createdAt: r.createdAt.toISOString(),
    };
  });

  // Apply priority label filter in-memory (since it's derived)
  if (labelFilter && labelFilter !== "all") {
    result = result.filter((r) => r.priorityLabel === labelFilter);
  }

  res.json(GetAdminPrdsResponse.parse(result));
});

/**
 * GET /admin/sprint-config — get singleton sprint config (protected)
 */
router.get("/admin/sprint-config", requireAdminAuth, async (req, res): Promise<void> => {
  let [config] = await db.select().from(sprintConfigTable).limit(1);

  if (!config) {
    [config] = await db
      .insert(sprintConfigTable)
      .values({ sprintLengthDays: 14, velocityPoints: 20 })
      .returning();
  }

  res.json(
    GetSprintConfigResponse.parse({
      ...config,
      updatedAt: config.updatedAt.toISOString(),
    })
  );
});

/**
 * PUT /admin/sprint-config — update sprint config (protected)
 */
router.put("/admin/sprint-config", requireAdminAuth, async (req, res): Promise<void> => {
  const parsed = UpdateSprintConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [config] = await db.select().from(sprintConfigTable).limit(1);

  if (!config) {
    [config] = await db
      .insert(sprintConfigTable)
      .values({ sprintLengthDays: 14, velocityPoints: 20 })
      .returning();
  }

  const [updated] = await db
    .update(sprintConfigTable)
    .set({
      ...(parsed.data.sprintLengthDays !== undefined && {
        sprintLengthDays: parsed.data.sprintLengthDays,
      }),
      ...(parsed.data.velocityPoints !== undefined && {
        velocityPoints: parsed.data.velocityPoints,
      }),
    })
    .where(eq(sprintConfigTable.id, config.id))
    .returning();

  await db.insert(adminLogsTable).values({
    eventType: "sprint_config_updated",
    prdId: null,
    details: `Sprint config updated: length=${updated.sprintLengthDays}d, velocity=${updated.velocityPoints}pts`,
  });

  req.log.info({ config: updated }, "Sprint config updated");

  res.json(
    UpdateSprintConfigResponse.parse({
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    })
  );
});

/**
 * GET /admin/logs — recent admin logs (protected)
 */
router.get("/admin/logs", requireAdminAuth, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(adminLogsTable)
    .orderBy(desc(adminLogsTable.timestamp))
    .limit(100);

  res.json(
    GetAdminLogsResponse.parse(
      logs.map((l) => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
      }))
    )
  );
});

export default router;
