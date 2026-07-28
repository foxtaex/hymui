// src/index.ts
import { Type } from "@sinclair/typebox";
var ApiVersion = "v1";
var HymuiVersion = "6.0.0-dev.0";
var UuidSchema = Type.String({
  pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
});
var DateTimeSchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z"
});
var EditionSchema = Type.Union([
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted")
]);
var RuntimeModeSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("test"),
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted")
]);
var ServiceStateSchema = Type.Union([
  Type.Literal("ready"),
  Type.Literal("degraded"),
  Type.Literal("unavailable")
]);
var HealthResponseSchema = Type.Object(
  {
    apiVersion: Type.Literal(ApiVersion),
    correlationId: UuidSchema,
    edition: EditionSchema,
    mode: RuntimeModeSchema,
    service: Type.Literal("api"),
    state: ServiceStateSchema,
    timestamp: DateTimeSchema,
    version: Type.Literal(HymuiVersion),
    worker: ServiceStateSchema
  },
  { additionalProperties: false }
);
var JobStatusSchema = Type.Union([
  Type.Literal("queued"),
  Type.Literal("running"),
  Type.Literal("completed"),
  Type.Literal("failed"),
  Type.Literal("cancelled")
]);
var DiagnosticJobRequestSchema = Type.Object(
  {
    message: Type.String({ minLength: 1, maxLength: 160 })
  },
  { additionalProperties: false }
);
var DiagnosticJobSchema = Type.Object(
  {
    completedAt: Type.Union([DateTimeSchema, Type.Null()]),
    correlationId: UuidSchema,
    createdAt: DateTimeSchema,
    id: UuidSchema,
    message: Type.String(),
    result: Type.Union([Type.String(), Type.Null()]),
    status: JobStatusSchema,
    updatedAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var WorkerClaimRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    workerId: UuidSchema
  },
  { additionalProperties: false }
);
var DiagnosticJobClaimSchema = Type.Object(
  {
    attempt: Type.Integer({ minimum: 1 }),
    job: DiagnosticJobSchema,
    leaseExpiresAt: DateTimeSchema,
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var WorkerHeartbeatRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var WorkerCompleteRequestSchema = Type.Object(
  {
    leaseToken: Type.String({ minLength: 32 }),
    result: Type.String({ maxLength: 2e3, minLength: 1 })
  },
  { additionalProperties: false }
);
var WorkerFailRequestSchema = Type.Object(
  {
    error: Type.String({ maxLength: 2e3, minLength: 1 }),
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var ErrorResponseSchema = Type.Object(
  {
    code: Type.String({ pattern: "^[A-Z0-9_]+$" }),
    correlationId: UuidSchema,
    message: Type.String()
  },
  { additionalProperties: false }
);
var CorrelationIdHeader = "x-hymui-correlation-id";
var UsernameSchema = Type.String({
  maxLength: 32,
  minLength: 3,
  pattern: "^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$"
});
var ActorSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    id: UuidSchema,
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var AuthSessionSchema = Type.Object(
  {
    actor: ActorSchema,
    expiresAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var AuthCapabilitiesSchema = Type.Object(
  {
    edition: EditionSchema,
    localProfileAvailable: Type.Boolean(),
    registrationOpen: Type.Boolean()
  },
  { additionalProperties: false }
);
var RegisterRequestSchema = Type.Object(
  {
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    password: Type.String({ maxLength: 256, minLength: 12 }),
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var LoginRequestSchema = Type.Object(
  {
    password: Type.String({ maxLength: 256, minLength: 1 }),
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var ProjectLinkSchema = Type.Object(
  {
    kind: Type.Union([Type.Literal("repository"), Type.Literal("external")]),
    label: Type.String({ maxLength: 80, minLength: 1 }),
    url: Type.String({ maxLength: 2048, pattern: "^https?://\\S+$" })
  },
  { additionalProperties: false }
);
var ProjectSchema = Type.Object(
  {
    archived: Type.Boolean(),
    createdAt: DateTimeSchema,
    description: Type.String({ maxLength: 2e3 }),
    id: UuidSchema,
    links: Type.Array(ProjectLinkSchema, { maxItems: 20 }),
    name: Type.String({ maxLength: 120, minLength: 1 }),
    ownerId: UuidSchema,
    revision: Type.Integer({ minimum: 1 }),
    updatedAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var ProjectListSchema = Type.Object(
  {
    projects: Type.Array(ProjectSchema)
  },
  { additionalProperties: false }
);
var CreateProjectRequestSchema = Type.Object(
  {
    description: Type.Optional(Type.String({ maxLength: 2e3 })),
    links: Type.Optional(Type.Array(ProjectLinkSchema, { maxItems: 20 })),
    name: Type.String({ maxLength: 120, minLength: 1 })
  },
  { additionalProperties: false }
);
var UpdateProjectRequestSchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(Type.String({ maxLength: 2e3 })),
    links: Type.Optional(Type.Array(ProjectLinkSchema, { maxItems: 20 })),
    name: Type.Optional(Type.String({ maxLength: 120, minLength: 1 })),
    revision: Type.Integer({ minimum: 1 })
  },
  { additionalProperties: false }
);
export {
  ActorSchema,
  ApiVersion,
  AuthCapabilitiesSchema,
  AuthSessionSchema,
  CorrelationIdHeader,
  CreateProjectRequestSchema,
  DiagnosticJobClaimSchema,
  DiagnosticJobRequestSchema,
  DiagnosticJobSchema,
  EditionSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  HymuiVersion,
  JobStatusSchema,
  LoginRequestSchema,
  ProjectLinkSchema,
  ProjectListSchema,
  ProjectSchema,
  RegisterRequestSchema,
  RuntimeModeSchema,
  ServiceStateSchema,
  UpdateProjectRequestSchema,
  UsernameSchema,
  WorkerClaimRequestSchema,
  WorkerCompleteRequestSchema,
  WorkerFailRequestSchema,
  WorkerHeartbeatRequestSchema
};
