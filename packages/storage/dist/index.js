// src/contracts.ts
var StorageError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "StorageError";
  }
  code;
};

// src/filesystem.ts
import { createHash, randomUUID } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { access, mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { constants } from "fs";
import { resolve } from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
var checksumPattern = /^sha256:[0-9a-f]{64}$/;
function isNodeError(error, code) {
  return error instanceof Error && "code" in error && error.code === code;
}
function validateKey(key) {
  const containsControlCharacter = [...key].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== void 0 && (codePoint <= 31 || codePoint === 127);
  });
  if (!key || key.length > 1024 || containsControlCharacter) {
    throw new StorageError("OBJECT_KEY_INVALID", "Object key is invalid.");
  }
}
function objectPaths(rootDirectory, key) {
  validateKey(key);
  const digest = createHash("sha256").update(key, "utf8").digest("hex");
  const directory = resolve(rootDirectory, "objects", digest.slice(0, 2), digest.slice(2, 4));
  return {
    data: resolve(directory, `${digest}.data`),
    directory,
    metadata: resolve(directory, `${digest}.json`)
  };
}
function parseMetadata(value, expectedKey) {
  if (typeof value !== "object" || value === null) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata is invalid.");
  }
  const candidate = value;
  const createdAt = new Date(candidate.createdAt ?? "");
  if (candidate.version !== 1 || candidate.key !== expectedKey || typeof candidate.byteLength !== "number" || !Number.isSafeInteger(candidate.byteLength) || candidate.byteLength < 0 || typeof candidate.checksum !== "string" || !checksumPattern.test(candidate.checksum) || typeof candidate.contentType !== "string" || !candidate.contentType || Number.isNaN(createdAt.getTime())) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata is invalid.");
  }
  return {
    byteLength: candidate.byteLength,
    checksum: candidate.checksum,
    contentType: candidate.contentType,
    createdAt,
    key: expectedKey
  };
}
async function readMetadata(path, key) {
  try {
    return parseMetadata(JSON.parse(await readFile(path, "utf8")), key);
  } catch (error) {
    if (isNodeError(error, "ENOENT")) return null;
    if (error instanceof StorageError) throw error;
    throw new StorageError("STORAGE_UNAVAILABLE", "Object metadata could not be read.");
  }
}
function storageFailure(error, message) {
  if (error instanceof StorageError) throw error;
  throw new StorageError("STORAGE_UNAVAILABLE", message);
}
async function* verifiedBody(path, metadata) {
  const hash = createHash("sha256");
  let byteLength = 0;
  try {
    for await (const chunk of createReadStream(path)) {
      const bytes = chunk;
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
async function createFilesystemObjectStorage(options) {
  if (!options.rootDirectory.trim()) {
    throw new StorageError("STORAGE_UNAVAILABLE", "Filesystem storage root is required.");
  }
  const rootDirectory = resolve(options.rootDirectory);
  const clock = options.clock ?? (() => /* @__PURE__ */ new Date());
  try {
    await mkdir(resolve(rootDirectory, "objects"), { mode: 448, recursive: true });
    await access(rootDirectory, constants.R_OK | constants.W_OK);
  } catch (error) {
    storageFailure(error, "Filesystem storage root is unavailable.");
  }
  return {
    kind: "filesystem",
    async delete(key) {
      const paths = objectPaths(rootDirectory, key);
      try {
        await Promise.all([rm(paths.data, { force: true }), rm(paths.metadata, { force: true })]);
      } catch (error) {
        storageFailure(error, "Object could not be deleted.");
      }
    },
    async get(key) {
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
    async put(input) {
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
        transform(chunk, _encoding, callback) {
          hash.update(chunk);
          byteLength += chunk.byteLength;
          callback(null, chunk);
        }
      });
      try {
        await mkdir(paths.directory, { mode: 448, recursive: true });
        await pipeline(
          Readable.from(input.body),
          checksumTransform,
          createWriteStream(temporaryData, { flags: "wx", mode: 384 })
        );
        const metadata = {
          byteLength,
          checksum: `sha256:${hash.digest("hex")}`,
          contentType: input.contentType.trim(),
          createdAt: clock(),
          key: input.key
        };
        const storedMetadata = {
          ...metadata,
          createdAt: metadata.createdAt.toISOString(),
          version: 1
        };
        await writeFile(temporaryMetadata, `${JSON.stringify(storedMetadata)}
`, {
          encoding: "utf8",
          flag: "wx",
          mode: 384
        });
        await rename(temporaryData, paths.data);
        await rename(temporaryMetadata, paths.metadata);
        return metadata;
      } catch (error) {
        await Promise.all([
          rm(temporaryData, { force: true }).catch(() => void 0),
          rm(temporaryMetadata, { force: true }).catch(() => void 0)
        ]);
        storageFailure(error, "Object could not be written.");
      }
    },
    async signedAccess(key, expiresAt) {
      void expiresAt;
      return await readMetadata(objectPaths(rootDirectory, key).metadata, key) ? { kind: "unsupported" } : null;
    },
    async stat(key) {
      return readMetadata(objectPaths(rootDirectory, key).metadata, key);
    }
  };
}
export {
  StorageError,
  createFilesystemObjectStorage
};
