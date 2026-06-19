import { Router, type IRouter } from "express";
import { eq, desc, avg, max, count, sql } from "drizzle-orm";
import { db, prdsTable, tasksTable, adminLogsTable, sprintConfigTable } from "@workspace/db";
import { CreatePrdBody, GetPrdParams, ListPrdsResponse, GetPrdResponse } from "@workspace/api-zod";
import { openai } from "../lib/openaiClient";
import { processTasks, type RawTask } from "../lib/scoringEngine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /prds — lightweight list with per-PRD aggregates
 */
router.get("/prds", async (req, res): Promise<void> => {
  // Subquery: compute per-prd aggregates from tasks
  const taskAgg = db
    .select({
      prdId: tasksTable.prdId,
      avgPriorityScore: avg(tasksTable.priorityScore).as("avg_priority_score"),
      avgEffortPoints: avg(tasksTable.effortPoints).as("avg_effort_points"),
      sprintCount: sql<number>`MAX(${tasksTable.sprintNumber})`.as("sprint_count"),
    })
    .from(tasksTable)
    .groupBy(tasksTable.prdId)
    .as("task_agg");

  const rows = await db
    .select({
      id: prdsTable.id,
      title: prdsTable.title,
      featureIdea: prdsTable.featureIdea,
      targetUser: prdsTable.targetUser,
      urgency: prdsTable.urgency,
      complexity: prdsTable.complexity,
      status: prdsTable.status,
      createdAt: prdsTable.createdAt,
      avgPriorityScore: taskAgg.avgPriorityScore,
      avgEffortPoints: taskAgg.avgEffortPoints,
      sprintCount: taskAgg.sprintCount,
    })
    .from(prdsTable)
    .leftJoin(taskAgg, eq(prdsTable.id, taskAgg.prdId))
    .orderBy(desc(prdsTable.createdAt));

  const result = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    avgPriorityScore: Number(r.avgPriorityScore ?? 0),
    avgEffortPoints: Number(r.avgEffortPoints ?? 0),
    sprintCount: Number(r.sprintCount ?? 0),
  }));

  res.json(ListPrdsResponse.parse(result));
});

/**
 * GET /prds/:id — full detail with tasks
 */
router.get("/prds/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPrdParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prd] = await db
    .select()
    .from(prdsTable)
    .where(eq(prdsTable.id, params.data.id));

  if (!prd) {
    res.status(404).json({ error: "PRD not found" });
    return;
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.prdId, params.data.id))
    .orderBy(tasksTable.sprintNumber);

  const result = {
    ...prd,
    createdAt: prd.createdAt.toISOString(),
    userStories: prd.userStories as Array<{ role: string; action: string; benefit: string }>,
    tasks: tasks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      priorityScore: Number(t.priorityScore),
      dependencies: (t.dependencies as number[]) ?? [],
    })),
  };

  res.json(GetPrdResponse.parse(result));
});

/**
 * POST /prds — generate PRD + tasks via GPT-4o, run scoring, save all, log
 */
router.post("/prds", async (req, res): Promise<void> => {
  const parsed = CreatePrdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    featureIdea,
    targetUser = "",
    businessGoal = "",
    deadline = "",
    urgency = "medium",
    complexity = "medium",
    additionalConstraints = "",
  } = parsed.data;

  // Fetch current sprint config (velocity)
  const configs = await db.select().from(sprintConfigTable).limit(1);
  const velocityPoints = configs[0]?.velocityPoints ?? 20;

  req.log.info({ featureIdea: featureIdea.slice(0, 80) }, "Generating PRD via GPT-4o");

  // Build a rich context string for the prompt
  const contextLines = [
    `Feature: ${featureIdea}`,
    targetUser ? `Target User: ${targetUser}` : null,
    businessGoal ? `Business Goal: ${businessGoal}` : null,
    deadline ? `Deadline / Sprint Expectation: ${deadline}` : null,
    urgency ? `Urgency: ${urgency}` : null,
    complexity ? `Complexity: ${complexity}` : null,
    additionalConstraints ? `Additional Constraints: ${additionalConstraints}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a senior product manager and engineering lead. Given a feature specification, generate a structured PRD and engineering task breakdown in valid JSON.

Return ONLY valid JSON with this exact structure:
{
  "title": "string — concise feature title",
  "problemStatement": "string — 2-3 sentences describing the problem",
  "goals": "string — bullet-point goals, one per line starting with -",
  "userStories": [
    { "role": "string", "action": "string", "benefit": "string" }
  ],
  "tasks": [
    {
      "taskName": "string — short imperative task name",
      "description": "string — at least 10 words describing what to build",
      "category": "frontend|backend|database|devops|design",
      "effortPoints": number (1-13, raw estimate before normalization),
      "dependencies": []
    }
  ]
}

Guidelines:
- Generate 6-12 engineering tasks covering all necessary layers
- Write descriptions with at least 10 words
- Dependencies should be empty arrays (they will be inferred automatically)
- Effort points: 1=trivial, 3=small, 5=medium, 8=large, 13=very large
- Factor in the urgency and complexity when estimating effort and scope`;

  let gptResult: {
    title: string;
    problemStatement: string;
    goals: string;
    userStories: Array<{ role: string; action: string; benefit: string }>;
    tasks: RawTask[];
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextLines },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "Empty response from AI" });
      return;
    }

    gptResult = JSON.parse(content);
  } catch (err) {
    req.log.error({ err }, "GPT-4o generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
    return;
  }

  // Run smart logic layer
  const scoredTasks = processTasks(gptResult.tasks, velocityPoints);

  // Save PRD
  const [prd] = await db
    .insert(prdsTable)
    .values({
      featureIdea,
      title: gptResult.title,
      targetUser,
      businessGoal,
      deadline,
      urgency,
      complexity,
      additionalConstraints,
      problemStatement: gptResult.problemStatement,
      goals: gptResult.goals,
      userStories: gptResult.userStories,
      status: "completed",
    })
    .returning();

  // Save tasks
  const savedTasks = await db
    .insert(tasksTable)
    .values(
      scoredTasks.map((t) => ({
        prdId: prd.id,
        taskName: t.taskName,
        description: t.description,
        category: t.category,
        effortPoints: t.effortPoints,
        priorityScore: String(t.priorityScore),
        riskLevel: t.riskLevel,
        dependencies: t.dependencies,
        sprintNumber: t.sprintNumber,
      }))
    )
    .returning();

  // Log event
  await db.insert(adminLogsTable).values({
    eventType: "prd_generated",
    prdId: prd.id,
    details: `Generated PRD "${prd.title}" with ${savedTasks.length} tasks`,
  });

  req.log.info({ prdId: prd.id, taskCount: savedTasks.length }, "PRD created");

  const result = {
    ...prd,
    createdAt: prd.createdAt.toISOString(),
    userStories: gptResult.userStories,
    tasks: savedTasks.map((t: typeof savedTasks[number]) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      priorityScore: Number(t.priorityScore),
      dependencies: (t.dependencies as number[]) ?? [],
    })),
  };

  res.status(201).json(GetPrdResponse.parse(result));
});

export default router;
