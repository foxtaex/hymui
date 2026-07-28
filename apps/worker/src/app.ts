import { randomUUID } from "node:crypto";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { CorrelationIdHeader, type DiagnosticJobClaim, type ErrorResponse } from "@hymui/contracts";
import { Type } from "@sinclair/typebox";
import Fastify, { type FastifyInstance } from "fastify";

const WorkerHealthSchema = Type.Object(
  {
    service: Type.Literal("worker"),
    state: Type.Literal("ready"),
  },
  { additionalProperties: false },
);

export interface BuildWorkerOptions {
  readonly apiBaseUrl: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly internalToken: string;
  readonly leaseSeconds?: number;
  readonly logger?: boolean;
  readonly pollIntervalMs?: number;
  readonly processingDelayMs?: number;
  readonly workerId?: string;
}

export function buildWorkerApp(options: BuildWorkerOptions): FastifyInstance {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const leaseSeconds = options.leaseSeconds ?? 5;
  const pollIntervalMs = options.pollIntervalMs ?? 120;
  const processingDelayMs = options.processingDelayMs ?? 360;
  const workerId = options.workerId ?? randomUUID();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let stopped = false;
  let polling = false;
  const app = Fastify({ logger: options.logger ?? true }).withTypeProvider<TypeBoxTypeProvider>();

  function schedule(callback: () => void, delayMs: number): void {
    if (stopped) return;
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delayMs);
    timers.add(timer);
  }

  function delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => schedule(resolve, delayMs));
  }

  async function internalRequest(path: string, init: RequestInit): Promise<Response> {
    return fetchImpl(`${options.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${options.internalToken}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async function claimNext(): Promise<DiagnosticJobClaim | null> {
    const response = await internalRequest("/internal/v1/jobs/claim", {
      body: JSON.stringify({ leaseSeconds, workerId }),
      method: "POST",
    });
    if (response.status === 204) return null;
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as ErrorResponse | null;
      throw new Error(error?.code ?? `Claim failed with ${response.status}`);
    }
    return (await response.json()) as DiagnosticJobClaim;
  }

  async function heartbeat(claim: DiagnosticJobClaim): Promise<boolean> {
    const response = await internalRequest(`/internal/v1/jobs/${claim.job.id}/heartbeat`, {
      body: JSON.stringify({ leaseSeconds, leaseToken: claim.leaseToken }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST",
    });
    return response.ok;
  }

  async function complete(claim: DiagnosticJobClaim): Promise<boolean> {
    const response = await internalRequest(`/internal/v1/jobs/${claim.job.id}/complete`, {
      body: JSON.stringify({
        leaseToken: claim.leaseToken,
        result: `Web → API → Worker completed: ${claim.job.message}`,
      }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST",
    });
    if (response.status === 409) return false;
    if (!response.ok) {
      throw new Error(`Completion failed with ${response.status}`);
    }
    return true;
  }

  async function fail(claim: DiagnosticJobClaim, error: unknown): Promise<void> {
    await internalRequest(`/internal/v1/jobs/${claim.job.id}/fail`, {
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Worker execution failed.",
        leaseToken: claim.leaseToken,
      }),
      headers: { [CorrelationIdHeader]: claim.job.correlationId },
      method: "POST",
    }).catch(() => undefined);
  }

  async function execute(claim: DiagnosticJobClaim): Promise<void> {
    app.log.info(
      { attempt: claim.attempt, correlationId: claim.job.correlationId, jobId: claim.job.id },
      "Diagnostic job claimed",
    );
    const heartbeatDelayMs = Math.max(250, Math.round((leaseSeconds * 1_000) / 2));
    let elapsedMs = 0;
    try {
      while (!stopped && elapsedMs + heartbeatDelayMs < processingDelayMs) {
        await delay(heartbeatDelayMs);
        if (stopped) return;
        elapsedMs += heartbeatDelayMs;
        if (!(await heartbeat(claim))) return;
      }
      if (stopped) return;
      await delay(Math.max(0, processingDelayMs - elapsedMs));
      if (stopped) return;
      if (await complete(claim)) {
        app.log.info(
          { correlationId: claim.job.correlationId, jobId: claim.job.id },
          "Diagnostic job completed",
        );
      }
    } catch (error) {
      await fail(claim, error);
      throw error;
    }
  }

  async function poll(): Promise<void> {
    if (stopped || polling) return;
    polling = true;
    try {
      const claim = await claimNext();
      if (claim) await execute(claim);
    } catch (error) {
      app.log.warn({ error, workerId }, "Durable job poll failed");
    } finally {
      polling = false;
      schedule(() => void poll(), pollIntervalMs);
    }
  }

  app.addHook("onReady", async () => {
    schedule(() => void poll(), 0);
  });

  app.addHook("onClose", async () => {
    stopped = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  });

  app.get(
    "/internal/v1/health",
    {
      schema: {
        response: { 200: WorkerHealthSchema },
      },
    },
    async () => ({ service: "worker" as const, state: "ready" as const }),
  );

  return app;
}
