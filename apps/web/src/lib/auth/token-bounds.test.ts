import test from "node:test";
import assert from "node:assert/strict";
import {
  hasValidAuthTokenPair,
  MAX_AUTH_ACCESS_TOKEN_CHARS,
  MAX_AUTH_REFRESH_TOKEN_CHARS,
  MIN_AUTH_TOKEN_CHARS
} from "./token-bounds";

test("accepts a bounded provider-issued token pair", () => {
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(MIN_AUTH_TOKEN_CHARS),refresh_token:"r".repeat(MIN_AUTH_TOKEN_CHARS)}),true);
});

test("rejects missing, non-object, or partial token payloads", () => {
  assert.equal(hasValidAuthTokenPair(null),false);
  assert.equal(hasValidAuthTokenPair("token"),false);
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(20)}),false);
});

test("rejects short or oversized access tokens", () => {
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(MIN_AUTH_TOKEN_CHARS-1),refresh_token:"r".repeat(20)}),false);
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(MAX_AUTH_ACCESS_TOKEN_CHARS+1),refresh_token:"r".repeat(20)}),false);
});

test("rejects short or oversized refresh tokens", () => {
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(20),refresh_token:"r".repeat(MIN_AUTH_TOKEN_CHARS-1)}),false);
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(20),refresh_token:"r".repeat(MAX_AUTH_REFRESH_TOKEN_CHARS+1)}),false);
});

test("rejects non-string token fields", () => {
  assert.equal(hasValidAuthTokenPair({access_token:123,refresh_token:"r".repeat(20)}),false);
  assert.equal(hasValidAuthTokenPair({access_token:"a".repeat(20),refresh_token:null}),false);
});
