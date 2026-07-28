import { randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type RuntimeConfig, loadRuntimeConfig } from "@hymui/config";
import {
  ApiVersion,
  CorrelationIdHeader,
  DiagnosticJobRequestSchema,
  DiagnosticJobSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  HymuiVersion,
  type ErrorResponse,
  type ServiceState,
} from "@hymui/contracts";
import { resolveCorrelationId } from "@hymui/core";
import { createPgliteDatabase, type HymuiDatabase } from "@hymui/db";
import { createFilesystemObjectStorage, type ObjectStorage } from "@hymui/storage";
import { Type } from "@sinclair/typebox";
import Fastify, { type FastifyInstance } from "fastify";

import { registerAuthRoutes } from "./routes/auth.js";
import { registerInternalJobRoutes } from "./routes/internal-jobs.js";
import { registerProjectRoutes } from "./routes/projects.js";

export interface BuildApiOptions {
  config?: RuntimeConfig;
  database?: HymuiDatabase;
  fetch?: typeof globalThis.fetch;
  logger?: boolean;
  storage?: ObjectStorage;
}

const JobParamsSchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

function correlationIdFrom(headers: Record<string, unknown>): string {
  const value = headers[CorrelationIdHeader];
  return resolveCorrelationId(typeof value === "string" ? value : undefined);
}

function errorResponse(correlationId: string, code: string, message: string): ErrorResponse {
  return { code, correlationId, message };
}

export async function buildApiApp(options: BuildApiOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadRuntimeConfig("api");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const ownsDatabase = options.database === undefined;
  if (ownsDatabase && config.databaseDriver !== "pglite") {
    throw new Error(
      `Database driver "${config.databaseDriver}" is not implemented in the current Plan 02 slice.`,
    );
  }
  const database =
    options.database ??
    (await createPgliteDatabase(config.databaseUrl ? { dataDirectory: config.databaseUrl } : {}));
  if (options.storage && options.storage.kind !== config.storageDriver) {
    throw new Error(
      `Configured storage driver "${config.storageDriver}" does not match injected adapter "${options.storage.kind}".`,
    );
  }
  if (!options.storage && config.storageDriver !== "filesystem") {
    throw new Error(
      `Storage driver "${config.storageDriver}" is not implemented in the current Plan 02 slice.`,
    );
  }
  const storage =
    options.storage ??
    (await createFilesystemObjectStorage({
      rootDirectory: config.storagePath ?? ".hymui/storage",
    }));
  const app = Fastify({ logger: options.logger ?? true }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(cookie);
  await app.register(cors, {
    allowedHeaders: ["content-type", CorrelationIdHeader],
    credentials: true,
    exposedHeaders: [CorrelationIdHeader],
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    origin: true,
  });

  if (ownsDatabase) {
    app.addHook("onClose", async () => {
      await database.close();
    });
  }

  app.addHook("onRequest", async (request, reply) => {
    const correlationId = correlationIdFrom(request.headers);
    reply.header(CorrelationIdHeader, correlationId);
  });

  app.setErrorHandler((error, request, reply) => {
    const correlationId = correlationIdFrom(request.headers);
    const isValidationError = typeof error === "object" && error !== null && "validation" in error;
    request.log.error({ correlationId, error }, "Request failed");
    reply
      .status(isValidationError ? 400 : 500)
      .send(
        errorResponse(
          correlationId,
          isValidationError ? "INVALID_REQUEST" : "INTERNAL_ERROR",
          isValidationError
            ? "The request does not match the API contract."
            : "The request failed.",
        ),
      );
  });

  app.get(
    "/api/v1/health",
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async (request) => {
      const correlationId = correlationIdFrom(request.headers);
      let worker: ServiceState = "ready";

      try {
        const response = await fetchImpl(`${config.workerUrl}/internal/v1/health`, {
          headers: { [CorrelationIdHeader]: correlationId },
          signal: AbortSignal.timeout(800),
        });
        if (!response.ok) worker = "degraded";
      } catch {
        worker = "unavailable";
      }

      return {
        apiVersion: ApiVersion,
        correlationId,
        edition: config.edition,
        mode: config.mode,
        service: "api" as const,
        state: worker === "ready" ? ("ready" as const) : ("degraded" as const),
        storage: {
          kind: storage.kind,
          state: "ready" as const,
        },
        timestamp: new Date().toISOString(),
        version: HymuiVersion,
        worker,
      };
    },
  );

  app.post(
    "/api/v1/diagnostics/jobs",
    {
      schema: {
        body: DiagnosticJobRequestSchema,
        response: {
          202: DiagnosticJobSchema,
          503: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.create({
        correlationId,
        id: randomUUID(),
        request: request.body,
        timestamp: new Date(),
      });
      request.log.info({ correlationId, jobId: job.id }, "Durable diagnostic job queued");
      return reply.status(202).send(job);
    },
  );

  app.get(
    "/api/v1/diagnostics/jobs/:id",
    {
      schema: {
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          404: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.get(request.params.id);
      if (!job) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "JOB_NOT_FOUND", "The job was not found."));
      }
      return reply.send(job);
    },
  );

  app.post(
    "/api/v1/diagnostics/jobs/:id/cancel",
    {
      schema: {
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          404: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.cancel(request.params.id, new Date());
      if (!job) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "JOB_NOT_FOUND", "The job was not found."));
      }
      return reply.send(job);
    },
  );

  await registerAuthRoutes(app, database, config);
  await registerInternalJobRoutes(app, database, config);
  await registerProjectRoutes(app, database);

  return app;
}
