/**
 * Smart Logic Layer — Deterministic task scoring and sprint allocation.
 * Zero AI calls. All logic is rule-based.
 */

// Fibonacci sequence for effort point normalization
const FIBONACCI = [1, 2, 3, 5, 8, 13];

/**
 * 1. Effort Normalization
 * Maps any effort estimate to the nearest Fibonacci number.
 */
export function normalizeFibonacci(effort: number): number {
  let closest = FIBONACCI[0];
  let minDiff = Math.abs(effort - FIBONACCI[0]);
  for (const fib of FIBONACCI) {
    const diff = Math.abs(effort - fib);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fib;
    }
  }
  return closest;
}

export interface RawTask {
  taskName: string;
  description: string;
  category: "frontend" | "backend" | "database" | "devops" | "design";
  effortPoints: number;
  dependencies: number[]; // indices into the task array
}

export interface ScoredTask extends RawTask {
  effortPoints: number; // normalized
  priorityScore: number;
  riskLevel: "low" | "medium" | "high";
  sprintNumber: number;
}

/**
 * 2. Dependency Detection
 * Detects dependency keywords in description AND enforces backend→frontend category rule.
 */
function detectDependencies(tasks: RawTask[]): RawTask[] {
  const dependencyKeywords = ["after", "requires", "depends on", "dependent on", "following"];

  return tasks.map((task, i) => {
    const deps = new Set<number>(task.dependencies);

    // Keyword-based detection: scan description for references to other task names
    const descLower = task.description.toLowerCase();
    const hasKeyword = dependencyKeywords.some((kw) => descLower.includes(kw));

    if (hasKeyword) {
      // Find tasks mentioned by name in description
      tasks.forEach((other, j) => {
        if (j !== i && descLower.includes(other.taskName.toLowerCase())) {
          deps.add(j);
        }
      });
    }

    // Category rule: frontend tasks depend on backend tasks
    if (task.category === "frontend") {
      tasks.forEach((other, j) => {
        if (j !== i && other.category === "backend") {
          deps.add(j);
        }
      });
    }

    return { ...task, dependencies: Array.from(deps) };
  });
}

/**
 * 3. Priority Score
 * priority_score = (business_value_weight * 3) + (10 - effort_points) + (dependency_count * -2) + risk_penalty
 *
 * business_value_weight is derived from category:
 *   backend=5, frontend=4, database=4, devops=3, design=3
 */
function categoryBusinessValue(category: string): number {
  const map: Record<string, number> = {
    backend: 5,
    database: 4,
    frontend: 4,
    devops: 3,
    design: 3,
  };
  return map[category] ?? 3;
}

function riskPenalty(riskLevel: string): number {
  if (riskLevel === "high") return -5;
  if (riskLevel === "medium") return -2;
  return 0;
}

/**
 * 4. Risk Flagging
 * high   → effort >= 8, OR deps >= 2, OR description < 10 words (any one is enough)
 * medium → effort >= 5 and < 8, OR dep count === 1
 * low    → everything else
 */
function computeRisk(
  effort: number,
  depCount: number,
  description: string
): "low" | "medium" | "high" {
  const wordCount = description.trim().split(/\s+/).filter((w) => w.length > 0).length;

  // HIGH: any single condition is enough
  if (effort >= 8 || depCount >= 2 || wordCount < 10) return "high";

  // MEDIUM: moderate effort or a single dependency
  if ((effort >= 5 && effort < 8) || depCount === 1) return "medium";

  return "low";
}

/**
 * 5. Sprint Allocation
 * Greedy fill by priority_score descending, respects velocity_points per sprint,
 * and is dependency-aware (a task cannot enter sprint N if any dependency is in sprint > N).
 */
function allocateSprints(tasks: ScoredTask[], velocityPoints: number): ScoredTask[] {
  // Sort by priority score descending
  const indexed = tasks.map((t, i) => ({ ...t, originalIndex: i }));
  indexed.sort((a, b) => b.priorityScore - a.priorityScore);

  const sprintOf: number[] = new Array(tasks.length).fill(0);
  const sprintCapacity: number[] = [];

  const getOrCreateSprint = (sprint: number): void => {
    while (sprintCapacity.length < sprint) {
      sprintCapacity.push(velocityPoints);
    }
  };

  for (const task of indexed) {
    const idx = task.originalIndex;

    // Find earliest sprint where all dependencies are placed before this sprint
    let earliestSprint = 1;
    for (const depIdx of task.dependencies) {
      if (depIdx < tasks.length) {
        earliestSprint = Math.max(earliestSprint, sprintOf[depIdx] + 1);
      }
    }

    // Find a sprint with enough capacity starting from earliestSprint
    let assignedSprint = earliestSprint;
    getOrCreateSprint(assignedSprint);

    while (sprintCapacity[assignedSprint - 1] < task.effortPoints) {
      assignedSprint++;
      getOrCreateSprint(assignedSprint);
    }

    sprintCapacity[assignedSprint - 1] -= task.effortPoints;
    sprintOf[idx] = assignedSprint;
  }

  return tasks.map((t, i) => ({ ...t, sprintNumber: sprintOf[i] }));
}

/**
 * 4b. Doc/Test task detection
 * Tasks about documentation or testing come after implementation — apply a
 * priority penalty so the sprint allocator naturally places them later.
 */
const DOC_TEST_KEYWORDS = [
  "document",
  "documentation",
  "update doc",
  "project doc",
  "write doc",
  "test case",
  "write test",
  "testing",
  "qa",
  "quality assurance",
  "monitor",
  "post-launch",
  "update project",
];

function docTestPenalty(taskName: string, description: string): number {
  const combined = `${taskName} ${description}`.toLowerCase();
  return DOC_TEST_KEYWORDS.some((kw) => combined.includes(kw)) ? -8 : 0;
}

/**
 * Main entry point: score and allocate tasks.
 */
export function processTasks(
  rawTasks: RawTask[],
  velocityPoints: number = 20
): ScoredTask[] {
  // Step 1: normalize effort
  const normalized = rawTasks.map((t) => ({
    ...t,
    effortPoints: normalizeFibonacci(t.effortPoints),
  }));

  // Step 2: detect dependencies
  const withDeps = detectDependencies(normalized);

  // Step 3 & 4: compute risk and priority score
  const scored: ScoredTask[] = withDeps.map((task) => {
    const risk = computeRisk(task.effortPoints, task.dependencies.length, task.description);
    const businessValue = categoryBusinessValue(task.category);
    const priority =
      businessValue * 3 +
      (10 - task.effortPoints) +
      task.dependencies.length * -2 +
      riskPenalty(risk) +
      docTestPenalty(task.taskName, task.description);

    return {
      ...task,
      riskLevel: risk,
      priorityScore: priority,
      sprintNumber: 0,
    };
  });

  // Step 5: allocate sprints
  return allocateSprints(scored, velocityPoints);
}
