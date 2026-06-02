#!/usr/bin/env node
import { createFreeDestinyMapBackendLocalServer } from "./free-destiny-map-backend-local-runtime.mjs";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3001);
const repoRoot = process.cwd();

const server = createFreeDestinyMapBackendLocalServer({
  repoRoot,
  enableLocalWrite: process.env.KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE === "true"
});

server.listen(port, host, () => {
  console.log(
    JSON.stringify({
      schema: "kingsmen.backend-local-server-started.v1",
      module: "BATCH 19 - Docker / Oracle Lite Local Runtime Container Preparation",
      productionReady: false,
      canClaimProduction: false,
      deployedToOracle: false,
      host,
      port,
      healthEndpoint: "/health",
      intakeEndpoint: "/api/public/free-destiny-map/intake/local",
      safeNotice:
        "Backend local runtime boundary server. No Oracle deployment, no payment, no email, no document upload, no official application submission."
    })
  );
});

function shutdown(signal) {
  console.log(
    JSON.stringify({
      schema: "kingsmen.backend-local-server-shutdown.v1",
      signal,
      productionReady: false,
      deployedToOracle: false
    })
  );

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
