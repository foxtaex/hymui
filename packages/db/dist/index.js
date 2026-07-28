// src/pglite.ts
import { createHash, randomUUID } from "crypto";
import { PGlite } from "@electric-sql/pglite";
import { and, asc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";

// src/schema.ts
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
var actors = pgTable(
  "actors",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    displayName: text("display_name").notNull(),
    id: text("id").primaryKey(),
    passwordHash: text("password_hash"),
    username: text("username").notNull()
  },
  (table) => [uniqueIndex("actors_username_unique").on(table.username)]
);
var sessions = pgTable(
  "sessions",
  {
    actorId: text("actor_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull()
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)]
);
var projects = pgTable("projects", {
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  description: text("description").notNull().default(""),
  id: text("id").primaryKey(),
  linksJson: text("links_json").notNull().default("[]"),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull()
});
var diagnosticJobs = pgTable("diagnostic_jobs", {
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
  workerId: text("worker_id")
});
var diagnosticJobAttempts = pgTable(
  "diagnostic_job_attempts",
  {
    attempt: integer("attempt").notNull(),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    error: text("error"),
    heartbeatAt: timestamp("heartbeat_at", { mode: "date", withTimezone: true }),
    id: text("id").primaryKey(),
    jobId: text("job_id").notNull().references(() => diagnosticJobs.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }).notNull(),
    status: text("status").notNull(),
    workerId: text("worker_id").notNull()
  },
  (table) => [uniqueIndex("diagnostic_job_attempt_unique").on(table.jobId, table.attempt)]
);

// src/pglite.ts
var foundationStatements = [
  `CREATE TABLE IF NOT EXISTS actors (
    id text PRIMARY KEY,
    username text NOT NULL UNIQUE,
    display_name text NOT NULL,
    password_hash text,
    created_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    actor_id text NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_actor_id_index ON sessions(actor_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id text PRIMARY KEY,
    owner_id text NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    archived boolean NOT NULL DEFAULT false,
    revision integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS projects_owner_id_index ON projects(owner_id)`,
  `CREATE TABLE IF NOT EXISTS diagnostic_jobs (
    id text PRIMARY KEY,
    correlation_id text NOT NULL,
    message text NOT NULL,
    status text NOT NULL,
    result text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    completed_at timestamptz
  )`
];
var durableJobStatements = [
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS worker_id text`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS claim_token_hash text`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS last_error text`,
  `CREATE INDEX IF NOT EXISTS diagnostic_jobs_claim_index
    ON diagnostic_jobs(status, lease_expires_at, created_at)`,
  `CREATE TABLE IF NOT EXISTS diagnostic_job_attempts (
    id text PRIMARY KEY,
    job_id text NOT NULL REFERENCES diagnostic_jobs(id) ON DELETE CASCADE,
    attempt integer NOT NULL,
    worker_id text NOT NULL,
    status text NOT NULL,
    started_at timestamptz NOT NULL,
    heartbeat_at timestamptz,
    completed_at timestamptz,
    error text,
    UNIQUE(job_id, attempt)
  )`
];
var projectLinksStatements = [
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS links_json text NOT NULL DEFAULT '[]'`
];
function migrationChecksum(statements) {
  return createHash("sha256").update(statements.join("\n-- statement --\n")).digest("hex");
}
var hymuiMigrations = [
  {
    checksum: migrationChecksum(foundationStatements),
    id: "0001",
    name: "persistence_identity_projects",
    statements: foundationStatements
  },
  {
    checksum: migrationChecksum(durableJobStatements),
    id: "0002",
    name: "durable_diagnostic_job_leases",
    statements: durableJobStatements
  },
  {
    checksum: migrationChecksum(projectLinksStatements),
    id: "0003",
    name: "project_external_links",
    statements: projectLinksStatements
  }
];
function actorRecord(row) {
  return {
    createdAt: row.createdAt.toISOString(),
    displayName: row.displayName,
    id: row.id,
    passwordHash: row.passwordHash,
    username: row.username
  };
}
function sessionRecord(row) {
  return {
    actorId: row.actorId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    tokenHash: row.tokenHash
  };
}
function projectRecord(row) {
  let links = [];
  try {
    const parsed = JSON.parse(row.linksJson);
    if (Array.isArray(parsed)) links = parsed;
  } catch {
    links = [];
  }
  return {
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    description: row.description,
    id: row.id,
    links,
    name: row.name,
    ownerId: row.ownerId,
    revision: row.revision,
    updatedAt: row.updatedAt.toISOString()
  };
}
function diagnosticJobRecord(row) {
  return {
    attempt: row.attempt,
    completedAt: row.completedAt?.toISOString() ?? null,
    correlationId: row.correlationId,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    leaseExpiresAt: row.leaseExpiresAt,
    message: row.message,
    result: row.result,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    workerId: row.workerId
  };
}
function isDuplicateError(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
async function createPgliteDatabase(options = {}) {
  const client = options.dataDirectory ? new PGlite(options.dataDirectory) : new PGlite();
  await client.waitReady;
  const database = drizzle(client);
  async function ensureMigrationTable() {
    await client.exec(`CREATE TABLE IF NOT EXISTS hymui_schema_migrations (
      id text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL
    )`);
  }
  async function migrationStatus() {
    await ensureMigrationTable();
    const result = await client.query("SELECT id, name, checksum, applied_at FROM hymui_schema_migrations ORDER BY id");
    return result.rows.map((row) => ({
      appliedAt: row.applied_at instanceof Date ? row.applied_at : new Date(row.applied_at),
      checksum: row.checksum,
      id: row.id,
      name: row.name,
      statements: []
    }));
  }
  const migrations = {
    async apply(pending) {
      const applied = await migrationStatus();
      const appliedById = new Map(applied.map((migration) => [migration.id, migration]));
      for (const migration of pending) {
        const existing = appliedById.get(migration.id);
        if (existing && existing.checksum !== migration.checksum) {
          throw new PersistenceError(
            "MIGRATION_CONFLICT",
            `Migration ${migration.id} has a different checksum.`
          );
        }
        if (existing) continue;
        await client.exec("BEGIN");
        try {
          for (const statement of migration.statements) await client.exec(statement);
          await client.query(
            "INSERT INTO hymui_schema_migrations (id, name, checksum, applied_at) VALUES ($1, $2, $3, $4)",
            [migration.id, migration.name, migration.checksum, (/* @__PURE__ */ new Date()).toISOString()]
          );
          await client.exec("COMMIT");
        } catch (error) {
          await client.exec("ROLLBACK");
          throw new PersistenceError(
            "DATABASE_UNAVAILABLE",
            error instanceof Error ? error.message : "Migration failed."
          );
        }
      }
      return migrationStatus();
    },
    status: migrationStatus
  };
  await migrations.apply(hymuiMigrations);
  const projectRepository = {
    async create(input) {
      const [created] = await database.insert(projects).values({
        archived: false,
        createdAt: input.timestamp,
        description: input.description ?? "",
        id: input.id,
        linksJson: JSON.stringify(input.links ?? []),
        name: input.name,
        ownerId: input.ownerId,
        revision: 1,
        updatedAt: input.timestamp
      }).returning();
      if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Project was not created.");
      return projectRecord(created);
    },
    async findById(id, actorId) {
      const [project] = await database.select().from(projects).where(and(eq(projects.id, id), eq(projects.ownerId, actorId))).limit(1);
      return project ? projectRecord(project) : null;
    },
    async listByActor(actorId) {
      const records = await database.select().from(projects).where(eq(projects.ownerId, actorId)).orderBy(asc(projects.createdAt));
      return records.map(projectRecord);
    },
    async update(input) {
      const [existing] = await database.select().from(projects).where(and(eq(projects.id, input.id), eq(projects.ownerId, input.ownerId))).limit(1);
      if (!existing) return null;
      if (existing.revision !== input.revision) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed after it was loaded."
        );
      }
      const [updated] = await database.update(projects).set({
        archived: input.archived ?? existing.archived,
        description: input.description ?? existing.description,
        linksJson: input.links === void 0 ? existing.linksJson : JSON.stringify(input.links),
        name: input.name ?? existing.name,
        revision: existing.revision + 1,
        updatedAt: input.timestamp
      }).where(
        and(
          eq(projects.id, input.id),
          eq(projects.ownerId, input.ownerId),
          eq(projects.revision, input.revision)
        )
      ).returning();
      if (!updated) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed while it was being saved."
        );
      }
      return projectRecord(updated);
    }
  };
  return {
    accounts: {
      async count() {
        const result = await database.select({ id: actors.id }).from(actors);
        return result.length;
      },
      async create(input) {
        try {
          const [created] = await database.insert(actors).values({
            createdAt: input.timestamp,
            displayName: input.displayName,
            id: input.id,
            passwordHash: input.passwordHash,
            username: input.username.toLowerCase()
          }).returning();
          if (!created) {
            throw new PersistenceError("DATABASE_UNAVAILABLE", "Account was not created.");
          }
          return actorRecord(created);
        } catch (error) {
          if (isDuplicateError(error)) {
            throw new PersistenceError("PERSISTENCE_DUPLICATE", "Username is already in use.");
          }
          throw error;
        }
      },
      async findById(id) {
        const [actor] = await database.select().from(actors).where(eq(actors.id, id)).limit(1);
        return actor ? actorRecord(actor) : null;
      },
      async findByUsername(username) {
        const [actor] = await database.select().from(actors).where(eq(actors.username, username.toLowerCase())).limit(1);
        return actor ? actorRecord(actor) : null;
      }
    },
    async close() {
      await client.close();
    },
    diagnosticJobs: {
      async cancel(id, timestamp2) {
        const [existing] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, id)).limit(1);
        if (!existing) return null;
        if (existing.status === "completed" || existing.status === "failed" || existing.status === "cancelled") {
          return diagnosticJobRecord(existing);
        }
        const [cancelled] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: timestamp2,
          leaseExpiresAt: null,
          status: "cancelled",
          updatedAt: timestamp2,
          workerId: null
        }).where(eq(diagnosticJobs.id, id)).returning();
        if (existing.status === "running") {
          await database.update(diagnosticJobAttempts).set({ completedAt: timestamp2, status: "cancelled" }).where(
            and(
              eq(diagnosticJobAttempts.jobId, id),
              eq(diagnosticJobAttempts.attempt, existing.attempt)
            )
          );
        }
        return cancelled ? diagnosticJobRecord(cancelled) : null;
      },
      async claimNext(input) {
        await client.exec("BEGIN");
        try {
          const claimed = await client.query(
            `WITH candidate AS (
              SELECT id
              FROM diagnostic_jobs
              WHERE status = 'queued'
                 OR (status = 'running' AND lease_expires_at < $1)
              ORDER BY created_at ASC
              LIMIT 1
              FOR UPDATE
            )
            UPDATE diagnostic_jobs
            SET status = 'running',
                attempt = attempt + 1,
                worker_id = $2,
                claim_token_hash = $3,
                lease_expires_at = $4,
                updated_at = $1,
                completed_at = NULL,
                result = NULL,
                last_error = NULL
            WHERE id = (SELECT id FROM candidate)
            RETURNING id, attempt`,
            [
              input.timestamp.toISOString(),
              input.workerId,
              input.leaseTokenHash,
              input.leaseExpiresAt.toISOString()
            ]
          );
          const record = claimed.rows[0];
          if (!record) {
            await client.exec("COMMIT");
            return null;
          }
          if (record.attempt > 1) {
            await database.update(diagnosticJobAttempts).set({
              completedAt: input.timestamp,
              error: "Worker lease expired before completion.",
              status: "expired"
            }).where(
              and(
                eq(diagnosticJobAttempts.jobId, record.id),
                eq(diagnosticJobAttempts.attempt, record.attempt - 1),
                eq(diagnosticJobAttempts.status, "running")
              )
            );
          }
          await database.insert(diagnosticJobAttempts).values({
            attempt: record.attempt,
            completedAt: null,
            error: null,
            heartbeatAt: input.timestamp,
            id: randomUUID(),
            jobId: record.id,
            startedAt: input.timestamp,
            status: "running",
            workerId: input.workerId
          });
          await client.exec("COMMIT");
          const [job] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, record.id)).limit(1);
          return job ? diagnosticJobRecord(job) : null;
        } catch (error) {
          await client.exec("ROLLBACK");
          throw error;
        }
      },
      async complete(input) {
        const [completed] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: input.timestamp,
          leaseExpiresAt: null,
          result: input.result,
          status: "completed",
          updatedAt: input.timestamp,
          workerId: null
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!completed) return null;
        await database.update(diagnosticJobAttempts).set({ completedAt: input.timestamp, status: "completed" }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, completed.attempt)
          )
        );
        return diagnosticJobRecord(completed);
      },
      async create(input) {
        const [created] = await database.insert(diagnosticJobs).values({
          attempt: 0,
          claimTokenHash: null,
          completedAt: null,
          correlationId: input.correlationId,
          createdAt: input.timestamp,
          id: input.id,
          lastError: null,
          leaseExpiresAt: null,
          message: input.request.message,
          result: null,
          status: "queued",
          updatedAt: input.timestamp,
          workerId: null
        }).returning();
        if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Job was not created.");
        return diagnosticJobRecord(created);
      },
      async fail(input) {
        const [failed] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: input.timestamp,
          lastError: input.error,
          leaseExpiresAt: null,
          result: null,
          status: "failed",
          updatedAt: input.timestamp,
          workerId: null
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!failed) return null;
        await database.update(diagnosticJobAttempts).set({ completedAt: input.timestamp, error: input.error, status: "failed" }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, failed.attempt)
          )
        );
        return diagnosticJobRecord(failed);
      },
      async get(id) {
        const [job] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, id)).limit(1);
        return job ? diagnosticJobRecord(job) : null;
      },
      async heartbeat(input) {
        const [heartbeat] = await database.update(diagnosticJobs).set({
          leaseExpiresAt: input.leaseExpiresAt,
          updatedAt: input.timestamp
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!heartbeat) return null;
        await database.update(diagnosticJobAttempts).set({ heartbeatAt: input.timestamp }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, heartbeat.attempt)
          )
        );
        return diagnosticJobRecord(heartbeat);
      }
    },
    kind: "pglite",
    migrations,
    projects: projectRepository,
    sessions: {
      async create(input) {
        const [created] = await database.insert(sessions).values({
          actorId: input.actorId,
          createdAt: input.timestamp,
          expiresAt: input.expiresAt,
          id: input.id,
          tokenHash: input.tokenHash
        }).returning();
        if (!created)
          throw new PersistenceError("DATABASE_UNAVAILABLE", "Session was not created.");
        return sessionRecord(created);
      },
      async deleteByTokenHash(tokenHash) {
        await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
      },
      async deleteExpired(timestamp2) {
        const deleted = await database.delete(sessions).where(lt(sessions.expiresAt, timestamp2)).returning({ id: sessions.id });
        return deleted.length;
      },
      async findByTokenHash(tokenHash) {
        const [session] = await database.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
        return session ? sessionRecord(session) : null;
      }
    }
  };
}

// src/index.ts
var PersistenceError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PersistenceError";
  }
  code;
};
export {
  PersistenceError,
  createPgliteDatabase,
  hymuiMigrations
};
