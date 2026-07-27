import { describe, expect, it } from "vitest";

import { resolveCorrelationId } from "./index.js";

describe("correlation IDs", () => {
  it("keeps an incoming valid identifier", () => {
    const id = "38b9efb7-a40c-474b-b89a-24051418905f";
    expect(resolveCorrelationId(id)).toBe(id);
  });

  it("creates an identifier when input is invalid", () => {
    expect(resolveCorrelationId("not-an-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
