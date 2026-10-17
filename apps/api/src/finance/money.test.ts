import test from "node:test";
import assert from "node:assert/strict";
import { centsToRand, randToCents, assertPositiveOrZeroCents } from "./money";

test("converts valid ZAR decimal strings to exact integer cents", () => {
  assert.equal(randToCents("49.99"), 4999);
  assert.equal(randToCents("49.9"), 4990);
  assert.equal(randToCents("49"), 4900);
  assert.equal(randToCents("0.00"), 0);
});

test("rejects locale commas, exponent notation, signs, and excess precision", () => {
  for (const amount of ["49,99", "49.999", "4.999e1", "+49.99", "-1.00", ".99", ""]) {
    assert.throws(() => randToCents(amount), /Invalid ZAR amount/, `expected rejection for ${amount}`);
  }
});

test("rejects unsafe integer precision and invalid cents", () => {
  assert.throws(() => randToCents("90071992547410.00"));
  assert.throws(() => centsToRand(-1));
  assert.throws(() => centsToRand(Number.MAX_SAFE_INTEGER + 1));
  assert.throws(() => assertPositiveOrZeroCents(-1));
  assert.throws(() => assertPositiveOrZeroCents(1.5));
});

test("formats integer cents as two-decimal ZAR", () => {
  assert.equal(centsToRand(4999), "49.99");
  assert.equal(centsToRand(0), "0.00");
});
