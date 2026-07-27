import { describe, expect, it } from "vitest";

import { loadRuntimeConfig } from "./index.js";

describe("runtime configuration", () => {
  it("starts Local development without cloud configuration", () => {
    expect(loadRuntimeConfig("api", {})).toMatchObject({
      apiPort: 4000,
      edition: "local",
      mode: "development",
      service: "api",
      workerPort: 4001,
    });
  });

  it("rejects invalid ports before startup", () => {
    expect(() => loadRuntimeConfig("worker", { HYMUI_WORKER_PORT: "90000" })).toThrow(
      "HYMUI_WORKER_PORT",
    );
  });

  it("rejects unknown editions", () => {
    expect(() => loadRuntimeConfig("api", { HYMUI_EDITION: "enterprise" })).toThrow(
      "HYMUI_EDITION",
    );
  });
});
