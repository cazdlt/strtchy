import {
  sqliteTable,
  AnySQLiteColumn,
  foreignKey,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const account = sqliteTable("account", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: integer("expires_at"),
  password: text(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const movements = sqliteTable("movements", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  type: text().notNull(),
  illustrationPath: text("illustration_path"),
  isCustom: integer("is_custom", { mode: "boolean" })
    .default(sql`1`)
    .notNull(),
  userId: text("user_id").references(() => user.id),
  weightUnit: text("weight_unit"),
  isBilateral: integer("is_bilateral", { mode: "boolean" })
    .default(sql`0`)
    .notNull(),
  switchSidesDuration: integer("switch_sides_duration")
    .default(sql`5`)
    .notNull(),
  equipment: text("equipment"),
  metadata: text(),
  createdAt: integer("created_at").notNull(),
});

export const practiceData = sqliteTable("practice_data", {
  id: text().primaryKey().notNull(),
  practiceLogId: text("practice_log_id")
    .notNull()
    .references(() => practiceLogs.id, { onDelete: "cascade" }),
  routineMovementId: text("routine_movement_id")
    .notNull()
    .references(() => routineMovements.id),
  setNumber: integer("set_number").notNull(),
  side: text("side"),
  value: integer().notNull(),
  measurementType: text("measurement_type").notNull(),
  customMeasurement: text("custom_measurement"),
  completedAt: integer("completed_at").notNull(),
});

export const practiceLogs = sqliteTable("practice_logs", {
  id: text().primaryKey().notNull(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id),
  userId: text("user_id").references(() => user.id),
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  duration: integer(),
  notes: text(),
});

export const routineMovements = sqliteTable("routine_movements", {
  id: text().primaryKey().notNull(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  movementId: text("movement_id")
    .notNull()
    .references(() => movements.id),
  order: integer().notNull(),
  target: text().notNull(),
  sets: integer()
    .default(sql`1`)
    .notNull(),
  isBilateral: integer("is_bilateral", { mode: "boolean" })
    .default(sql`0`)
    .notNull(),
  switchSidesDuration: integer("switch_sides_duration")
    .default(sql`5`)
    .notNull(),
  notes: text(),
  weight: integer("weight"),
  weightUnit: text("weight_unit"),
});

export const routines = sqliteTable("routines", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  userId: text("user_id").references(() => user.id),
  restBetweenMovements: integer("rest_between_movements")
    .default(sql`30`)
    .notNull(),
  restBetweenSets: integer("rest_between_sets")
    .default(sql`15`)
    .notNull(),
  autoAdvance: integer("auto_advance", { mode: "boolean" })
    .default(sql`1`)
    .notNull(),
  audioEnabled: integer("audio_enabled", { mode: "boolean" })
    .default(sql`1`)
    .notNull(),
  keepAwake: integer("keep_awake", { mode: "boolean" })
    .default(sql`1`)
    .notNull(),
  isCustom: integer("is_custom", { mode: "boolean" })
    .default(sql`0`)
    .notNull(),
  createdAt: integer("created_at").notNull(),
});

export const session = sqliteTable("session", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  token: text().notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const user = sqliteTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    email: text().notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .default(sql`0`)
      .notNull(),
    name: text(),
    username: text(),
    image: text(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    passwordHash: text("password_hash"),
    preferences: text(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const verification = sqliteTable("verification", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text().notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
