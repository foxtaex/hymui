import { Type, type Static } from "@sinclair/typebox";

export const ApiVersion = "v1" as const;
export const HymuiVersion = "6.0.0-dev.0" as const;

const UuidSchema = Type.String({
  pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
});
const DateTimeSchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z",
});

export const EditionSchema = Type.Union([
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted"),
]);
export type Edition = Static<typeof EditionSchema>;

export const RuntimeModeSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("test"),
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted"),
]);
export type RuntimeMode = Static<typeof RuntimeModeSchema>;

export const ServiceStateSchema = Type.Union([
  Type.Literal("ready"),
  Type.Literal("degraded"),
  Type.Literal("unavailable"),
]);
export type ServiceState = Static<typeof ServiceStateSchema>;

export const HealthResponseSchema = Type.Object(
  {
    apiVersion: Type.Literal(ApiVersion),
    correlationId: UuidSchema,
    edition: EditionSchema,
    mode: RuntimeModeSchema,
    service: Type.Literal("api"),
    state: ServiceStateSchema,
    timestamp: DateTimeSchema,
    version: Type.Literal(HymuiVersion),
    worker: ServiceStateSchema,
  },
  { additionalProperties: false },
);
export type HealthResponse = Static<typeof HealthResponseSchema>;

export const JobStatusSchema = Type.Union([
  Type.Literal("queued"),
  Type.Literal("running"),
  Type.Literal("completed"),
  Type.Literal("failed"),
  Type.Literal("cancelled"),
]);
export type JobStatus = Static<typeof JobStatusSchema>;

export const DiagnosticJobRequestSchema = Type.Object(
  {
    message: Type.String({ minLength: 1, maxLength: 160 }),
  },
  { additionalProperties: false },
);
export type DiagnosticJobRequest = Static<typeof DiagnosticJobRequestSchema>;

export const DiagnosticJobSchema = Type.Object(
  {
    completedAt: Type.Union([DateTimeSchema, Type.Null()]),
    correlationId: UuidSchema,
    createdAt: DateTimeSchema,
    id: UuidSchema,
    message: Type.String(),
    result: Type.Union([Type.String(), Type.Null()]),
    status: JobStatusSchema,
    updatedAt: DateTimeSchema,
  },
  { additionalProperties: false },
);
export type DiagnosticJob = Static<typeof DiagnosticJobSchema>;

export const WorkerClaimRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    workerId: UuidSchema,
  },
  { additionalProperties: false },
);
export type WorkerClaimRequest = Static<typeof WorkerClaimRequestSchema>;

export const DiagnosticJobClaimSchema = Type.Object(
  {
    attempt: Type.Integer({ minimum: 1 }),
    job: DiagnosticJobSchema,
    leaseExpiresAt: DateTimeSchema,
    leaseToken: Type.String({ minLength: 32 }),
  },
  { additionalProperties: false },
);
export type DiagnosticJobClaim = Static<typeof DiagnosticJobClaimSchema>;

export const WorkerHeartbeatRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    leaseToken: Type.String({ minLength: 32 }),
  },
  { additionalProperties: false },
);
export type WorkerHeartbeatRequest = Static<typeof WorkerHeartbeatRequestSchema>;

export const WorkerCompleteRequestSchema = Type.Object(
  {
    leaseToken: Type.String({ minLength: 32 }),
    result: Type.String({ maxLength: 2_000, minLength: 1 }),
  },
  { additionalProperties: false },
);
export type WorkerCompleteRequest = Static<typeof WorkerCompleteRequestSchema>;

export const WorkerFailRequestSchema = Type.Object(
  {
    error: Type.String({ maxLength: 2_000, minLength: 1 }),
    leaseToken: Type.String({ minLength: 32 }),
  },
  { additionalProperties: false },
);
export type WorkerFailRequest = Static<typeof WorkerFailRequestSchema>;

export const ErrorResponseSchema = Type.Object(
  {
    code: Type.String({ pattern: "^[A-Z0-9_]+$" }),
    correlationId: UuidSchema,
    message: Type.String(),
  },
  { additionalProperties: false },
);
export type ErrorResponse = Static<typeof ErrorResponseSchema>;

export const CorrelationIdHeader = "x-hymui-correlation-id" as const;

export const UsernameSchema = Type.String({
  maxLength: 32,
  minLength: 3,
  pattern: "^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$",
});

export const ActorSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    id: UuidSchema,
    username: UsernameSchema,
  },
  { additionalProperties: false },
);
export type Actor = Static<typeof ActorSchema>;

export const AuthSessionSchema = Type.Object(
  {
    actor: ActorSchema,
    expiresAt: DateTimeSchema,
  },
  { additionalProperties: false },
);
export type AuthSession = Static<typeof AuthSessionSchema>;

export const AuthCapabilitiesSchema = Type.Object(
  {
    edition: EditionSchema,
    localProfileAvailable: Type.Boolean(),
    registrationOpen: Type.Boolean(),
  },
  { additionalProperties: false },
);
export type AuthCapabilities = Static<typeof AuthCapabilitiesSchema>;

export const RegisterRequestSchema = Type.Object(
  {
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    password: Type.String({ maxLength: 256, minLength: 12 }),
    username: UsernameSchema,
  },
  { additionalProperties: false },
);
export type RegisterRequest = Static<typeof RegisterRequestSchema>;

export const LoginRequestSchema = Type.Object(
  {
    password: Type.String({ maxLength: 256, minLength: 1 }),
    username: UsernameSchema,
  },
  { additionalProperties: false },
);
export type LoginRequest = Static<typeof LoginRequestSchema>;

export const ProjectLinkSchema = Type.Object(
  {
    kind: Type.Union([Type.Literal("repository"), Type.Literal("external")]),
    label: Type.String({ maxLength: 80, minLength: 1 }),
    url: Type.String({ maxLength: 2_048, pattern: "^https?://\\S+$" }),
  },
  { additionalProperties: false },
);
export type ProjectLink = Static<typeof ProjectLinkSchema>;

export const ProjectSchema = Type.Object(
  {
    archived: Type.Boolean(),
    createdAt: DateTimeSchema,
    description: Type.String({ maxLength: 2_000 }),
    id: UuidSchema,
    links: Type.Array(ProjectLinkSchema, { maxItems: 20 }),
    name: Type.String({ maxLength: 120, minLength: 1 }),
    ownerId: UuidSchema,
    revision: Type.Integer({ minimum: 1 }),
    updatedAt: DateTimeSchema,
  },
  { additionalProperties: false },
);
export type Project = Static<typeof ProjectSchema>;

export const ProjectListSchema = Type.Object(
  {
    projects: Type.Array(ProjectSchema),
  },
  { additionalProperties: false },
);
export type ProjectList = Static<typeof ProjectListSchema>;

export const CreateProjectRequestSchema = Type.Object(
  {
    description: Type.Optional(Type.String({ maxLength: 2_000 })),
    links: Type.Optional(Type.Array(ProjectLinkSchema, { maxItems: 20 })),
    name: Type.String({ maxLength: 120, minLength: 1 }),
  },
  { additionalProperties: false },
);
export type CreateProjectRequest = Static<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(Type.String({ maxLength: 2_000 })),
    links: Type.Optional(Type.Array(ProjectLinkSchema, { maxItems: 20 })),
    name: Type.Optional(Type.String({ maxLength: 120, minLength: 1 })),
    revision: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);
export type UpdateProjectRequest = Static<typeof UpdateProjectRequestSchema>;
