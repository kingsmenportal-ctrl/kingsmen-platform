const test = require("node:test");
const assert = require("node:assert/strict");
const { createKingsmenApiServer } = require("../dist/server.js");

test("API CORS rejects arbitrary origins and allows the local development origin", async (t) => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousCors = process.env.KINGSMEN_API_CORS_ORIGIN;
  process.env.NODE_ENV = "development";
  delete process.env.KINGSMEN_API_CORS_ORIGIN;

  const server = createKingsmenApiServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousCors === undefined) delete process.env.KINGSMEN_API_CORS_ORIGIN;
    else process.env.KINGSMEN_API_CORS_ORIGIN = previousCors;
  });

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/commands`;
  const hostile = await fetch(url, { method: "OPTIONS", headers: { origin: "https://attacker.example" } });
  assert.equal(hostile.status, 204);
  assert.equal(hostile.headers.get("access-control-allow-origin"), null);

  const local = await fetch(url, { method: "OPTIONS", headers: { origin: "http://localhost:3000" } });
  assert.equal(local.status, 204);
  assert.equal(local.headers.get("access-control-allow-origin"), "http://localhost:3000");
});
