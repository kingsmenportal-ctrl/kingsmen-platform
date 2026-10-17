import assert from "node:assert/strict";
import test from "node:test";
import { isPublicHttpsUrl } from "./public-url";

test("accepts a well-formed HTTPS provider URL", () => {
  assert.equal(isPublicHttpsUrl("https://www.example.org/admissions"), true);
  assert.equal(isPublicHttpsUrl("https://example.org/path?q=1"), true);
});

test("rejects non-HTTPS and non-web schemes", () => {
  for (const value of ["http://example.org", "javascript:alert(1)", "data:text/plain,x", "ftp://example.org"]) {
    assert.equal(isPublicHttpsUrl(value), false, value);
  }
});

test("rejects malformed, credential-bearing and local-only URLs", () => {
  for (const value of ["https://", "not a url", "https://user:secret@example.org", "https://localhost", "https://app.local", "https://api.internal", " https://example.org"]) {
    assert.equal(isPublicHttpsUrl(value), false, value);
  }
});

test("rejects non-string and oversized values", () => {
  assert.equal(isPublicHttpsUrl(null), false);
  assert.equal(isPublicHttpsUrl(42), false);
  assert.equal(isPublicHttpsUrl("https://example.org/" + "x".repeat(2048)), false);
  assert.equal(isPublicHttpsUrl("https://example.org", 10), false);
});
