import { Router, type IRouter } from "express";
import { desc, count, sql, eq } from "drizzle-orm";
import { db, prdsTable, tasksTable, adminLogsTable, sprintConfigTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
  GetSprintConfigResponse,
  UpdateSprintConfigBody,
  UpdateSprintConfigResponse,
  GetAdminLogsResponse,
} from "@workspace/api-zod";
import { requireAdminAuth, issueAdminToken } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

  if (parsed.data.password !== adminPassword) {
    req.log.warn("Failed admin login attempt");
    await db.insert(adminLogsTable).values({
      eventType: "admin_login_failed",
      prdId: null,
      details: "Failed login attempt",
    });
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = issueAdminToken();

  await db.insert(adminLogsTable).values({
    eventType: "admin_login",
    prdId: null,
    details: "Admin logged in successfully",
  });

  req.log.info("Admin login successful");
  res.json(AdminLoginResponse.parse({ token }));
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
      tasksByRisk: tasksByRisk.map((r) => ({ riskLevel: r.riskLevel, count: r.count })),
      tasksBySprint: tasksBySprint.map((s) => ({
        sprintNumber: s.sprintNumber,
        taskCount: s.taskCount,
      })),
    })
  );
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
