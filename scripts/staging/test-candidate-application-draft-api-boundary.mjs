import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webDirectory = path.resolve(root, "apps/web");
const baseUrl = "http://127.0.0.1:3000";
const validApplicationId = "11111111-1111-4111-8111-111111111111";

const server = spawn(process.execPath, [
  path.resolve(webDirectory, "node_modules/next/dist/bin/next"),
  "start", "-H", "127.0.0.1", "-p", "3000"
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
    if (server.exitCode !== null) throw new Error("Next.js API-boundary test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/api/candidate/application-draft?application_id=invalid");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js API-boundary test server did not become ready.\n" + serverOutput);

  const invalidId = await fetch(baseUrl + "/api/candidate/application-draft?application_id=not-a-uuid", {
    headers: { Authorization: "Bearer ci-test-token" }
  });
  assert.equal(invalidId.status, 400, "GET must reject malformed application identifiers before upstream access.");
  assert.equal((await invalidId.json()).code, "APPLICATION_ID_INVALID");

  const missingAuthGet = await fetch(baseUrl + "/api/candidate/application-draft?application_id=" + validApplicationId);
  assert.equal(missingAuthGet.status, 401, "GET must require a bearer token.");
  assert.equal((await missingAuthGet.json()).code, "AUTHENTICATION_REQUIRED");

  const missingAuthPost = await fetch(baseUrl + "/api/candidate/application-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      application_id: validApplicationId,
      answer_data: { motivation_statement: "CI must not persist this" },
      expected_version: 0,
      idempotency_key: "ci-boundary-test-0001"
    })
  });
  assert.equal(missingAuthPost.status, 401, "POST must require a bearer token before RPC invocation.");
  assert.equal((await missingAuthPost.json()).code, "AUTHENTICATION_REQUIRED");

  const wrongContentType = await fetch(baseUrl + "/api/candidate/application-draft", {
    method: "POST",
    headers: { Authorization: "Bearer ci-test-token", "Content-Type": "text/plain" },
    body: "{"
  });
  assert.equal(wrongContentType.status, 415, "POST must reject non-JSON content types.");
  assert.equal((await wrongContentType.json()).code, "JSON_CONTENT_TYPE_REQUIRED");

  const invalidJson = await fetch(baseUrl + "/api/candidate/application-draft", {
    method: "POST",
    headers: { Authorization: "Bearer ci-test-token", "Content-Type": "application/json" },
    body: "{not-json"
  });
  assert.equal(invalidJson.status, 400, "POST must reject malformed JSON without invoking the upstream RPC.");
  assert.equal((await invalidJson.json()).code, "INVALID_JSON");

  const missingFields = await fetch(baseUrl + "/api/candidate/application-draft", {
    method: "POST",
    headers: { Authorization: "Bearer ci-test-token", "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: validApplicationId, answer_data: {} })
  });
  assert.equal(missingFields.status, 400, "POST must validate version and idempotency fields.");
  assert.equal((await missingFields.json()).code, "APPLICATION_DRAFT_INPUT_INVALID");

  for (const response of [invalidId, missingAuthGet, missingAuthPost, wrongContentType, invalidJson, missingFields]) {
    assert.match(response.headers.get("cache-control") || "", /no-store/i,
      "Candidate draft responses must not be cacheable.");
    assert.match(response.headers.get("vary") || "", /authorization/i,
      "Candidate draft responses must vary by authorization.");
  }

  console.log("PASS: candidate draft GET rejects invalid IDs and missing bearer authentication.");
  console.log("PASS: candidate draft POST rejects missing authentication, wrong content type, malformed JSON and invalid fields.");
  console.log("PASS: boundary errors are no-store and vary by Authorization; no real Supabase request is made.");
} finally {
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
