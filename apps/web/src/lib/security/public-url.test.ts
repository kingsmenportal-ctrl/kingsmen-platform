import assert from "node:assert/strict";
import test from "node:test";
import { isPublicHttpsUrl, sanitizePublicSearchQuery } from "./public-url";

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
  for (const value of ["https://", "not a url", "https://user:secret@example.org", "https://localhost", "https://app.local", "https://api.internal", "https://host.test", "https://127.0.0.1", "https://192.168.1.10", "https://169.254.169.254", "https://[::1]", "https://intranet", " https://example.org"]) {
    assert.equal(isPublicHttpsUrl(value), false, value);
  }
});

test("rejects non-string and oversized values", () => {
  assert.equal(isPublicHttpsUrl(null), false);
  assert.equal(isPublicHttpsUrl(42), false);
  assert.equal(isPublicHttpsUrl("https://example.org/" + "x".repeat(2048)), false);
  assert.equal(isPublicHttpsUrl("https://example.org", 10), false);
});


test("sanitizes PostgREST search grammar while preserving useful Unicode text", () => {
  assert.equal(sanitizePublicSearchQuery("Bursary (2026), 50%_*"), "Bursary 2026 50");
  assert.equal(sanitizePublicSearchQuery("King's Park - Gauteng"), "King's Park - Gauteng");
  assert.equal(sanitizePublicSearchQuery("  NSFAS\n2027  "), "NSFAS\n2027");
  assert.equal(sanitizePublicSearchQuery("x".repeat(120)), "x".repeat(100));
});
