import test from "node:test";
import assert from "node:assert/strict";
import { MAX_AUTH_REQUEST_BYTES, readAuthJson } from "./request-body";

function request(body: string, headers: Record<string, string> = { "content-type": "application/json" }) {
  return new Request("https://portal.example.test/api/auth/login", { method: "POST", headers, body });
}

test("parses a small JSON authentication payload", async () => {
  const result = await readAuthJson(request(JSON.stringify({ email: "person@example.test", password: "a-long-test-password" })));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal((result.value as { email: string }).email, "person@example.test");
});

test("rejects non-JSON auth payloads", async () => {
  const result = await readAuthJson(request("email=person", { "content-type": "application/x-www-form-urlencoded" }));
  assert.deepEqual(result, { ok: false, status: 415, code: "JSON_REQUIRED" });
});

test("rejects malformed JSON", async () => {
  const result = await readAuthJson(request("{broken"));
  assert.deepEqual(result, { ok: false, status: 400, code: "INVALID_JSON" });
});

test("rejects an oversized declared body before reading it", async () => {
  const result = await readAuthJson(request("{}", { "content-type": "application/json", "content-length": String(MAX_AUTH_REQUEST_BYTES + 1) }));
  assert.deepEqual(result, { ok: false, status: 413, code: "REQUEST_TOO_LARGE" });
});

test("rejects an oversized streamed body even without a content-length header", async () => {
  const payload = JSON.stringify({ password: "x".repeat(MAX_AUTH_REQUEST_BYTES + 100) });
  const result = await readAuthJson(request(payload, { "content-type": "application/json" }));
  assert.deepEqual(result, { ok: false, status: 413, code: "REQUEST_TOO_LARGE" });
});
