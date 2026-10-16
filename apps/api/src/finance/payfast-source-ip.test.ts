import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedPayFastSourceIp, normalizeIpAddress } from "./payfast-source-ip";

test("normalizes IPv4 and IPv4-mapped IPv6 socket addresses", () => {
  assert.equal(normalizeIpAddress(" 203.0.113.7 "), "203.0.113.7");
  assert.equal(normalizeIpAddress("::ffff:203.0.113.7"), "203.0.113.7");
});

test("rejects malformed addresses and IPv6 zone identifiers", () => {
  assert.equal(normalizeIpAddress("999.1.1.1"), null);
  assert.equal(normalizeIpAddress("fe80::1%eth0"), null);
  assert.equal(normalizeIpAddress("not-an-ip"), null);
});

test("allows only exact source IP matches from configured allow-list", () => {
  assert.equal(isAllowedPayFastSourceIp("203.0.113.7", "198.51.100.2, 203.0.113.7"), true);
  assert.equal(isAllowedPayFastSourceIp("203.0.113.8", "198.51.100.2, 203.0.113.7"), false);
  assert.equal(isAllowedPayFastSourceIp("::ffff:203.0.113.7", "203.0.113.7"), true);
});

test("fails closed when source or allow-list is absent or malformed", () => {
  assert.equal(isAllowedPayFastSourceIp(undefined, "203.0.113.7"), false);
  assert.equal(isAllowedPayFastSourceIp("203.0.113.7", undefined), false);
  assert.equal(isAllowedPayFastSourceIp("203.0.113.7", "203.0.113.7,not-an-ip"), false);
});
