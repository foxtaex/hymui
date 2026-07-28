import * as _sinclair_typebox from '@sinclair/typebox';
import { Static } from '@sinclair/typebox';

declare const ApiVersion: "v1";
declare const HymuiVersion: "6.0.0-dev.0";
declare const EditionSchema: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"local">, _sinclair_typebox.TLiteral<"self-hosted">, _sinclair_typebox.TLiteral<"hosted">]>;
type Edition = Static<typeof EditionSchema>;
declare const RuntimeModeSchema: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"development">, _sinclair_typebox.TLiteral<"test">, _sinclair_typebox.TLiteral<"local">, _sinclair_typebox.TLiteral<"self-hosted">, _sinclair_typebox.TLiteral<"hosted">]>;
type RuntimeMode = Static<typeof RuntimeModeSchema>;
declare const ServiceStateSchema: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"ready">, _sinclair_typebox.TLiteral<"degraded">, _sinclair_typebox.TLiteral<"unavailable">]>;
type ServiceState = Static<typeof ServiceStateSchema>;
declare const StorageAdapterKindSchema: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"filesystem">, _sinclair_typebox.TLiteral<"gcs">, _sinclair_typebox.TLiteral<"s3">]>;
type StorageAdapterKind = Static<typeof StorageAdapterKindSchema>;
declare const StorageHealthSchema: _sinclair_typebox.TObject<{
    kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"filesystem">, _sinclair_typebox.TLiteral<"gcs">, _sinclair_typebox.TLiteral<"s3">]>;
    state: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"ready">, _sinclair_typebox.TLiteral<"degraded">, _sinclair_typebox.TLiteral<"unavailable">]>;
}>;
type StorageHealth = Static<typeof StorageHealthSchema>;
declare const HealthResponseSchema: _sinclair_typebox.TObject<{
    apiVersion: _sinclair_typebox.TLiteral<"v1">;
    correlationId: _sinclair_typebox.TString;
    edition: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"local">, _sinclair_typebox.TLiteral<"self-hosted">, _sinclair_typebox.TLiteral<"hosted">]>;
    mode: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"development">, _sinclair_typebox.TLiteral<"test">, _sinclair_typebox.TLiteral<"local">, _sinclair_typebox.TLiteral<"self-hosted">, _sinclair_typebox.TLiteral<"hosted">]>;
    service: _sinclair_typebox.TLiteral<"api">;
    state: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"ready">, _sinclair_typebox.TLiteral<"degraded">, _sinclair_typebox.TLiteral<"unavailable">]>;
    storage: _sinclair_typebox.TObject<{
        kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"filesystem">, _sinclair_typebox.TLiteral<"gcs">, _sinclair_typebox.TLiteral<"s3">]>;
        state: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"ready">, _sinclair_typebox.TLiteral<"degraded">, _sinclair_typebox.TLiteral<"unavailable">]>;
    }>;
    timestamp: _sinclair_typebox.TString;
    version: _sinclair_typebox.TLiteral<"6.0.0-dev.0">;
    worker: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"ready">, _sinclair_typebox.TLiteral<"degraded">, _sinclair_typebox.TLiteral<"unavailable">]>;
}>;
type HealthResponse = Static<typeof HealthResponseSchema>;
declare const JobStatusSchema: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"queued">, _sinclair_typebox.TLiteral<"running">, _sinclair_typebox.TLiteral<"completed">, _sinclair_typebox.TLiteral<"failed">, _sinclair_typebox.TLiteral<"cancelled">]>;
type JobStatus = Static<typeof JobStatusSchema>;
declare const DiagnosticJobRequestSchema: _sinclair_typebox.TObject<{
    message: _sinclair_typebox.TString;
}>;
type DiagnosticJobRequest = Static<typeof DiagnosticJobRequestSchema>;
declare const DiagnosticJobSchema: _sinclair_typebox.TObject<{
    completedAt: _sinclair_typebox.TUnion<[_sinclair_typebox.TString, _sinclair_typebox.TNull]>;
    correlationId: _sinclair_typebox.TString;
    createdAt: _sinclair_typebox.TString;
    id: _sinclair_typebox.TString;
    message: _sinclair_typebox.TString;
    result: _sinclair_typebox.TUnion<[_sinclair_typebox.TString, _sinclair_typebox.TNull]>;
    status: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"queued">, _sinclair_typebox.TLiteral<"running">, _sinclair_typebox.TLiteral<"completed">, _sinclair_typebox.TLiteral<"failed">, _sinclair_typebox.TLiteral<"cancelled">]>;
    updatedAt: _sinclair_typebox.TString;
}>;
type DiagnosticJob = Static<typeof DiagnosticJobSchema>;
declare const WorkerClaimRequestSchema: _sinclair_typebox.TObject<{
    leaseSeconds: _sinclair_typebox.TInteger;
    workerId: _sinclair_typebox.TString;
}>;
type WorkerClaimRequest = Static<typeof WorkerClaimRequestSchema>;
declare const DiagnosticJobClaimSchema: _sinclair_typebox.TObject<{
    attempt: _sinclair_typebox.TInteger;
    job: _sinclair_typebox.TObject<{
        completedAt: _sinclair_typebox.TUnion<[_sinclair_typebox.TString, _sinclair_typebox.TNull]>;
        correlationId: _sinclair_typebox.TString;
        createdAt: _sinclair_typebox.TString;
        id: _sinclair_typebox.TString;
        message: _sinclair_typebox.TString;
        result: _sinclair_typebox.TUnion<[_sinclair_typebox.TString, _sinclair_typebox.TNull]>;
        status: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"queued">, _sinclair_typebox.TLiteral<"running">, _sinclair_typebox.TLiteral<"completed">, _sinclair_typebox.TLiteral<"failed">, _sinclair_typebox.TLiteral<"cancelled">]>;
        updatedAt: _sinclair_typebox.TString;
    }>;
    leaseExpiresAt: _sinclair_typebox.TString;
    leaseToken: _sinclair_typebox.TString;
}>;
type DiagnosticJobClaim = Static<typeof DiagnosticJobClaimSchema>;
declare const WorkerHeartbeatRequestSchema: _sinclair_typebox.TObject<{
    leaseSeconds: _sinclair_typebox.TInteger;
    leaseToken: _sinclair_typebox.TString;
}>;
type WorkerHeartbeatRequest = Static<typeof WorkerHeartbeatRequestSchema>;
declare const WorkerCompleteRequestSchema: _sinclair_typebox.TObject<{
    leaseToken: _sinclair_typebox.TString;
    result: _sinclair_typebox.TString;
}>;
type WorkerCompleteRequest = Static<typeof WorkerCompleteRequestSchema>;
declare const WorkerFailRequestSchema: _sinclair_typebox.TObject<{
    error: _sinclair_typebox.TString;
    leaseToken: _sinclair_typebox.TString;
}>;
type WorkerFailRequest = Static<typeof WorkerFailRequestSchema>;
declare const ErrorResponseSchema: _sinclair_typebox.TObject<{
    code: _sinclair_typebox.TString;
    correlationId: _sinclair_typebox.TString;
    message: _sinclair_typebox.TString;
}>;
type ErrorResponse = Static<typeof ErrorResponseSchema>;
declare const CorrelationIdHeader: "x-hymui-correlation-id";
declare const UsernameSchema: _sinclair_typebox.TString;
declare const ActorSchema: _sinclair_typebox.TObject<{
    createdAt: _sinclair_typebox.TString;
    displayName: _sinclair_typebox.TString;
    id: _sinclair_typebox.TString;
    username: _sinclair_typebox.TString;
}>;
type Actor = Static<typeof ActorSchema>;
declare const AuthSessionSchema: _sinclair_typebox.TObject<{
    actor: _sinclair_typebox.TObject<{
        createdAt: _sinclair_typebox.TString;
        displayName: _sinclair_typebox.TString;
        id: _sinclair_typebox.TString;
        username: _sinclair_typebox.TString;
    }>;
    expiresAt: _sinclair_typebox.TString;
}>;
type AuthSession = Static<typeof AuthSessionSchema>;
declare const AuthCapabilitiesSchema: _sinclair_typebox.TObject<{
    edition: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"local">, _sinclair_typebox.TLiteral<"self-hosted">, _sinclair_typebox.TLiteral<"hosted">]>;
    localProfileAvailable: _sinclair_typebox.TBoolean;
    registrationOpen: _sinclair_typebox.TBoolean;
}>;
type AuthCapabilities = Static<typeof AuthCapabilitiesSchema>;
declare const RegisterRequestSchema: _sinclair_typebox.TObject<{
    displayName: _sinclair_typebox.TString;
    password: _sinclair_typebox.TString;
    username: _sinclair_typebox.TString;
}>;
type RegisterRequest = Static<typeof RegisterRequestSchema>;
declare const LoginRequestSchema: _sinclair_typebox.TObject<{
    password: _sinclair_typebox.TString;
    username: _sinclair_typebox.TString;
}>;
type LoginRequest = Static<typeof LoginRequestSchema>;
declare const ProjectLinkSchema: _sinclair_typebox.TObject<{
    kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"repository">, _sinclair_typebox.TLiteral<"external">]>;
    label: _sinclair_typebox.TString;
    url: _sinclair_typebox.TString;
}>;
type ProjectLink = Static<typeof ProjectLinkSchema>;
declare const ProjectSchema: _sinclair_typebox.TObject<{
    archived: _sinclair_typebox.TBoolean;
    createdAt: _sinclair_typebox.TString;
    description: _sinclair_typebox.TString;
    id: _sinclair_typebox.TString;
    links: _sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"repository">, _sinclair_typebox.TLiteral<"external">]>;
        label: _sinclair_typebox.TString;
        url: _sinclair_typebox.TString;
    }>>;
    name: _sinclair_typebox.TString;
    ownerId: _sinclair_typebox.TString;
    revision: _sinclair_typebox.TInteger;
    updatedAt: _sinclair_typebox.TString;
}>;
type Project = Static<typeof ProjectSchema>;
declare const ProjectAttachmentSchema: _sinclair_typebox.TObject<{
    byteLength: _sinclair_typebox.TInteger;
    checksum: _sinclair_typebox.TString;
    contentType: _sinclair_typebox.TString;
    createdAt: _sinclair_typebox.TString;
    fileName: _sinclair_typebox.TString;
    id: _sinclair_typebox.TString;
    projectId: _sinclair_typebox.TString;
}>;
type ProjectAttachment = Static<typeof ProjectAttachmentSchema>;
declare const ProjectAttachmentListSchema: _sinclair_typebox.TObject<{
    attachments: _sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        byteLength: _sinclair_typebox.TInteger;
        checksum: _sinclair_typebox.TString;
        contentType: _sinclair_typebox.TString;
        createdAt: _sinclair_typebox.TString;
        fileName: _sinclair_typebox.TString;
        id: _sinclair_typebox.TString;
        projectId: _sinclair_typebox.TString;
    }>>;
}>;
type ProjectAttachmentList = Static<typeof ProjectAttachmentListSchema>;
declare const ProjectListSchema: _sinclair_typebox.TObject<{
    projects: _sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        archived: _sinclair_typebox.TBoolean;
        createdAt: _sinclair_typebox.TString;
        description: _sinclair_typebox.TString;
        id: _sinclair_typebox.TString;
        links: _sinclair_typebox.TArray<_sinclair_typebox.TObject<{
            kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"repository">, _sinclair_typebox.TLiteral<"external">]>;
            label: _sinclair_typebox.TString;
            url: _sinclair_typebox.TString;
        }>>;
        name: _sinclair_typebox.TString;
        ownerId: _sinclair_typebox.TString;
        revision: _sinclair_typebox.TInteger;
        updatedAt: _sinclair_typebox.TString;
    }>>;
}>;
type ProjectList = Static<typeof ProjectListSchema>;
declare const CreateProjectRequestSchema: _sinclair_typebox.TObject<{
    description: _sinclair_typebox.TOptional<_sinclair_typebox.TString>;
    links: _sinclair_typebox.TOptional<_sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"repository">, _sinclair_typebox.TLiteral<"external">]>;
        label: _sinclair_typebox.TString;
        url: _sinclair_typebox.TString;
    }>>>;
    name: _sinclair_typebox.TString;
}>;
type CreateProjectRequest = Static<typeof CreateProjectRequestSchema>;
declare const UpdateProjectRequestSchema: _sinclair_typebox.TObject<{
    archived: _sinclair_typebox.TOptional<_sinclair_typebox.TBoolean>;
    description: _sinclair_typebox.TOptional<_sinclair_typebox.TString>;
    links: _sinclair_typebox.TOptional<_sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        kind: _sinclair_typebox.TUnion<[_sinclair_typebox.TLiteral<"repository">, _sinclair_typebox.TLiteral<"external">]>;
        label: _sinclair_typebox.TString;
        url: _sinclair_typebox.TString;
    }>>>;
    name: _sinclair_typebox.TOptional<_sinclair_typebox.TString>;
    revision: _sinclair_typebox.TInteger;
}>;
type UpdateProjectRequest = Static<typeof UpdateProjectRequestSchema>;
declare const DeleteProjectRequestSchema: _sinclair_typebox.TObject<{
    name: _sinclair_typebox.TString;
    revision: _sinclair_typebox.TInteger;
}>;
type DeleteProjectRequest = Static<typeof DeleteProjectRequestSchema>;

export { type Actor, ActorSchema, ApiVersion, type AuthCapabilities, AuthCapabilitiesSchema, type AuthSession, AuthSessionSchema, CorrelationIdHeader, type CreateProjectRequest, CreateProjectRequestSchema, type DeleteProjectRequest, DeleteProjectRequestSchema, type DiagnosticJob, type DiagnosticJobClaim, DiagnosticJobClaimSchema, type DiagnosticJobRequest, DiagnosticJobRequestSchema, DiagnosticJobSchema, type Edition, EditionSchema, type ErrorResponse, ErrorResponseSchema, type HealthResponse, HealthResponseSchema, HymuiVersion, type JobStatus, JobStatusSchema, type LoginRequest, LoginRequestSchema, type Project, type ProjectAttachment, type ProjectAttachmentList, ProjectAttachmentListSchema, ProjectAttachmentSchema, type ProjectLink, ProjectLinkSchema, type ProjectList, ProjectListSchema, ProjectSchema, type RegisterRequest, RegisterRequestSchema, type RuntimeMode, RuntimeModeSchema, type ServiceState, ServiceStateSchema, type StorageAdapterKind, StorageAdapterKindSchema, type StorageHealth, StorageHealthSchema, type UpdateProjectRequest, UpdateProjectRequestSchema, UsernameSchema, type WorkerClaimRequest, WorkerClaimRequestSchema, type WorkerCompleteRequest, WorkerCompleteRequestSchema, type WorkerFailRequest, WorkerFailRequestSchema, type WorkerHeartbeatRequest, WorkerHeartbeatRequestSchema };
