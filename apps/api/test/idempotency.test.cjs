const test = require("node:test");
const assert = require("node:assert/strict");
const {
  payloadFingerprint,
  assertIdempotencyReplayMatches
} = require("../dist/components/idempotency.js");

test("payload fingerprint is stable across object key ordering", () => {
  assert.equal(payloadFingerprint({ amount: 100, invoice: "a" }), payloadFingerprint({ invoice: "a", amount: 100 }));
});

test("idempotency replay accepts the same payload and rejects changed payload", () => {
  const fingerprint = payloadFingerprint({ invoice: "inv-1", amountCents: 12345 });
  assert.doesNotThrow(() => assertIdempotencyReplayMatches(fingerprint, { amountCents: 12345, invoice: "inv-1" }));
  assert.throws(
    () => assertIdempotencyReplayMatches(fingerprint, { amountCents: 999, invoice: "inv-1" }),
    /IDEMPOTENCY_KEY_PAYLOAD_MISMATCH/
  );
});

test("idempotency replay rejects corrupt stored fingerprints", () => {
  assert.throws(() => assertIdempotencyReplayMatches("not-a-hash", {}), /IDEMPOTENCY_RECORD_INVALID/);
});
