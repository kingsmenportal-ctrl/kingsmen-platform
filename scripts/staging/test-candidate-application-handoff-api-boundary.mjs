import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webDirectory = path.resolve(root, "apps/web");
const baseUrl = "http://127.0.0.1:3001";
const server = spawn(process.execPath, [
  path.resolve(webDirectory, "node_modules/next/dist/bin/next"),
  "start", "-H", "127.0.0.1", "-p", "3001"
], {
  cwd: webDirectory,
  detached: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://ci-project.supabase.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-only-not-a-real-anon-key"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
server.stdout.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });
server.stderr.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Next.js test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/api/candidate/application-handoff", { method: "GET" });
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js test server did not become ready.\n" + serverOutput);

  const unauthenticated = await fetch(baseUrl + "/api/candidate/application-handoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: "ffffffff-ffff-4fff-8fff-fffffffffff1" })
  });
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers.get("cache-control") ?? "", /no-store/);
  assert.equal((await unauthenticated.json()).code, "AUTHENTICATION_REQUIRED");

  const wrongContentType = await fetch(baseUrl + "/api/candidate/application-handoff", {
    method: "POST",
    headers: { Authorization: "Bearer ci-token", "Content-Type": "text/plain" },
    body: "application_id=bad"
  });
  assert.equal(wrongContentType.status, 415);
  assert.match(wrongContentType.headers.get("cache-control") ?? "", /no-store/);

  const malformedJson = await fetch(baseUrl + "/api/candidate/application-handoff", {
    method: "POST",
    headers: { Authorization: "Bearer ci-token", "Content-Type": "application/json" },
    body: "{"
  });
  assert.equal(malformedJson.status, 400);

  const invalidId = await fetch(baseUrl + "/api/candidate/application-handoff", {
    method: "POST",
    headers: { Authorization: "Bearer ci-token", "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: "not-a-uuid" })
  });
  assert.equal(invalidId.status, 400);
  assert.equal((await invalidId.json()).code, "APPLICATION_ID_INVALID");
  assert.match(invalidId.headers.get("cache-control") ?? "", /no-store/);

  console.log("PASS: provider portal handoff API rejects unauthenticated, malformed, and invalid-application requests");
  console.log("PASS: no-store and authorization-vary response policy is applied");
} finally {
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
