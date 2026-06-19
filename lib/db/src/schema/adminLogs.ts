import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminLogsTable = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  prdId: integer("prd_id"),
  details: text("details").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminLogSchema = createInsertSchema(adminLogsTable).omit({ id: true, timestamp: true });
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogsTable.$inferSelect;
