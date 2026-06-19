import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sprintConfigTable = pgTable("sprint_config", {
  id: serial("id").primaryKey(),
  sprintLengthDays: integer("sprint_length_days").notNull().default(14),
  velocityPoints: integer("velocity_points").notNull().default(20),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSprintConfigSchema = createInsertSchema(sprintConfigTable).omit({ id: true });
export type InsertSprintConfig = z.infer<typeof insertSprintConfigSchema>;
export type SprintConfig = typeof sprintConfigTable.$inferSelect;
