import { createServer } from "node:http";
import { createWorkerRunnerFromEnvironment } from "./worker-runner";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const intervalMs = Math.min(30_000, Math.max(1_000, Number(process.env.KINGSMEN_WORKER_POLL_MS ?? 5_000)));
const batchSize = Math.min(4, Math.max(1, Number(process.env.KINGSMEN_WORKER_BATCH_SIZE ?? 1)));
const healthPort = Number(process.env.KINGSMEN_WORKER_HEALTH_PORT ?? 8081);
let stopping = false;
let ready = false;
let lastSuccessfulCycleAt: string | null = null;

if (!Number.isInteger(healthPort) || healthPort < 1024 || healthPort > 65535) {
  throw new Error("N16_WORKER_HEALTH_PORT_INVALID");
}

async function main(): Promise<void> {
  const runner = createWorkerRunnerFromEnvironment();
  const healthServer = createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/healthz") {
      response.statusCode = 404;
      response.end();
      return;
    }
    response.statusCode = ready && !stopping ? 200 : 503;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    response.end(JSON.stringify({
      service: "kingsmen-n16-playwright-worker",
      status: ready && !stopping ? "ready" : "not_ready",
      lastSuccessfulCycleAt
    }));
  });

  await new Promise<void>((resolve, reject) => {
    healthServer.once("error", reject);
    healthServer.listen(healthPort, "127.0.0.1", () => resolve());
  });

  const stop = () => { stopping = true; ready = false; };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  console.log(JSON.stringify({
    service: "kingsmen-n16-playwright-worker",
    event: "worker_started",
    pid: process.pid,
    intervalMs,
    batchSize,
    healthPort: "loopback_only",
    browserAutomationEnabled: process.env.KINGSMEN_BROWSER_AUTOMATION_ENABLED === "true",
    at: new Date().toISOString()
  }));

  try {
    while (!stopping) {
      try {
        await runner.health();
        const recovery = await runner.recover();
        const run = await runner.runOnce(batchSize);
        ready = true;
        lastSuccessfulCycleAt = new Date().toISOString();
        console.log(JSON.stringify({
          service: "kingsmen-n16-playwright-worker",
          event: "worker_cycle",
          recovery,
          run,
          at: lastSuccessfulCycleAt
        }));
      } catch (error) {
        ready = false;
        console.error(JSON.stringify({
          service: "kingsmen-n16-playwright-worker",
          event: "cycle_failed",
          errorCode: error instanceof Error ? error.name : "UNKNOWN",
          at: new Date().toISOString()
        }));
      }
      if (!stopping) await sleep(intervalMs);
    }
  } finally {
    ready = false;
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    await runner.close();
    console.log(JSON.stringify({
      service: "kingsmen-n16-playwright-worker",
      event: "worker_stopped",
      at: new Date().toISOString()
    }));
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({
    service: "kingsmen-n16-playwright-worker",
    event: "worker_fatal",
    errorCode: error instanceof Error ? error.message : "UNKNOWN"
  }));
  process.exitCode = 1;
});
