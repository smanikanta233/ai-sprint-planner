import { pgTable, text, serial, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { prdsTable } from "./prds";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  prdId: integer("prd_id").notNull().references(() => prdsTable.id),
  taskName: text("task_name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  effortPoints: integer("effort_points").notNull(),
  priorityScore: numeric("priority_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  dependencies: jsonb("dependencies").notNull().default([]),
  sprintNumber: integer("sprint_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
