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

test("configured API token protects application routes and rejects weak configuration", async () => {
  const previousToken = process.env.KINGSMEN_API_AUTH_TOKEN;
  const previousEnvironment = process.env.NODE_ENV;
  process.env.KINGSMEN_API_AUTH_TOKEN = "test-token-with-at-least-32-characters-long";
  process.env.NODE_ENV = "test";
  try {
    const denied = await fetch(`${baseUrl}/api/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const deniedBody = await denied.json();
    assert.equal(denied.status, 401);
    assert.equal(deniedBody.code, "UNAUTHORIZED");

    const allowed = await fetch(`${baseUrl}/api/commands`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-token-with-at-least-32-characters-long" },
      body: "{}"
    });
    assert.equal(allowed.status, 422);
  } finally {
    if (previousToken === undefined) delete process.env.KINGSMEN_API_AUTH_TOKEN;
    else process.env.KINGSMEN_API_AUTH_TOKEN = previousToken;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("staging refuses application requests when API authentication is not configured", async () => {
  const previousToken = process.env.KINGSMEN_API_AUTH_TOKEN;
  const previousEnvironment = process.env.NODE_ENV;
  delete process.env.KINGSMEN_API_AUTH_TOKEN;
  process.env.NODE_ENV = "staging";
  try {
    const response = await fetch(`${baseUrl}/api/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, "API_AUTH_NOT_CONFIGURED");
  } finally {
    if (previousToken === undefined) delete process.env.KINGSMEN_API_AUTH_TOKEN;
    else process.env.KINGSMEN_API_AUTH_TOKEN = previousToken;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
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
