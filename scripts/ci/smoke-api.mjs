#!/usr/bin/env node
import { spawn } from "node:child_process";

const port = Number(process.env.PORT ?? 4387);
const host = process.env.KINGSMEN_API_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const child = spawn(process.execPath, ["apps/api/dist/server.js"], {
  env: {
    ...process.env,
    PORT: String(port),
    KINGSMEN_API_HOST: host,
    KINGSMEN_TRUTH_VAULT_MODE: "memory_development_only"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "not attempted";

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited early (code ${child.exitCode}).\n${output}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return response;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`API did not become healthy: ${lastError}.\n${output}`);
}

async function checkHealth(path) {
  const response = path === "/health"
    ? await waitForServer()
    : await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(3000) });
  assert(response.status === 200, `${path} returned HTTP ${response.status}`);

  const body = await response.json();
  assert(body.ok === true, `${path} did not return ok=true`);
  assert(body.service === "kingsmen-api", `${path} returned unexpected service identity`);
  assert(body.status === "healthy", `${path} returned unexpected health status`);
  assert(body.storageMode === "memory_development_only", `${path} did not declare isolated in-memory test mode`);
  assert(Array.isArray(body.routes) && body.routes.includes("GET /health"), `${path} omitted the health route contract`);

  console.log(JSON.stringify({
    check: "http_health_smoke",
    path,
    status: response.status,
    service: body.service,
    health: body.status,
    storageMode: body.storageMode,
    passed: true
  }));
}

try {
  await checkHealth("/health");
  await checkHealth("/api/system/health");

  const missing = await fetch(`${baseUrl}/__release_smoke_unknown_route__`, {
    signal: AbortSignal.timeout(3000)
  });
  assert(missing.status === 404, `unknown route should return 404, received ${missing.status}`);

  console.log(JSON.stringify({
    check: "unknown_route_contract",
    status: missing.status,
    passed: true
  }));
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
} finally {
  if (child.exitCode === null && !child.killed) {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}
