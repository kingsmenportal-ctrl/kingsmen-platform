import { createWorkerRunnerFromEnvironment } from "./worker-runner";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const intervalMs = Math.min(30_000, Math.max(1_000, Number(process.env.KINGSMEN_WORKER_POLL_MS ?? 5_000)));
const batchSize = Math.min(10, Math.max(1, Number(process.env.KINGSMEN_WORKER_BATCH_SIZE ?? 1)));
let stopping = false;

async function main(): Promise<void> {
  const runner = createWorkerRunnerFromEnvironment();
  const stop = () => { stopping = true; };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  console.log(JSON.stringify({ service: "kingsmen-n16-worker", event: "worker_started", pid: process.pid, intervalMs, batchSize, at: new Date().toISOString() }));
  try {
    while (!stopping) {
      try {
        const recovery = await runner.recover();
        const run = await runner.runOnce(batchSize);
        console.log(JSON.stringify({ service: "kingsmen-n16-worker", event: "worker_cycle", recovery, run, at: new Date().toISOString() }));
      } catch (error) {
        console.error(JSON.stringify({ service: "kingsmen-n16-worker", event: "cycle_failed", errorCode: error instanceof Error ? error.name : "UNKNOWN", at: new Date().toISOString() }));
      }
      if (!stopping) await sleep(intervalMs);
    }
  } finally {
    await runner.close();
    console.log(JSON.stringify({ service: "kingsmen-n16-worker", event: "worker_stopped", at: new Date().toISOString() }));
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ service: "kingsmen-n16-worker", event: "worker_fatal", errorCode: error instanceof Error ? error.message : "UNKNOWN" }));
  process.exitCode = 1;
});
