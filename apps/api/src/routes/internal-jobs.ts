import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { RuntimeConfig } from "@hymui/config";
import {
  DiagnosticJobClaimSchema,
  DiagnosticJobSchema,
  ErrorResponseSchema,
  WorkerClaimRequestSchema,
  WorkerCompleteRequestSchema,
  WorkerFailRequestSchema,
  WorkerHeartbeatRequestSchema,
  type DiagnosticJob,
  type ErrorResponse,
} from "@hymui/contracts";
import type { HymuiDatabase, PersistedDiagnosticJob } from "@hymui/db";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

const JobParamsSchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

function errorResponse(correlationId: string, code: string, message: string): ErrorResponse {
  return { code, correlationId, message };
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicJob(job: PersistedDiagnosticJob): DiagnosticJob {
  return {
    completedAt: job.completedAt,
    correlationId: job.correlationId,
    createdAt: job.createdAt,
    id: job.id,
    message: job.message,
    result: job.result,
    status: job.status,
    updatedAt: job.updatedAt,
  };
}

function isInternalRequest(request: FastifyRequest, internalToken: string): boolean {
  const received = Buffer.from(request.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${internalToken}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function registerInternalJobRoutes(
  app: FastifyInstance,
  database: HymuiDatabase,
  config: RuntimeConfig,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.post(
    "/internal/v1/jobs/claim",
    {
      schema: {
        body: WorkerClaimRequestSchema,
        response: {
          200: DiagnosticJobClaimSchema,
          204: Type.Null(),
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (!isInternalRequest(request, config.internalToken)) {
        return reply
          .status(401)
          .send(
            errorResponse(
              correlationId,
              "INTERNAL_AUTH_REQUIRED",
              "Internal authorization failed.",
            ),
          );
      }
      const timestamp = new Date();
      const leaseExpiresAt = new Date(timestamp.getTime() + request.body.leaseSeconds * 1_000);
      const leaseToken = randomBytes(32).toString("base64url");
      const job = await database.diagnosticJobs.claimNext({
        leaseExpiresAt,
        leaseTokenHash: tokenHash(leaseToken),
        timestamp,
        workerId: request.body.workerId,
      });
      if (!job) return reply.status(204).send(null);
      return reply.send({
        attempt: job.attempt,
        job: publicJob(job),
        leaseExpiresAt: leaseExpiresAt.toISOString(),
        leaseToken,
      });
    },
  );

  typedApp.post(
    "/internal/v1/jobs/:id/heartbeat",
    {
      schema: {
        body: WorkerHeartbeatRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (!isInternalRequest(request, config.internalToken)) {
        return reply
          .status(401)
          .send(
            errorResponse(
              correlationId,
              "INTERNAL_AUTH_REQUIRED",
              "Internal authorization failed.",
            ),
          );
      }
      const timestamp = new Date();
      const job = await database.diagnosticJobs.heartbeat({
        id: request.params.id,
        leaseExpiresAt: new Date(timestamp.getTime() + request.body.leaseSeconds * 1_000),
        leaseTokenHash: tokenHash(request.body.leaseToken),
        timestamp,
      });
      if (!job) {
        return reply
          .status(409)
          .send(
            errorResponse(
              correlationId,
              "JOB_LEASE_CONFLICT",
              "The job lease is no longer active.",
            ),
          );
      }
      return reply.send(publicJob(job));
    },
  );

  typedApp.post(
    "/internal/v1/jobs/:id/complete",
    {
      schema: {
        body: WorkerCompleteRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (!isInternalRequest(request, config.internalToken)) {
        return reply
          .status(401)
          .send(
            errorResponse(
              correlationId,
              "INTERNAL_AUTH_REQUIRED",
              "Internal authorization failed.",
            ),
          );
      }
      const job = await database.diagnosticJobs.complete({
        id: request.params.id,
        leaseTokenHash: tokenHash(request.body.leaseToken),
        result: request.body.result,
        timestamp: new Date(),
      });
      if (!job) {
        return reply
          .status(409)
          .send(
            errorResponse(
              correlationId,
              "JOB_LEASE_CONFLICT",
              "The job lease is no longer active.",
            ),
          );
      }
      return reply.send(publicJob(job));
    },
  );

  typedApp.post(
    "/internal/v1/jobs/:id/fail",
    {
      schema: {
        body: WorkerFailRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (!isInternalRequest(request, config.internalToken)) {
        return reply
          .status(401)
          .send(
            errorResponse(
              correlationId,
              "INTERNAL_AUTH_REQUIRED",
              "Internal authorization failed.",
            ),
          );
      }
      const job = await database.diagnosticJobs.fail({
        error: request.body.error,
        id: request.params.id,
        leaseTokenHash: tokenHash(request.body.leaseToken),
        timestamp: new Date(),
      });
      if (!job) {
        return reply
          .status(409)
          .send(
            errorResponse(
              correlationId,
              "JOB_LEASE_CONFLICT",
              "The job lease is no longer active.",
            ),
          );
      }
      return reply.send(publicJob(job));
    },
  );
}
