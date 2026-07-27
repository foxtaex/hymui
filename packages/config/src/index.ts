import type { Edition, RuntimeMode } from "@hymui/contracts";

export type ServiceName = "api" | "worker";
export type DatabaseDriver = "pglite" | "postgresql" | "mysql" | "mariadb" | "mssql";
export type StorageDriver = "filesystem" | "gcs" | "s3";

export interface RuntimeConfig {
  readonly apiHost: string;
  readonly apiPort: number;
  readonly apiUrl: string;
  readonly databaseDriver: DatabaseDriver;
  readonly databaseUrl: string | undefined;
  readonly edition: Edition;
  readonly internalToken: string;
  readonly mode: RuntimeMode;
  readonly service: ServiceName;
  readonly storageDriver: StorageDriver;
  readonly storagePath: string | undefined;
  readonly workerHost: string;
  readonly workerPort: number;
  readonly workerUrl: string;
}

const editions = new Set<Edition>(["local", "self-hosted", "hosted"]);
const modes = new Set<RuntimeMode>(["development", "test", "local", "self-hosted", "hosted"]);
const databaseDrivers = new Set<DatabaseDriver>([
  "pglite",
  "postgresql",
  "mysql",
  "mariadb",
  "mssql",
]);
const storageDrivers = new Set<StorageDriver>(["filesystem", "gcs", "s3"]);

function parseEnum<T extends string>(
  name: string,
  value: string | undefined,
  fallback: T,
  allowed: ReadonlySet<T>,
): T {
  const candidate = (value ?? fallback) as T;
  if (!allowed.has(candidate)) {
    throw new Error(`${name} must be one of: ${[...allowed].join(", ")}`);
  }
  return candidate;
}

function parsePort(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`${name} must be an integer between 0 and 65535`);
  }
  return port;
}

export function loadRuntimeConfig(
  service: ServiceName,
  env: Readonly<Record<string, string | undefined>> = process.env,
): RuntimeConfig {
  const nodeMode = env.NODE_ENV === "test" ? "test" : "development";
  const mode = parseEnum("HYMUI_MODE", env.HYMUI_MODE, nodeMode, modes);
  const edition = parseEnum("HYMUI_EDITION", env.HYMUI_EDITION, "local", editions);
  const apiHost = env.HYMUI_API_HOST ?? "127.0.0.1";
  const apiPort = parsePort("HYMUI_API_PORT", env.HYMUI_API_PORT, 4000);
  const apiUrl =
    env.HYMUI_API_URL ?? `http://${apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost}:${apiPort}`;
  const databaseDriver = parseEnum(
    "HYMUI_DATABASE_DRIVER",
    env.HYMUI_DATABASE_DRIVER,
    edition === "local" ? "pglite" : "postgresql",
    databaseDrivers,
  );
  const storageDriver = parseEnum(
    "HYMUI_STORAGE_DRIVER",
    env.HYMUI_STORAGE_DRIVER,
    edition === "local" ? "filesystem" : edition === "hosted" ? "gcs" : "s3",
    storageDrivers,
  );
  const workerHost = env.HYMUI_WORKER_HOST ?? "127.0.0.1";
  const workerPort = parsePort("HYMUI_WORKER_PORT", env.HYMUI_WORKER_PORT, 4001);
  const workerUrl =
    env.HYMUI_WORKER_URL ??
    `http://${workerHost === "0.0.0.0" ? "127.0.0.1" : workerHost}:${workerPort}`;
  const internalToken =
    env.HYMUI_INTERNAL_TOKEN ?? (edition === "local" ? "hymui-local-development-token" : undefined);

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
    workerUrl,
  });
}
