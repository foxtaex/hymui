// ../../packages/config/src/index.ts
var editions = /* @__PURE__ */ new Set(["local", "self-hosted", "hosted"]);
var modes = /* @__PURE__ */ new Set(["development", "test", "local", "self-hosted", "hosted"]);
var databaseDrivers = /* @__PURE__ */ new Set([
  "pglite",
  "postgresql",
  "mysql",
  "mariadb",
  "mssql"
]);
var storageDrivers = /* @__PURE__ */ new Set(["filesystem", "gcs", "s3"]);
function parseEnum(name, value, fallback, allowed) {
  const candidate = value ?? fallback;
  if (!allowed.has(candidate)) {
    throw new Error(`${name} must be one of: ${[...allowed].join(", ")}`);
  }
  return candidate;
}
function parsePort(name, value, fallback) {
  if (value === void 0) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${name} must be an integer between 0 and 65535`);
  }
  return port;
}
function loadRuntimeConfig(service, env = process.env) {
  const nodeMode = env.NODE_ENV === "test" ? "test" : "development";
  const mode = parseEnum("HYMUI_MODE", env.HYMUI_MODE, nodeMode, modes);
  const edition = parseEnum("HYMUI_EDITION", env.HYMUI_EDITION, "local", editions);
  const apiHost = env.HYMUI_API_HOST ?? "127.0.0.1";
  const apiPort = parsePort("HYMUI_API_PORT", env.HYMUI_API_PORT, 4e3);
  const apiUrl = env.HYMUI_API_URL ?? `http://${apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost}:${apiPort}`;
  const databaseDriver = parseEnum(
    "HYMUI_DATABASE_DRIVER",
    env.HYMUI_DATABASE_DRIVER,
    edition === "local" ? "pglite" : "postgresql",
    databaseDrivers
  );
  const storageDriver = parseEnum(
    "HYMUI_STORAGE_DRIVER",
    env.HYMUI_STORAGE_DRIVER,
    edition === "local" ? "filesystem" : edition === "hosted" ? "gcs" : "s3",
    storageDrivers
  );
  const workerHost = env.HYMUI_WORKER_HOST ?? "127.0.0.1";
  const workerPort = parsePort("HYMUI_WORKER_PORT", env.HYMUI_WORKER_PORT, 4001);
  const workerUrl = env.HYMUI_WORKER_URL ?? `http://${workerHost === "0.0.0.0" ? "127.0.0.1" : workerHost}:${workerPort}`;
  const internalToken = env.HYMUI_INTERNAL_TOKEN ?? (edition === "local" ? "hymui-local-development-token" : void 0);
  try {
    new URL(apiUrl);
    new URL(workerUrl);
  } catch {
    throw new Error("HYMUI_API_URL and HYMUI_WORKER_URL must be valid absolute URLs");
  }
  if (!internalToken || internalToken.length < 24) {
    throw new Error("HYMUI_INTERNAL_TOKEN must contain at least 24 characters");
  }
  return Object.freeze({
    apiHost,
    apiPort,
    apiUrl,
    databaseDriver,
    databaseUrl: env.HYMUI_DATABASE_URL,
    edition,
    internalToken,
    mode,
    service,
    storageDriver,
    storagePath: env.HYMUI_STORAGE_PATH,
    workerHost,
    workerPort,
    workerUrl
  });
}

// src/app.ts
import { randomUUID } from "crypto";

// ../../packages/contracts/src/index.ts
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
var ProjectSchema = Type.Object(
  {
    archived: Type.Boolean(),
    createdAt: DateTimeSchema,
    description: Type.String({ maxLength: 2e3 }),
    id: UuidSchema,
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
    name: Type.String({ maxLength: 120, minLength: 1 })
  },
  { additionalProperties: false }
);
var UpdateProjectRequestSchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(Type.String({ maxLength: 2e3 })),
    name: Type.Optional(Type.String({ maxLength: 120, minLength: 1 })),
    revision: Type.Integer({ minimum: 1 })
  },
  { additionalProperties: false }
);

// src/app.ts
import { Type as Type2 } from "@sinclair/typebox";
import Fastify from "fastify";
var WorkerHealthSchema = Type2.Object(
  {
    service: Type2.Literal("worker"),
    state: Type2.Literal("ready")
  },
  { additionalProperties: false }
);
function buildWorkerApp(options) {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const leaseSeconds = options.leaseSeconds ?? 5;
  const pollIntervalMs = options.pollIntervalMs ?? 120;
  const processingDelayMs = options.processingDelayMs ?? 360;
  const workerId = options.workerId ?? randomUUID();
  const timers = /* @__PURE__ */ new Set();
  let stopped = false;
  let polling = false;
  const app2 = Fastify({ logger: options.logger ?? true }).withTypeProvider();
  function schedule(callback, delayMs) {
    if (stopped) return;
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delayMs);
    timers.add(timer);
  }
  function delay(delayMs) {
    return new Promise((resolve) => schedule(resolve, delayMs));
  }
  async function internalRequest(path, init) {
    return fetchImpl(`${options.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${options.internalToken}`,
        "content-type": "application/json",
        ...init.headers ?? {}
      }
    });
  }
  async function claimNext() {
    const response = await internalRequest("/internal/v1/jobs/claim", {
      body: JSON.stringify({ leaseSeconds, workerId }),
      method: "POST"
    });
    if (response.status === 204) return null;
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.code ?? `Claim failed with ${response.status}`);
    }
    return await response.json();
  }
  async function heartbeat(claim) {
    const response = await internalRequest(`/internal/v1/jobs/${claim.job.id}/heartbeat`, {
      body: JSON.stringify({ leaseSeconds, leaseToken: claim.leaseToken }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST"
    });
    return response.ok;
  }
  async function complete(claim) {
    const response = await internalRequest(`/internal/v1/jobs/${claim.job.id}/complete`, {
      body: JSON.stringify({
        leaseToken: claim.leaseToken,
        result: `Web \u2192 API \u2192 Worker completed: ${claim.job.message}`
      }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST"
    });
    if (response.status === 409) return false;
    if (!response.ok) {
      throw new Error(`Completion failed with ${response.status}`);
    }
    return true;
  }
  async function fail(claim, error) {
    await internalRequest(`/internal/v1/jobs/${claim.job.id}/fail`, {
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Worker execution failed.",
        leaseToken: claim.leaseToken
      }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST"
    }).catch(() => void 0);
  }
  async function execute(claim) {
    app2.log.info(
      { attempt: claim.attempt, correlationId: claim.job.correlationId, jobId: claim.job.id },
      "Diagnostic job claimed"
    );
    const heartbeatDelayMs = Math.max(250, Math.round(leaseSeconds * 1e3 / 2));
    let elapsedMs = 0;
    try {
      while (!stopped && elapsedMs + heartbeatDelayMs < processingDelayMs) {
        await delay(heartbeatDelayMs);
        if (stopped) return;
        elapsedMs += heartbeatDelayMs;
        if (!await heartbeat(claim)) return;
      }
      if (stopped) return;
      await delay(Math.max(0, processingDelayMs - elapsedMs));
      if (stopped) return;
      if (await complete(claim)) {
        app2.log.info(
          { correlationId: claim.job.correlationId, jobId: claim.job.id },
          "Diagnostic job completed"
        );
      }
    } catch (error) {
      await fail(claim, error);
      throw error;
    }
  }
  async function poll() {
    if (stopped || polling) return;
    polling = true;
    try {
      const claim = await claimNext();
      if (claim) await execute(claim);
    } catch (error) {
      app2.log.warn({ error, workerId }, "Durable job poll failed");
    } finally {
      polling = false;
      schedule(() => void poll(), pollIntervalMs);
    }
  }
  app2.addHook("onReady", async () => {
    schedule(() => void poll(), 0);
  });
  app2.addHook("onClose", async () => {
    stopped = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  });
  app2.get(
    "/internal/v1/health",
    {
      schema: {
        response: { 200: WorkerHealthSchema }
      }
    },
    async () => ({ service: "worker", state: "ready" })
  );
  return app2;
}

// src/index.ts
var config = loadRuntimeConfig("worker");
var app = buildWorkerApp({
  apiBaseUrl: config.apiUrl,
  internalToken: config.internalToken
});
async function shutdown(signal) {
  app.log.info({ signal }, "Stopping Hymui Worker");
  await app.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
try {
  await app.listen({ host: config.workerHost, port: config.workerPort });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
//# sourceMappingURL=index.js.map