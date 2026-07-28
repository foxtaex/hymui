import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const actors = pgTable(
  "actors",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    displayName: text("display_name").notNull(),
    id: text("id").primaryKey(),
    passwordHash: text("password_hash"),
    username: text("username").notNull(),
  },
  (table) => [uniqueIndex("actors_username_unique").on(table.username)],
);

export const sessions = pgTable(
  "sessions",
  {
    actorId: text("actor_id")
      .notNull()
      .references(() => actors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)],
);

export const projects = pgTable("projects", {
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  description: text("description").notNull().default(""),
  id: text("id").primaryKey(),
  linksJson: text("links_json").notNull().default("[]"),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => actors.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export const projectAttachments = pgTable(
  "project_attachments",
  {
    byteLength: integer("byte_length").notNull(),
    checksum: text("checksum").notNull(),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    fileName: text("file_name").notNull(),
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("project_attachments_object_key_unique").on(table.objectKey)],
);

export const diagnosticJobs = pgTable("diagnostic_jobs", {
  attempt: integer("attempt").notNull().default(0),
  claimTokenHash: text("claim_token_hash"),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
  correlationId: text("correlation_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  id: text("id").primaryKey(),
  lastError: text("last_error"),
  leaseExpiresAt: timestamp("lease_expires_at", { mode: "date", withTimezone: true }),
  message: text("message").notNull(),
  result: text("result"),
  status: text("status").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
  workerId: text("worker_id"),
});

export const diagnosticJobAttempts = pgTable(
  "diagnostic_job_attempts",
  {
    attempt: integer("attempt").notNull(),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    error: text("error"),
    heartbeatAt: timestamp("heartbeat_at", { mode: "date", withTimezone: true }),
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => diagnosticJobs.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }).notNull(),
    status: text("status").notNull(),
    workerId: text("worker_id").notNull(),
  },
  (table) => [uniqueIndex("diagnostic_job_attempt_unique").on(table.jobId, table.attempt)],
);
