import { createHash, randomUUID } from "node:crypto";

import { PGlite } from "@electric-sql/pglite";
import type { JobStatus, Project, ProjectAttachment, ProjectLink } from "@hymui/contracts";
import { and, asc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";

import type {
  AccountRecord,
  AppliedMigration,
  ClaimDiagnosticJobInput,
  CompleteDiagnosticJobInput,
  CreateAccountInput,
  CreateDiagnosticJobInput,
  CreateProjectInput,
  CreateProjectAttachmentInput,
  CreateSessionInput,
  FailDiagnosticJobInput,
  HeartbeatDiagnosticJobInput,
  HymuiDatabase,
  Migration,
  PersistedDiagnosticJob,
  ProjectRepository,
  ProjectAttachmentRecord,
  ProjectAttachmentRepository,
  SessionRecord,
  UpdateProjectInput,
} from "./index.js";
import { PersistenceError } from "./index.js";
import {
  actors,
  diagnosticJobAttempts,
  diagnosticJobs,
  projectAttachments,
  projects,
  sessions,
} from "./schema.js";

const foundationStatements = [
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
  )`,
] as const;

const durableJobStatements = [
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
  )`,
] as const;

const projectLinksStatements = [
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS links_json text NOT NULL DEFAULT '[]'`,
] as const;

const projectAttachmentStatements = [
  `CREATE TABLE IF NOT EXISTS project_attachments (
    id text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    object_key text NOT NULL UNIQUE,
    file_name text NOT NULL,
    content_type text NOT NULL,
    byte_length integer NOT NULL,
    checksum text NOT NULL,
    created_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS project_attachments_project_id_index
    ON project_attachments(project_id, created_at)`,
] as const;

function migrationChecksum(statements: readonly string[]): string {
  return createHash("sha256").update(statements.join("\n-- statement --\n")).digest("hex");
}

export const hymuiMigrations: readonly Migration[] = [
  {
    checksum: migrationChecksum(foundationStatements),
    id: "0001",
    name: "persistence_identity_projects",
    statements: foundationStatements,
  },
  {
    checksum: migrationChecksum(durableJobStatements),
    id: "0002",
    name: "durable_diagnostic_job_leases",
    statements: durableJobStatements,
  },
  {
    checksum: migrationChecksum(projectLinksStatements),
    id: "0003",
    name: "project_external_links",
    statements: projectLinksStatements,
  },
  {
    checksum: migrationChecksum(projectAttachmentStatements),
    id: "0004",
    name: "project_attachments",
    statements: projectAttachmentStatements,
  },
];

function actorRecord(row: typeof actors.$inferSelect): AccountRecord {
  return {
    createdAt: row.createdAt.toISOString(),
    displayName: row.displayName,
    id: row.id,
    passwordHash: row.passwordHash,
    username: row.username,
  };
}

function sessionRecord(row: typeof sessions.$inferSelect): SessionRecord {
  return {
    actorId: row.actorId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    tokenHash: row.tokenHash,
  };
}

function projectRecord(row: typeof projects.$inferSelect): Project {
  let links: ProjectLink[] = [];
  try {
    const parsed = JSON.parse(row.linksJson) as unknown;
    if (Array.isArray(parsed)) links = parsed as ProjectLink[];
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
    updatedAt: row.updatedAt.toISOString(),
  };
}

function projectAttachmentRecord(
  row: typeof projectAttachments.$inferSelect,
): ProjectAttachmentRecord {
  const attachment: ProjectAttachment = {
    byteLength: row.byteLength,
    checksum: row.checksum,
    contentType: row.contentType,
    createdAt: row.createdAt.toISOString(),
    fileName: row.fileName,
    id: row.id,
    projectId: row.projectId,
  };
  return { ...attachment, objectKey: row.objectKey };
}

function diagnosticJobRecord(row: typeof diagnosticJobs.$inferSelect): PersistedDiagnosticJob {
  return {
    attempt: row.attempt,
    completedAt: row.completedAt?.toISOString() ?? null,
    correlationId: row.correlationId,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    leaseExpiresAt: row.leaseExpiresAt,
    message: row.message,
    result: row.result,
    status: row.status as JobStatus,
    updatedAt: row.updatedAt.toISOString(),
    workerId: row.workerId,
  };
}

function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export interface PgliteDatabaseOptions {
  readonly dataDirectory?: string;
}

export async function createPgliteDatabase(
  options: PgliteDatabaseOptions = {},
): Promise<HymuiDatabase> {
  const client = options.dataDirectory ? new PGlite(options.dataDirectory) : new PGlite();
  await client.waitReady;
  const database = drizzle(client);

  async function ensureMigrationTable(): Promise<void> {
    await client.exec(`CREATE TABLE IF NOT EXISTS hymui_schema_migrations (
      id text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL
    )`);
  }

  async function migrationStatus(): Promise<readonly AppliedMigration[]> {
    await ensureMigrationTable();
    const result = await client.query<{
      applied_at: Date | string;
      checksum: string;
      id: string;
      name: string;
    }>("SELECT id, name, checksum, applied_at FROM hymui_schema_migrations ORDER BY id");
    return result.rows.map((row) => ({
      appliedAt: row.applied_at instanceof Date ? row.applied_at : new Date(row.applied_at),
      checksum: row.checksum,
      id: row.id,
      name: row.name,
      statements: [],
    }));
  }

  const migrations = {
    async apply(pending: readonly Migration[]): Promise<readonly AppliedMigration[]> {
      const applied = await migrationStatus();
      const appliedById = new Map(applied.map((migration) => [migration.id, migration]));
      for (const migration of pending) {
        const existing = appliedById.get(migration.id);
        if (existing && existing.checksum !== migration.checksum) {
          throw new PersistenceError(
            "MIGRATION_CONFLICT",
            `Migration ${migration.id} has a different checksum.`,
          );
        }
        if (existing) continue;

        await client.exec("BEGIN");
        try {
          for (const statement of migration.statements) await client.exec(statement);
          await client.query(
            "INSERT INTO hymui_schema_migrations (id, name, checksum, applied_at) VALUES ($1, $2, $3, $4)",
            [migration.id, migration.name, migration.checksum, new Date().toISOString()],
          );
          await client.exec("COMMIT");
        } catch (error) {
          await client.exec("ROLLBACK");
          throw new PersistenceError(
            "DATABASE_UNAVAILABLE",
            error instanceof Error ? error.message : "Migration failed.",
          );
        }
      }
      return migrationStatus();
    },
    status: migrationStatus,
  };

  await migrations.apply(hymuiMigrations);

  const projectRepository: ProjectRepository = {
    async create(input: CreateProjectInput): Promise<Project> {
      const [created] = await database
        .insert(projects)
        .values({
          archived: false,
          createdAt: input.timestamp,
          description: input.description ?? "",
          id: input.id,
          linksJson: JSON.stringify(input.links ?? []),
          name: input.name,
          ownerId: input.ownerId,
          revision: 1,
          updatedAt: input.timestamp,
        })
        .returning();
      if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Project was not created.");
      return projectRecord(created);
    },
    async delete(id: string, actorId: string, revision: number): Promise<Project | null> {
      const [deleted] = await database
        .delete(projects)
        .where(
          and(
            eq(projects.id, id),
            eq(projects.ownerId, actorId),
            eq(projects.archived, true),
            eq(projects.revision, revision),
          ),
        )
        .returning();
      return deleted ? projectRecord(deleted) : null;
    },
    async findById(id: string, actorId: string): Promise<Project | null> {
      const [project] = await database
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.ownerId, actorId)))
        .limit(1);
      return project ? projectRecord(project) : null;
    },
    async listByActor(actorId: string): Promise<readonly Project[]> {
      const records = await database
        .select()
        .from(projects)
        .where(eq(projects.ownerId, actorId))
        .orderBy(asc(projects.createdAt));
      return records.map(projectRecord);
    },
    async update(input: UpdateProjectInput): Promise<Project | null> {
      const [existing] = await database
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.ownerId, input.ownerId)))
        .limit(1);
      if (!existing) return null;
      if (existing.revision !== input.revision) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed after it was loaded.",
        );
      }
      const [updated] = await database
        .update(projects)
        .set({
          archived: input.archived ?? existing.archived,
          description: input.description ?? existing.description,
          linksJson: input.links === undefined ? existing.linksJson : JSON.stringify(input.links),
          name: input.name ?? existing.name,
          revision: existing.revision + 1,
          updatedAt: input.timestamp,
        })
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.ownerId, input.ownerId),
            eq(projects.revision, input.revision),
          ),
        )
        .returning();
      if (!updated) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed while it was being saved.",
        );
      }
      return projectRecord(updated);
    },
  };

  const projectAttachmentRepository: ProjectAttachmentRepository = {
    async create(input: CreateProjectAttachmentInput): Promise<ProjectAttachmentRecord | null> {
      const [project] = await database
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.ownerId, input.ownerId)))
        .limit(1);
      if (!project) return null;
      const [created] = await database
        .insert(projectAttachments)
        .values({
          byteLength: input.byteLength,
          checksum: input.checksum,
          contentType: input.contentType,
          createdAt: input.timestamp,
          fileName: input.fileName,
          id: input.id,
          objectKey: input.objectKey,
          projectId: input.projectId,
        })
        .returning();
      if (!created) {
        throw new PersistenceError("DATABASE_UNAVAILABLE", "Attachment was not created.");
      }
      return projectAttachmentRecord(created);
    },
    async delete(id: string, actorId: string): Promise<ProjectAttachmentRecord | null> {
      const existing = await this.findById(id, actorId);
      if (!existing) return null;
      const [deleted] = await database
        .delete(projectAttachments)
        .where(eq(projectAttachments.id, id))
        .returning();
      return deleted ? projectAttachmentRecord(deleted) : null;
    },
    async findById(id: string, actorId: string): Promise<ProjectAttachmentRecord | null> {
      const [record] = await database
        .select({ attachment: projectAttachments })
        .from(projectAttachments)
        .innerJoin(projects, eq(projectAttachments.projectId, projects.id))
        .where(and(eq(projectAttachments.id, id), eq(projects.ownerId, actorId)))
        .limit(1);
      return record ? projectAttachmentRecord(record.attachment) : null;
    },
    async listByProject(
      projectId: string,
      actorId: string,
    ): Promise<readonly ProjectAttachmentRecord[]> {
      const records = await database
        .select({ attachment: projectAttachments })
        .from(projectAttachments)
        .innerJoin(projects, eq(projectAttachments.projectId, projects.id))
        .where(and(eq(projectAttachments.projectId, projectId), eq(projects.ownerId, actorId)))
        .orderBy(asc(projectAttachments.createdAt));
      return records.map((record) => projectAttachmentRecord(record.attachment));
    },
  };

  return {
    accounts: {
      async count(): Promise<number> {
        const result = await database.select({ id: actors.id }).from(actors);
        return result.length;
      },
      async create(input: CreateAccountInput): Promise<AccountRecord> {
        try {
          const [created] = await database
            .insert(actors)
            .values({
              createdAt: input.timestamp,
              displayName: input.displayName,
              id: input.id,
              passwordHash: input.passwordHash,
              username: input.username.toLowerCase(),
            })
            .returning();
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
      async findById(id: string): Promise<AccountRecord | null> {
        const [actor] = await database.select().from(actors).where(eq(actors.id, id)).limit(1);
        return actor ? actorRecord(actor) : null;
      },
      async findByUsername(username: string): Promise<AccountRecord | null> {
        const [actor] = await database
          .select()
          .from(actors)
          .where(eq(actors.username, username.toLowerCase()))
          .limit(1);
        return actor ? actorRecord(actor) : null;
      },
    },
    attachments: projectAttachmentRepository,
    async close(): Promise<void> {
      await client.close();
    },
    diagnosticJobs: {
      async cancel(id: string, timestamp: Date): Promise<PersistedDiagnosticJob | null> {
        const [existing] = await database
          .select()
          .from(diagnosticJobs)
          .where(eq(diagnosticJobs.id, id))
          .limit(1);
        if (!existing) return null;
        if (
          existing.status === "completed" ||
          existing.status === "failed" ||
          existing.status === "cancelled"
        ) {
          return diagnosticJobRecord(existing);
        }
        const [cancelled] = await database
          .update(diagnosticJobs)
          .set({
            claimTokenHash: null,
            completedAt: timestamp,
            leaseExpiresAt: null,
            status: "cancelled",
            updatedAt: timestamp,
            workerId: null,
          })
          .where(eq(diagnosticJobs.id, id))
          .returning();
        if (existing.status === "running") {
          await database
            .update(diagnosticJobAttempts)
            .set({ completedAt: timestamp, status: "cancelled" })
            .where(
              and(
                eq(diagnosticJobAttempts.jobId, id),
                eq(diagnosticJobAttempts.attempt, existing.attempt),
              ),
            );
        }
        return cancelled ? diagnosticJobRecord(cancelled) : null;
      },
      async claimNext(input: ClaimDiagnosticJobInput): Promise<PersistedDiagnosticJob | null> {
        await client.exec("BEGIN");
        try {
          const claimed = await client.query<{ attempt: number; id: string }>(
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
              input.leaseExpiresAt.toISOString(),
            ],
          );
          const record = claimed.rows[0];
          if (!record) {
            await client.exec("COMMIT");
            return null;
          }
          if (record.attempt > 1) {
            await database
              .update(diagnosticJobAttempts)
              .set({
                completedAt: input.timestamp,
                error: "Worker lease expired before completion.",
                status: "expired",
              })
              .where(
                and(
                  eq(diagnosticJobAttempts.jobId, record.id),
                  eq(diagnosticJobAttempts.attempt, record.attempt - 1),
                  eq(diagnosticJobAttempts.status, "running"),
                ),
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
            workerId: input.workerId,
          });
          await client.exec("COMMIT");
          const [job] = await database
            .select()
            .from(diagnosticJobs)
            .where(eq(diagnosticJobs.id, record.id))
            .limit(1);
          return job ? diagnosticJobRecord(job) : null;
        } catch (error) {
          await client.exec("ROLLBACK");
          throw error;
        }
      },
      async complete(input: CompleteDiagnosticJobInput): Promise<PersistedDiagnosticJob | null> {
        const [completed] = await database
          .update(diagnosticJobs)
          .set({
            claimTokenHash: null,
            completedAt: input.timestamp,
            leaseExpiresAt: null,
            result: input.result,
            status: "completed",
            updatedAt: input.timestamp,
            workerId: null,
          })
          .where(
            and(
              eq(diagnosticJobs.id, input.id),
              eq(diagnosticJobs.status, "running"),
              eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash),
            ),
          )
          .returning();
        if (!completed) return null;
        await database
          .update(diagnosticJobAttempts)
          .set({ completedAt: input.timestamp, status: "completed" })
          .where(
            and(
              eq(diagnosticJobAttempts.jobId, input.id),
              eq(diagnosticJobAttempts.attempt, completed.attempt),
            ),
          );
        return diagnosticJobRecord(completed);
      },
      async create(input: CreateDiagnosticJobInput): Promise<PersistedDiagnosticJob> {
        const [created] = await database
          .insert(diagnosticJobs)
          .values({
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
            workerId: null,
          })
          .returning();
        if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Job was not created.");
        return diagnosticJobRecord(created);
      },
      async fail(input: FailDiagnosticJobInput): Promise<PersistedDiagnosticJob | null> {
        const [failed] = await database
          .update(diagnosticJobs)
          .set({
            claimTokenHash: null,
            completedAt: input.timestamp,
            lastError: input.error,
            leaseExpiresAt: null,
            result: null,
            status: "failed",
            updatedAt: input.timestamp,
            workerId: null,
          })
          .where(
            and(
              eq(diagnosticJobs.id, input.id),
              eq(diagnosticJobs.status, "running"),
              eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash),
            ),
          )
          .returning();
        if (!failed) return null;
        await database
          .update(diagnosticJobAttempts)
          .set({ completedAt: input.timestamp, error: input.error, status: "failed" })
          .where(
            and(
              eq(diagnosticJobAttempts.jobId, input.id),
              eq(diagnosticJobAttempts.attempt, failed.attempt),
            ),
          );
        return diagnosticJobRecord(failed);
      },
      async get(id: string): Promise<PersistedDiagnosticJob | null> {
        const [job] = await database
          .select()
          .from(diagnosticJobs)
          .where(eq(diagnosticJobs.id, id))
          .limit(1);
        return job ? diagnosticJobRecord(job) : null;
      },
      async heartbeat(input: HeartbeatDiagnosticJobInput): Promise<PersistedDiagnosticJob | null> {
        const [heartbeat] = await database
          .update(diagnosticJobs)
          .set({
            leaseExpiresAt: input.leaseExpiresAt,
            updatedAt: input.timestamp,
          })
          .where(
            and(
              eq(diagnosticJobs.id, input.id),
              eq(diagnosticJobs.status, "running"),
              eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash),
            ),
          )
          .returning();
        if (!heartbeat) return null;
        await database
          .update(diagnosticJobAttempts)
          .set({ heartbeatAt: input.timestamp })
          .where(
            and(
              eq(diagnosticJobAttempts.jobId, input.id),
              eq(diagnosticJobAttempts.attempt, heartbeat.attempt),
            ),
          );
        return diagnosticJobRecord(heartbeat);
      },
    },
    kind: "pglite",
    migrations,
    projects: projectRepository,
    sessions: {
      async create(input: CreateSessionInput): Promise<SessionRecord> {
        const [created] = await database
          .insert(sessions)
          .values({
            actorId: input.actorId,
            createdAt: input.timestamp,
            expiresAt: input.expiresAt,
            id: input.id,
            tokenHash: input.tokenHash,
          })
          .returning();
        if (!created)
          throw new PersistenceError("DATABASE_UNAVAILABLE", "Session was not created.");
        return sessionRecord(created);
      },
      async deleteByTokenHash(tokenHash: string): Promise<void> {
        await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
      },
      async deleteExpired(timestamp: Date): Promise<number> {
        const deleted = await database
          .delete(sessions)
          .where(lt(sessions.expiresAt, timestamp))
          .returning({ id: sessions.id });
        return deleted.length;
      },
      async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
        const [session] = await database
          .select()
          .from(sessions)
          .where(eq(sessions.tokenHash, tokenHash))
          .limit(1);
        return session ? sessionRecord(session) : null;
      },
    },
  };
}
