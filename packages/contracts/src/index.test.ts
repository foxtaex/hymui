import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";

import {
  DiagnosticJobSchema,
  HealthResponseSchema,
  HymuiVersion,
  type DiagnosticJob,
} from "./index.js";

describe("Hymui contracts", () => {
  it("accepts a complete diagnostic job", () => {
    const now = new Date().toISOString();
    const job: DiagnosticJob = {
      completedAt: null,
      correlationId: "38b9efb7-a40c-474b-b89a-24051418905f",
      createdAt: now,
      id: "594778a4-49cf-42b6-a5d6-70b521f7df99",
      message: "Verify the foundation",
      result: null,
      status: "queued",
      updatedAt: now,
    };

    expect(Value.Check(DiagnosticJobSchema, job)).toBe(true);
  });

  it("rejects incomplete health responses", () => {
    expect(
      Value.Check(HealthResponseSchema, {
        version: HymuiVersion,
        state: "ready",
      }),
    ).toBe(false);
  });
});
