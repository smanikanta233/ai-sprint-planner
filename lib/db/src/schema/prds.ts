import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prdsTable = pgTable("prds", {
  id: serial("id").primaryKey(),
  featureIdea: text("feature_idea").notNull(),
  title: text("title").notNull(),
  problemStatement: text("problem_statement").notNull(),
  goals: text("goals").notNull(),
  userStories: jsonb("user_stories").notNull().default([]),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPrdSchema = createInsertSchema(prdsTable).omit({ id: true, createdAt: true });
export type InsertPrd = z.infer<typeof insertPrdSchema>;
export type Prd = typeof prdsTable.$inferSelect;
