const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
process.env.KINGSMEN_TRUTH_VAULT_MODE = "memory";
const { createKingsmenApiServer } = require("../dist/server");

let server;
let baseUrl;

before(async () => {
  server = createKingsmenApiServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("health endpoint reports liveness without exposing secrets", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.status, "healthy");
  assert.equal(typeof body.storageMode, "string");
  assert.equal(JSON.stringify(body).includes("DATABASE_URL"), false);
});

test("readiness refuses volatile memory storage", async () => {
  const response = await fetch(`${baseUrl}/ready`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.status, "not_ready");
  assert.equal(body.reason, "durable_truth_vault_disabled");
});

test("unknown routes return a structured 404", async () => {
  const response = await fetch(`${baseUrl}/not-a-real-route`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.ok, false);
  assert.equal(body.code, "ROUTE_NOT_FOUND");
});

test("oversized request bodies are rejected before command processing", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "1000001" },
    body: "x".repeat(1000001)
  });
  const body = await response.json();
  assert.equal(response.status, 413);
  assert.equal(body.ok, false);
  assert.equal(body.code, "KINGSMEN_API_ERROR");
});
