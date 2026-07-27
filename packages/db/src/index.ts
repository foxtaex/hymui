import type {
  Actor,
  CreateProjectRequest,
  DiagnosticJob,
  DiagnosticJobRequest,
  Project,
  UpdateProjectRequest,
} from "@hymui/contracts";

export type DatabaseAdapterKind = "pglite" | "postgresql" | "mysql" | "mariadb" | "mssql";

export interface Migration {
  readonly checksum: string;
  readonly id: string;
  readonly name: string;
  readonly statements: readonly string[];
}

export interface AppliedMigration extends Migration {
  readonly appliedAt: Date;
}

export interface MigrationRunner {
  apply(migrations: readonly Migration[]): Promise<readonly AppliedMigration[]>;
  status(): Promise<readonly AppliedMigration[]>;
}

export interface CreateDiagnosticJobInput {
  readonly correlationId: string;
  readonly id: string;
  readonly request: DiagnosticJobRequest;
  readonly timestamp: Date;
}

export interface PersistedDiagnosticJob extends DiagnosticJob {
  readonly attempt: number;
  readonly leaseExpiresAt: Date | null;
  readonly workerId: string | null;
}

export interface ClaimDiagnosticJobInput {
  readonly leaseExpiresAt: Date;
  readonly leaseTokenHash: string;
  readonly timestamp: Date;
  readonly workerId: string;
}

export interface HeartbeatDiagnosticJobInput {
  readonly id: string;
  readonly leaseExpiresAt: Date;
  readonly leaseTokenHash: string;
  readonly timestamp: Date;
}

export interface CompleteDiagnosticJobInput {
  readonly id: string;
  readonly leaseTokenHash: string;
  readonly result: string;
  readonly timestamp: Date;
}

export interface FailDiagnosticJobInput {
  readonly error: string;
  readonly id: string;
  readonly leaseTokenHash: string;
  readonly timestamp: Date;
}

export interface DiagnosticJobRepository {
  cancel(id: string, timestamp: Date): Promise<PersistedDiagnosticJob | null>;
  claimNext(input: ClaimDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
  complete(input: CompleteDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
  create(input: CreateDiagnosticJobInput): Promise<PersistedDiagnosticJob>;
  fail(input: FailDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
  get(id: string): Promise<PersistedDiagnosticJob | null>;
  heartbeat(input: HeartbeatDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
}

export interface AccountRecord extends Actor {
  readonly passwordHash: string | null;
}

export interface CreateAccountInput {
  readonly displayName: string;
  readonly id: string;
  readonly passwordHash: string | null;
  readonly timestamp: Date;
  readonly username: string;
}

export interface AccountRepository {
  count(): Promise<number>;
  create(input: CreateAccountInput): Promise<AccountRecord>;
  findById(id: string): Promise<AccountRecord | null>;
  findByUsername(username: string): Promise<AccountRecord | null>;
}

export interface SessionRecord {
  readonly actorId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly id: string;
  readonly tokenHash: string;
}

export interface CreateSessionInput {
  readonly actorId: string;
  readonly expiresAt: Date;
  readonly id: string;
  readonly timestamp: Date;
  readonly tokenHash: string;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteExpired(timestamp: Date): Promise<number>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
}

export interface CreateProjectInput extends CreateProjectRequest {
  readonly id: string;
  readonly ownerId: string;
  readonly timestamp: Date;
}

export interface UpdateProjectInput extends UpdateProjectRequest {
  readonly id: string;
  readonly ownerId: string;
  readonly timestamp: Date;
}

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string, actorId: string): Promise<Project | null>;
  listByActor(actorId: string): Promise<readonly Project[]>;
  update(input: UpdateProjectInput): Promise<Project | null>;
}

export interface HymuiDatabase {
  readonly accounts: AccountRepository;
  readonly kind: DatabaseAdapterKind;
  readonly migrations: MigrationRunner;
  readonly diagnosticJobs: DiagnosticJobRepository;
  readonly projects: ProjectRepository;
  readonly sessions: SessionRepository;
  close(): Promise<void>;
}

export class PersistenceError extends Error {
  public constructor(
    public readonly code:
      | "DATABASE_UNAVAILABLE"
      | "MIGRATION_CONFLICT"
      | "MIGRATION_OUT_OF_ORDER"
      | "PERSISTENCE_DUPLICATE"
      | "PERSISTENCE_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}

export { createPgliteDatabase, hymuiMigrations } from "./pglite.js";
