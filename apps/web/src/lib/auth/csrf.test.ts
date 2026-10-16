import test from "node:test";
import assert from "node:assert/strict";
import { isSameOriginRequest } from "./csrf";

const target = "https://portal.example.test/api/auth/refresh";

test("accepts an explicit matching origin", () => {
  const request = new Request(target, { headers: { origin: "https://portal.example.test" } });
  assert.equal(isSameOriginRequest(request), true);
});

test("rejects requests without Origin", () => {
  assert.equal(isSameOriginRequest(new Request(target)), false);
});

test("rejects a different origin", () => {
  const request = new Request(target, { headers: { origin: "https://attacker.example" } });
  assert.equal(isSameOriginRequest(request), false);
});

test("rejects malformed Origin", () => {
  const request = new Request(target, { headers: { origin: "not a valid origin" } });
  assert.equal(isSameOriginRequest(request), false);
});

test("rejects cross-site Fetch Metadata even when Origin matches", () => {
  const request = new Request(target, {
    headers: {
      origin: "https://portal.example.test",
      "sec-fetch-site": "cross-site",
    },
  });
  assert.equal(isSameOriginRequest(request), false);
});

test("accepts same-origin Fetch Metadata", () => {
  const request = new Request(target, {
    headers: {
      origin: "https://portal.example.test",
      "sec-fetch-site": "same-origin",
    },
  });
  assert.equal(isSameOriginRequest(request), true);
});
