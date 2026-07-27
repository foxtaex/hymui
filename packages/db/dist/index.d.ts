import { Actor, DiagnosticJobRequest, CreateProjectRequest, DiagnosticJob, Project, UpdateProjectRequest } from '@hymui/contracts';

declare const hymuiMigrations: readonly Migration[];
interface PgliteDatabaseOptions {
    readonly dataDirectory?: string;
}
declare function createPgliteDatabase(options?: PgliteDatabaseOptions): Promise<HymuiDatabase>;

type DatabaseAdapterKind = "pglite" | "postgresql" | "mysql" | "mariadb" | "mssql";
interface Migration {
    readonly checksum: string;
    readonly id: string;
    readonly name: string;
    readonly statements: readonly string[];
}
interface AppliedMigration extends Migration {
    readonly appliedAt: Date;
}
interface MigrationRunner {
    apply(migrations: readonly Migration[]): Promise<readonly AppliedMigration[]>;
    status(): Promise<readonly AppliedMigration[]>;
}
interface CreateDiagnosticJobInput {
    readonly correlationId: string;
    readonly id: string;
    readonly request: DiagnosticJobRequest;
    readonly timestamp: Date;
}
interface PersistedDiagnosticJob extends DiagnosticJob {
    readonly attempt: number;
    readonly leaseExpiresAt: Date | null;
    readonly workerId: string | null;
}
interface ClaimDiagnosticJobInput {
    readonly leaseExpiresAt: Date;
    readonly leaseTokenHash: string;
    readonly timestamp: Date;
    readonly workerId: string;
}
interface HeartbeatDiagnosticJobInput {
    readonly id: string;
    readonly leaseExpiresAt: Date;
    readonly leaseTokenHash: string;
    readonly timestamp: Date;
}
interface CompleteDiagnosticJobInput {
    readonly id: string;
    readonly leaseTokenHash: string;
    readonly result: string;
    readonly timestamp: Date;
}
interface FailDiagnosticJobInput {
    readonly error: string;
    readonly id: string;
    readonly leaseTokenHash: string;
    readonly timestamp: Date;
}
interface DiagnosticJobRepository {
    cancel(id: string, timestamp: Date): Promise<PersistedDiagnosticJob | null>;
    claimNext(input: ClaimDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
    complete(input: CompleteDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
    create(input: CreateDiagnosticJobInput): Promise<PersistedDiagnosticJob>;
    fail(input: FailDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
    get(id: string): Promise<PersistedDiagnosticJob | null>;
    heartbeat(input: HeartbeatDiagnosticJobInput): Promise<PersistedDiagnosticJob | null>;
}
interface AccountRecord extends Actor {
    readonly passwordHash: string | null;
}
interface CreateAccountInput {
    readonly displayName: string;
    readonly id: string;
    readonly passwordHash: string | null;
    readonly timestamp: Date;
    readonly username: string;
}
interface AccountRepository {
    count(): Promise<number>;
    create(input: CreateAccountInput): Promise<AccountRecord>;
    findById(id: string): Promise<AccountRecord | null>;
    findByUsername(username: string): Promise<AccountRecord | null>;
}
interface SessionRecord {
    readonly actorId: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    readonly id: string;
    readonly tokenHash: string;
}
interface CreateSessionInput {
    readonly actorId: string;
    readonly expiresAt: Date;
    readonly id: string;
    readonly timestamp: Date;
    readonly tokenHash: string;
}
interface SessionRepository {
    create(input: CreateSessionInput): Promise<SessionRecord>;
    deleteByTokenHash(tokenHash: string): Promise<void>;
    deleteExpired(timestamp: Date): Promise<number>;
    findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
}
interface CreateProjectInput extends CreateProjectRequest {
    readonly id: string;
    readonly ownerId: string;
    readonly timestamp: Date;
}
interface UpdateProjectInput extends UpdateProjectRequest {
    readonly id: string;
    readonly ownerId: string;
    readonly timestamp: Date;
}
interface ProjectRepository {
    create(input: CreateProjectInput): Promise<Project>;
    findById(id: string, actorId: string): Promise<Project | null>;
    listByActor(actorId: string): Promise<readonly Project[]>;
    update(input: UpdateProjectInput): Promise<Project | null>;
}
interface HymuiDatabase {
    readonly accounts: AccountRepository;
    readonly kind: DatabaseAdapterKind;
    readonly migrations: MigrationRunner;
    readonly diagnosticJobs: DiagnosticJobRepository;
    readonly projects: ProjectRepository;
    readonly sessions: SessionRepository;
    close(): Promise<void>;
}
declare class PersistenceError extends Error {
    readonly code: "DATABASE_UNAVAILABLE" | "MIGRATION_CONFLICT" | "MIGRATION_OUT_OF_ORDER" | "PERSISTENCE_DUPLICATE" | "PERSISTENCE_CONFLICT";
    constructor(code: "DATABASE_UNAVAILABLE" | "MIGRATION_CONFLICT" | "MIGRATION_OUT_OF_ORDER" | "PERSISTENCE_DUPLICATE" | "PERSISTENCE_CONFLICT", message: string);
}

export { type AccountRecord, type AccountRepository, type AppliedMigration, type ClaimDiagnosticJobInput, type CompleteDiagnosticJobInput, type CreateAccountInput, type CreateDiagnosticJobInput, type CreateProjectInput, type CreateSessionInput, type DatabaseAdapterKind, type DiagnosticJobRepository, type FailDiagnosticJobInput, type HeartbeatDiagnosticJobInput, type HymuiDatabase, type Migration, type MigrationRunner, type PersistedDiagnosticJob, PersistenceError, type ProjectRepository, type SessionRecord, type SessionRepository, type UpdateProjectInput, createPgliteDatabase, hymuiMigrations };
