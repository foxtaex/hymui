import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createFilesystemObjectStorage, StorageError, type ObjectStorage } from "./index.js";

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "hymui-storage-"));
  temporaryRoots.push(root);
  return root;
}

async function* chunks(...values: string[]): AsyncGenerator<Uint8Array> {
  for (const value of values) yield new TextEncoder().encode(value);
}

async function collect(body: AsyncIterable<Uint8Array>): Promise<string> {
  const values: Uint8Array[] = [];
  for await (const value of body) values.push(value);
  const length = values.reduce((total, value) => total + value.byteLength, 0);
  const combined = new Uint8Array(length);
  let offset = 0;
  for (const value of values) {
    combined.set(value, offset);
    offset += value.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function dataPath(root: string, key: string): string {
  const digest = createHash("sha256").update(key, "utf8").digest("hex");
  return resolve(root, "objects", digest.slice(0, 2), digest.slice(2, 4), `${digest}.data`);
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

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

describe("filesystem object storage", () => {
  it("streams objects with durable metadata and a SHA-256 checksum", async () => {
    const root = await temporaryRoot();
    const createdAt = new Date("2026-07-28T12:00:00.000Z");
    const storage = await createFilesystemObjectStorage({
      clock: () => createdAt,
      rootDirectory: root,
    });

    const metadata = await storage.put({
      body: chunks("hello ", "Hymui"),
      contentType: "text/plain",
      key: "project/../../opaque-object-key",
    });

    expect(metadata).toEqual({
      byteLength: 11,
      checksum: `sha256:${createHash("sha256").update("hello Hymui").digest("hex")}`,
      contentType: "text/plain",
      createdAt,
      key: "project/../../opaque-object-key",
    });
    expect(await storage.stat(metadata.key)).toEqual(metadata);

    const stored = await storage.get(metadata.key);
    expect(stored?.metadata).toEqual(metadata);
    expect(stored && (await collect(stored.body))).toBe("hello Hymui");
  });

  it("detects content modified outside the storage adapter", async () => {
    const root = await temporaryRoot();
    const storage = await createFilesystemObjectStorage({ rootDirectory: root });
    const key = "tamper-proof-object";
    await storage.put({
      body: chunks("trusted"),
      contentType: "text/plain",
      key,
    });
    await writeFile(dataPath(root, key), "modified", "utf8");

    const stored = await storage.get(key);
    expect(stored).not.toBeNull();
    await expect(collect(stored!.body)).rejects.toMatchObject({
      code: "OBJECT_CHECKSUM_MISMATCH",
    });
  });

  it("deletes idempotently and reports signed access as unsupported", async () => {
    const storage = await createFilesystemObjectStorage({
      rootDirectory: await temporaryRoot(),
    });
    const key = "attachment";
    await storage.put({
      body: chunks("content"),
      contentType: "application/octet-stream",
      key,
    });

    expect(await storage.signedAccess(key, new Date(Date.now() + 60_000))).toEqual({
      kind: "unsupported",
    });
    await storage.delete(key);
    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
    expect(await storage.stat(key)).toBeNull();
    expect(await storage.signedAccess(key, new Date())).toBeNull();
  });

  it("cleans temporary files after a failed stream", async () => {
    const root = await temporaryRoot();
    const storage = await createFilesystemObjectStorage({ rootDirectory: root });
    async function* brokenBody(): AsyncGenerator<Uint8Array> {
      yield new TextEncoder().encode("partial");
      throw new Error("stream failed");
    }

    await expect(
      storage.put({
        body: brokenBody(),
        contentType: "text/plain",
        key: "retryable",
      }),
    ).rejects.toMatchObject({ code: "STORAGE_UNAVAILABLE" });
    expect(await storage.stat("retryable")).toBeNull();

    await storage.put({
      body: chunks("complete"),
      contentType: "text/plain",
      key: "retryable",
    });
    expect(await readFile(dataPath(root, "retryable"), "utf8")).toBe("complete");
  });

  it("rejects invalid object keys before touching the filesystem", async () => {
    const storage = await createFilesystemObjectStorage({
      rootDirectory: await temporaryRoot(),
    });

    await expect(storage.stat("")).rejects.toMatchObject({ code: "OBJECT_KEY_INVALID" });
    await expect(storage.delete("line\nbreak")).rejects.toMatchObject({
      code: "OBJECT_KEY_INVALID",
    });
  });
});
