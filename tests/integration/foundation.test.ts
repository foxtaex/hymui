import { createServer } from "node:net";

import type { RuntimeConfig } from "@hymui/config";
import type { DiagnosticJob, HealthResponse } from "@hymui/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../../apps/api/src/app.js";
import { buildWorkerApp } from "../../apps/worker/src/app.js";
import { createPgliteDatabase, type HymuiDatabase } from "../../packages/db/src/index.js";

let api: Awaited<ReturnType<typeof buildApiApp>>;
let config: RuntimeConfig;
let database: HymuiDatabase;
let worker: ReturnType<typeof buildWorkerApp>;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a TCP port"));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

beforeAll(async () => {
  const apiPort = await freePort();
  const workerPort = await freePort();

  config = {
    apiHost: "127.0.0.1",
    apiPort,
    apiUrl: `http://127.0.0.1:${apiPort}`,
    databaseDriver: "pglite",
    databaseUrl: undefined,
    edition: "local",
    internalToken: "integration-internal-token",
    mode: "test",
    service: "api",
    storageDriver: "filesystem",
    storagePath: undefined,
    workerHost: "127.0.0.1",
    workerPort,
    workerUrl: `http://127.0.0.1:${workerPort}`,
  };
  database = await createPgliteDatabase();
  api = await buildApiApp({ config, database, logger: false });
  await api.listen({ host: config.apiHost, port: config.apiPort });
  worker = buildWorkerApp({
    apiBaseUrl: config.apiUrl,
    internalToken: config.internalToken,
    leaseSeconds: 2,
    logger: false,
    pollIntervalMs: 10,
    processingDelayMs: 80,
  });
  await worker.listen({ host: config.workerHost, port: config.workerPort });
});

afterAll(async () => {
  await worker.close();
  await api.close();
  await database.close();
});

describe("Foundation Web/API/Worker contracts", () => {
  it("reports the API and Worker as ready", async () => {
    const response = await api.inject({
      method: "GET",
      url: "/api/v1/health",
    });
    const health = response.json<HealthResponse>();

    expect(response.statusCode).toBe(200);
    expect(health).toMatchObject({
      edition: "local",
      mode: "test",
      state: "ready",
      worker: "ready",
    });
  });

  it("rejects unauthenticated access to the internal job lease API", async () => {
    const response = await api.inject({
      method: "POST",
      payload: { leaseSeconds: 5, workerId: "38b9efb7-a40c-474b-b89a-24051418905f" },
      url: "/internal/v1/jobs/claim",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "INTERNAL_AUTH_REQUIRED" });
  });

  it("runs one diagnostic job through API and Worker", async () => {
    const createResponse = await api.inject({
      method: "POST",
      payload: { message: "Verify Hymui Foundation Plan 01" },
      url: "/api/v1/diagnostics/jobs",
    });
    const created = createResponse.json<DiagnosticJob>();

    expect(createResponse.statusCode).toBe(202);
    expect(created.status).toBe("queued");

    let current = created;
    for (let attempt = 0; attempt < 20 && current.status !== "completed"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const response = await api.inject({
        method: "GET",
        url: `/api/v1/diagnostics/jobs/${created.id}`,
      });
      current = response.json<DiagnosticJob>();
    }

    expect(current.status).toBe("completed");
    expect(current.result).toContain("Web → API → Worker completed");
    expect(current.correlationId).toBe(created.correlationId);
  });

  it("recovers an expired claim after a Worker restart and leaves cancelled jobs terminal", async () => {
    await worker.close();

    const cancelledCreate = await api.inject({
      method: "POST",
      payload: { message: "Cancel before a Worker sees this" },
      url: "/api/v1/diagnostics/jobs",
    });
    const cancelledJob = cancelledCreate.json<DiagnosticJob>();
    const cancelledResponse = await api.inject({
      method: "POST",
      url: `/api/v1/diagnostics/jobs/${cancelledJob.id}/cancel`,
    });
    expect(cancelledResponse.json<DiagnosticJob>().status).toBe("cancelled");

    const recoveryCreate = await api.inject({
      method: "POST",
      payload: { message: "Recover after a Worker restart" },
      url: "/api/v1/diagnostics/jobs",
    });
    const recoveryJob = recoveryCreate.json<DiagnosticJob>();

    worker = buildWorkerApp({
      apiBaseUrl: config.apiUrl,
      internalToken: config.internalToken,
      leaseSeconds: 1,
      logger: false,
      pollIntervalMs: 10,
      processingDelayMs: 5_000,
    });
    await worker.listen({ host: config.workerHost, port: config.workerPort });

    let running = recoveryJob;
    for (let attempt = 0; attempt < 50 && running.status !== "running"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const response = await api.inject({
        method: "GET",
        url: `/api/v1/diagnostics/jobs/${recoveryJob.id}`,
      });
      running = response.json<DiagnosticJob>();
    }
    expect(running.status).toBe("running");

    await worker.close();
    await new Promise((resolve) => setTimeout(resolve, 1_050));

    worker = buildWorkerApp({
      apiBaseUrl: config.apiUrl,
      internalToken: config.internalToken,
      leaseSeconds: 1,
      logger: false,
      pollIntervalMs: 10,
      processingDelayMs: 40,
    });
    await worker.listen({ host: config.workerHost, port: config.workerPort });

    let recovered = recoveryJob;
    for (let attempt = 0; attempt < 100 && recovered.status !== "completed"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const response = await api.inject({
        method: "GET",
        url: `/api/v1/diagnostics/jobs/${recoveryJob.id}`,
      });
      recovered = response.json<DiagnosticJob>();
    }

    expect(recovered.status).toBe("completed");
    expect(recovered.result).toContain("Recover after a Worker restart");
    expect(await database.diagnosticJobs.get(recoveryJob.id)).toMatchObject({ attempt: 2 });
    expect(await database.diagnosticJobs.get(cancelledJob.id)).toMatchObject({
      attempt: 0,
      status: "cancelled",
    });
  });
});
