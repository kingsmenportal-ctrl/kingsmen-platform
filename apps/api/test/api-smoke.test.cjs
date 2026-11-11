const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");

// Keep smoke tests isolated from any developer or hosted database credentials.
for (const key of ["DATABASE_URL", "SUPABASE_DB_URL", "PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
  delete process.env[key];
}

const { createKingsmenApiServer } = require("../dist/server.js");
let server;
let baseUrl;

before(async () => {
  server = createKingsmenApiServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("health endpoint reports service health and routes", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "kingsmen-api");
  assert.ok(body.routes.includes("POST /api/commands"));
});

test("safe command is accepted and repeated idempotency key replays", async () => {
  const key = `smoke-${Date.now()}-${Math.random()}`;
  const payload = {
    commandId: `cmd-${key}`,
    commandType: "system.health.requested",
    idempotencyKey: key,
    correlationId: `corr-${key}`,
    actor: { type: "system", id: "ci-smoke-test" },
    source: "api",
    createdAt: new Date().toISOString(),
    payload: {}
  };

  const first = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(first.status, 202);
  assert.equal((await first.json()).status, "ACCEPTED");

  const replay = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, commandId: `different-${key}` })
  });
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).status, "IDEMPOTENT_REPLAY");
});

test("sensitive command is accepted only into approval-pending state", async () => {
  const key = `approval-${Date.now()}-${Math.random()}`;
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      commandId: `cmd-${key}`,
      commandType: "application.execute.requested",
      idempotencyKey: key,
      correlationId: `corr-${key}`,
      actor: { type: "candidate", id: "ci-smoke-candidate" },
      source: "api",
      createdAt: new Date().toISOString(),
      payload: {}
    })
  });
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.status, "PENDING_APPROVAL");
  assert.equal(body.policy.requiresApproval, true);
});

test("malformed command is rejected with a client error", async () => {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ commandId: "incomplete" })
  });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).ok, false);
});
