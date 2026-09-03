import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workoutLogs = sqliteTable("workout_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  workoutDate: text("workout_date").notNull(),
  session: text("session").notNull(),
  exerciseId: text("exercise_id").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_workout_logs_owner_date_session_exercise").on(table.ownerId, table.workoutDate, table.session, table.exerciseId),
  index("idx_workout_logs_owner_date").on(table.ownerId, table.workoutDate),
]);
