import test from "node:test";
import assert from "node:assert/strict";
import { createKingsmenApiServer } from "./server";

test("candidate and application read routes fail closed without ownership authorization", async (t) => {
  const server = createKingsmenApiServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  for (const path of [
    "/api/candidates/candidate-synthetic-001/status",
    "/api/applications/application-synthetic-001/workbench",
    "/api/candidate/documents",
    "/api/candidate/document-requests"
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 503, path);
    const body = await response.json() as { ok?: boolean; code?: string; error?: string; message?: string };
    assert.equal(body.ok, false, path);
    assert.equal(body.code, "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED", path);
    assert.doesNotMatch(JSON.stringify(body), /unknown@example\.invalid|displayName|outstandingAmountCents/i, path);
  }
});
