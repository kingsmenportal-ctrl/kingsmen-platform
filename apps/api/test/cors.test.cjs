const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

process.env.KINGSMEN_TRUTH_VAULT_MODE = "memory";
process.env.KINGSMEN_API_CORS_ORIGIN = "https://portal.example.test";

const { createKingsmenApiServer } = require("../dist/server.js");
const server = createKingsmenApiServer();

let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port.");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("trusted origin receives exact CORS response headers", async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { origin: "https://portal.example.test" }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://portal.example.test");
  assert.equal(response.headers.get("vary"), "Origin");
});

test("untrusted origin receives no CORS permission", async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { origin: "https://attacker.example.test" }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("trusted preflight is accepted", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "OPTIONS",
    headers: { origin: "https://portal.example.test", "access-control-request-method": "POST" }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://portal.example.test");
});

test("untrusted preflight is rejected", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "OPTIONS",
    headers: { origin: "https://attacker.example.test", "access-control-request-method": "POST" }
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("preflight without an Origin is rejected", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, { method: "OPTIONS" });
  assert.equal(response.status, 403);
});

test("health alias reports explicit development-only storage mode", async () => {
  const response = await fetch(`${baseUrl}/api/system/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "kingsmen-api");
  assert.equal(body.storageMode, "memory_development_only");
  assert.equal(body.truthVault.ok, true);
  assert.match(body.truthVault.message, /memory-only development mode/i);
});

test("unknown API route returns structured 404", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-real-route`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, "ROUTE_NOT_FOUND");
});

test("health response identifies the Kingsmen service", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.headers.get("x-kingsmen-service"), "kingsmen-api");
  const body = await response.json();
  assert.equal(body.routes.includes("POST /api/commands"), true);
  assert.equal(body.routes.includes("POST /api/workflow/result"), true);
});

test("malformed JSON returns a client error instead of an internal server error", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{ definitely not json"
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, "INVALID_JSON");
});

test("request body limit is enforced in bytes and returns structured 413", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "x".repeat(1_000_001)
  });
  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, "REQUEST_BODY_TOO_LARGE");
});

test("multibyte request content cannot bypass the byte limit", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "€".repeat(400_001)
  });
  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.code, "REQUEST_BODY_TOO_LARGE");
});


test("production persistence mode fails closed without database URL", () => {
  const child = spawnSync(process.execPath, [path.resolve(__dirname, "../dist/server.js")], {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      KINGSMEN_TRUTH_VAULT_MODE: "postgres",
      KINGSMEN_DATABASE_URL: "",
      DATABASE_URL: "",
      PORT: "0"
    }
  });
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /requires KINGSMEN_DATABASE_URL or DATABASE_URL/i);
});
