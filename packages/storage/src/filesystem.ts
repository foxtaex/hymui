import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  StorageError,
  type ObjectMetadata,
  type ObjectStorage,
  type PutObjectInput,
  type SignedAccess,
} from "./contracts.js";

export interface FilesystemStorageOptions {
  readonly clock?: () => Date;
  readonly rootDirectory: string;
}

interface StoredMetadata {
  readonly byteLength: number;
  readonly checksum: string;
  readonly contentType: string;
  readonly createdAt: string;
  readonly key: string;
  readonly version: 1;
}

interface ObjectPaths {
  readonly data: string;
  readonly directory: string;
  readonly metadata: string;
}

const checksumPattern = /^sha256:[0-9a-f]{64}$/;

function isNodeError(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { readonly code?: string }).code === code
  );
}

function validateKey(key: string): void {
  const containsControlCharacter = [...key].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
  if (!key || key.length > 1_024 || containsControlCharacter) {
    throw new StorageError("OBJECT_KEY_INVALID", "Object key is invalid.");
  }
}

function objectPaths(rootDirectory: string, key: string): ObjectPaths {
  validateKey(key);
  const digest = createHash("sha256").update(key, "utf8").digest("hex");
  const directory = resolve(rootDirectory, "objects", digest.slice(0, 2), digest.slice(2, 4));
  return {
    data: resolve(directory, `${digest}.data`),
    directory,
    metadata: resolve(directory, `${digest}.json`),
  };
}

function parseMetadata(value: unknown, expectedKey: string): ObjectMetadata {
  if (typeof value !== "object" || value === null) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata is invalid.");
  }
  const candidate = value as Partial<StoredMetadata>;
  const createdAt = new Date(candidate.createdAt ?? "");
  if (
    candidate.version !== 1 ||
    candidate.key !== expectedKey ||
    typeof candidate.byteLength !== "number" ||
    !Number.isSafeInteger(candidate.byteLength) ||
    candidate.byteLength < 0 ||
    typeof candidate.checksum !== "string" ||
    !checksumPattern.test(candidate.checksum) ||
    typeof candidate.contentType !== "string" ||
    !candidate.contentType ||
    Number.isNaN(createdAt.getTime())
  ) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata is invalid.");
  }
  return {
    byteLength: candidate.byteLength,
    checksum: candidate.checksum,
    contentType: candidate.contentType,
    createdAt,
    key: expectedKey,
  };
}

async function readMetadata(path: string, key: string): Promise<ObjectMetadata | null> {
  try {
    return parseMetadata(JSON.parse(await readFile(path, "utf8")) as unknown, key);
  } catch (error) {
    if (isNodeError(error, "ENOENT")) return null;
    if (error instanceof StorageError) throw error;
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata could not be read.");
  }
}

function storageFailure(error: unknown, message: string): never {
  if (error instanceof StorageError) throw error;
  throw new StorageError("STORAGE_UNAVAILABLE", message);
}

async function* verifiedBody(
  path: string,
  metadata: ObjectMetadata,
): AsyncGenerator<Uint8Array, void, undefined> {
  const hash = createHash("sha256");
  let byteLength = 0;
  try {
    for await (const chunk of createReadStream(path)) {
      const bytes = chunk as Buffer;
      hash.update(bytes);
      byteLength += bytes.byteLength;
      yield new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
  } catch (error) {
    if (isNodeError(error, "ENOENT")) {
      throw new StorageError("OBJECT_NOT_FOUND", "Object content was not found.");
    }
    storageFailure(error, "Object content could not be read.");
  }

  const checksum = `sha256:${hash.digest("hex")}`;
  if (checksum !== metadata.checksum || byteLength !== metadata.byteLength) {
    throw new StorageError("OBJECT_CHECKSUM_MISMATCH", "Object integrity verification failed.");
  }
}

export async function createFilesystemObjectStorage(
  options: FilesystemStorageOptions,
): Promise<ObjectStorage> {
  if (!options.rootDirectory.trim()) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Filesystem storage root is required.");
  }
  const rootDirectory = resolve(options.rootDirectory);
  const clock = options.clock ?? (() => new Date());

  try {
    await mkdir(resolve(rootDirectory, "objects"), { mode: 0o700, recursive: true });
    await access(rootDirectory, constants.R_OK | constants.W_OK);
  } catch (error) {
    storageFailure(error, "Filesystem storage root is unavailable.");
  }

  return {
    kind: "filesystem",

    async delete(key: string): Promise<void> {
      const paths = objectPaths(rootDirectory, key);
      try {
        await Promise.all([rm(paths.data, { force: true }), rm(paths.metadata, { force: true })]);
      } catch (error) {
        storageFailure(error, "Object could not be deleted.");
      }
    },

    async get(
      key: string,
    ): Promise<{ body: AsyncIterable<Uint8Array>; metadata: ObjectMetadata } | null> {
      const paths = objectPaths(rootDirectory, key);
      const metadata = await readMetadata(paths.metadata, key);
      if (!metadata) return null;
      try {
        await access(paths.data, constants.R_OK);
      } catch (error) {
        if (isNodeError(error, "ENOENT")) {
          throw new StorageError("OBJECT_CHECKSUM_MISMATCH", "Object content is missing.");
        }
        storageFailure(error, "Object content is unavailable.");
      }
      return { body: verifiedBody(paths.data, metadata), metadata };
    },

    async put(input: PutObjectInput): Promise<ObjectMetadata> {
      const paths = objectPaths(rootDirectory, input.key);
      if (!input.contentType.trim()) {
        throw new StorageError("STORAGE_UNAVAILABLE", "Object content type is required.");
      }

      const temporaryId = randomUUID();
      const temporaryData = resolve(paths.directory, `.${temporaryId}.data.tmp`);
      const temporaryMetadata = resolve(paths.directory, `.${temporaryId}.json.tmp`);
      const hash = createHash("sha256");
      let byteLength = 0;
      const checksumTransform = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          hash.update(chunk);
          byteLength += chunk.byteLength;
          callback(null, chunk);
        },
      });

      try {
        await mkdir(paths.directory, { mode: 0o700, recursive: true });
        await pipeline(
          Readable.from(input.body),
          checksumTransform,
          createWriteStream(temporaryData, { flags: "wx", mode: 0o600 }),
        );

        const metadata: ObjectMetadata = {
          byteLength,
          checksum: `sha256:${hash.digest("hex")}`,
          contentType: input.contentType.trim(),
          createdAt: clock(),
          key: input.key,
        };
        const storedMetadata: StoredMetadata = {
          ...metadata,
          createdAt: metadata.createdAt.toISOString(),
          version: 1,
        };
        await writeFile(temporaryMetadata, `${JSON.stringify(storedMetadata)}\n`, {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        await rename(temporaryData, paths.data);
        await rename(temporaryMetadata, paths.metadata);
        return metadata;
      } catch (error) {
        await Promise.all([
          rm(temporaryData, { force: true }).catch(() => undefined),
          rm(temporaryMetadata, { force: true }).catch(() => undefined),
        ]);
        storageFailure(error, "Object could not be written.");
      }
    },

    async signedAccess(key: string, expiresAt: Date): Promise<SignedAccess | null> {
      void expiresAt;
      return (await readMetadata(objectPaths(rootDirectory, key).metadata, key))
        ? { kind: "unsupported" }
        : null;
    },

    async stat(key: string): Promise<ObjectMetadata | null> {
      return readMetadata(objectPaths(rootDirectory, key).metadata, key);
    },
  };
}
