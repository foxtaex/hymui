import { loadRuntimeConfig } from "@hymui/config";

import { buildApiApp } from "./app.js";

const config = loadRuntimeConfig("api");
const app = await buildApiApp({ config });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Stopping Hymui API");
  await app.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.apiHost, port: config.apiPort });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
