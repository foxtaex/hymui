import { describe, expect, it } from "vitest";

import { StorageError, type ObjectStorage } from "./index.js";

describe("object storage contracts", () => {
  it("keeps provider details behind the storage port", () => {
    const storage: Pick<ObjectStorage, "kind"> = { kind: "filesystem" };

    expect(storage.kind).toBe("filesystem");
  });

  it("uses stable errors at the storage boundary", () => {
    const error = new StorageError("OBJECT_NOT_FOUND", "Object was not found.");

    expect(error.code).toBe("OBJECT_NOT_FOUND");
    expect(error.name).toBe("StorageError");
  });
});
