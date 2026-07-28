// src/index.ts
var editions = /* @__PURE__ */ new Set(["local", "self-hosted", "hosted"]);
var modes = /* @__PURE__ */ new Set(["development", "test", "local", "self-hosted", "hosted"]);
var databaseDrivers = /* @__PURE__ */ new Set([
  "pglite",
  "postgresql",
  "mysql",
  "mariadb",
  "mssql"
]);
var storageDrivers = /* @__PURE__ */ new Set(["filesystem", "gcs", "s3"]);
function parseEnum(name, value, fallback, allowed) {
  const candidate = value ?? fallback;
  if (!allowed.has(candidate)) {
    throw new Error(`${name} must be one of: ${[...allowed].join(", ")}`);
  }
  return candidate;
}
function parsePort(name, value, fallback) {
  if (value === void 0) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${name} must be an integer between 0 and 65535`);
  }
  return port;
}
function loadRuntimeConfig(service, env = process.env) {
  const nodeMode = env.NODE_ENV === "test" ? "test" : "development";
  const mode = parseEnum("HYMUI_MODE", env.HYMUI_MODE, nodeMode, modes);
  const edition = parseEnum("HYMUI_EDITION", env.HYMUI_EDITION, "local", editions);
  const apiHost = env.HYMUI_API_HOST ?? "127.0.0.1";
  const apiPort = parsePort("HYMUI_API_PORT", env.HYMUI_API_PORT, 4e3);
  const apiUrl = env.HYMUI_API_URL ?? `http://${apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost}:${apiPort}`;
  const databaseDriver = parseEnum(
    "HYMUI_DATABASE_DRIVER",
    env.HYMUI_DATABASE_DRIVER,
    edition === "local" ? "pglite" : "postgresql",
    databaseDrivers
  );
  const storageDriver = parseEnum(
    "HYMUI_STORAGE_DRIVER",
    env.HYMUI_STORAGE_DRIVER,
    edition === "local" ? "filesystem" : edition === "hosted" ? "gcs" : "s3",
    storageDrivers
  );
  const workerHost = env.HYMUI_WORKER_HOST ?? "127.0.0.1";
  const workerPort = parsePort("HYMUI_WORKER_PORT", env.HYMUI_WORKER_PORT, 4001);
  const workerUrl = env.HYMUI_WORKER_URL ?? `http://${workerHost === "0.0.0.0" ? "127.0.0.1" : workerHost}:${workerPort}`;
  const internalToken = env.HYMUI_INTERNAL_TOKEN ?? (edition === "local" ? "hymui-local-development-token" : void 0);
  try {
    new URL(apiUrl);
    new URL(workerUrl);
  } catch {
    throw new Error("HYMUI_API_URL and HYMUI_WORKER_URL must be valid absolute URLs");
  }
  if (!internalToken || internalToken.length < 24) {
    throw new Error("HYMUI_INTERNAL_TOKEN must contain at least 24 characters");
  }
  return Object.freeze({
    apiHost,
    apiPort,
    apiUrl,
    databaseDriver,
    databaseUrl: env.HYMUI_DATABASE_URL,
    edition,
    internalToken,
    mode,
    service,
    storageDriver,
    storagePath: env.HYMUI_STORAGE_PATH,
    workerHost,
    workerPort,
    workerUrl
  });
}
export {
  loadRuntimeConfig
};
