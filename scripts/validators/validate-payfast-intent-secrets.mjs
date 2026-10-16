import { readFileSync } from "node:fs";

const source = readFileSync("apps/api/src/finance/payfast-intent.ts", "utf8");
const tests = readFileSync("apps/api/src/finance/payfast-intent.test.ts", "utf8");
const checks = [
  ["merchant key is not included in signed browser payload", !/merchant_id:\s*runtime\.merchantId,[\s\S]{0,180}merchant_key:\s*runtime\.merchantKey/.test(source)],
  ["regression test asserts merchant key is absent", /hasOwn\(intent\.signedPayload, ["']merchant_key["']\), false/.test(tests)],
  ["regression test verifies generated signature", /verifyPayFastSignature\(intent\.signedPayload, intent\.signature, runtime\.passphrase\)/.test(tests)],
  ["callback URL must use HTTPS", /url\.protocol\s*!==\s*["']https:["']/.test(source)],
  ["zero-cost orders cannot create payment intents", /order\.amountCents\s*<=\s*0/.test(source)]
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exitCode = 1;
