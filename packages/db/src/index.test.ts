import { describe, expect, it } from "vitest";

import { PersistenceError, type HymuiDatabase } from "./index.js";

describe("database persistence contracts", () => {
  it("keeps database capabilities provider-neutral", () => {
    const database: Pick<HymuiDatabase, "kind" | "close"> = {
      close: async () => undefined,
      kind: "pglite",
    };

    expect(database.kind).toBe("pglite");
  });

  it("uses stable errors at the persistence boundary", () => {
    const error = new PersistenceError("MIGRATION_CONFLICT", "Migration checksum changed.");

    expect(error.code).toBe("MIGRATION_CONFLICT");
    expect(error.name).toBe("PersistenceError");
  });
});
