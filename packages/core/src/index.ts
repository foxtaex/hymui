import { randomUUID } from "node:crypto";

import type { DiagnosticJob, DiagnosticJobRequest } from "@hymui/contracts";

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface JobTransport {
  cancel(id: string, correlationId: string): Promise<DiagnosticJob>;
  create(request: DiagnosticJobRequest, correlationId: string): Promise<DiagnosticJob>;
  get(id: string, correlationId: string): Promise<DiagnosticJob | null>;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export const uuidGenerator: IdGenerator = {
  next: () => randomUUID(),
};

export function resolveCorrelationId(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(candidate)) {
    return candidate;
  }
  return randomUUID();
}
