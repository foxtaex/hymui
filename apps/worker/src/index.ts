import { loadRuntimeConfig } from "@hymui/config";

import { buildWorkerApp } from "./app.js";

const config = loadRuntimeConfig("worker");
const app = buildWorkerApp({
  apiBaseUrl: config.apiUrl,
  internalToken: config.internalToken,
});

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Stopping Hymui Worker");
  await app.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.workerHost, port: config.workerPort });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
