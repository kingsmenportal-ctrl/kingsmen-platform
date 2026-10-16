import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const itnPath = path.join(root, "apps/api/src/finance/payfast-itn.ts");
const helperPath = path.join(root, "apps/api/src/finance/payfast-source-ip.ts");
const testsPath = path.join(root, "apps/api/src/finance/payfast-source-ip.test.ts");
const itn = fs.readFileSync(itnPath, "utf8");
const helper = fs.readFileSync(helperPath, "utf8");
const tests = fs.readFileSync(testsPath, "utf8");
const errors = [];

if (!itn.includes('from "./payfast-source-ip"') || !itn.includes("isAllowedPayFastSourceIp(input.remoteAddress, input.allowedSourceIps)")) {
  errors.push("PayFast ITN validator must derive source verification from socket IP and explicit allow-list.");
}
if (/ipValid\s*\??:\s*boolean|input\.ipValid\s*===\s*true/.test(itn)) {
  errors.push("PayFast ITN validator must not trust caller-supplied ipValid booleans.");
}
if (!helper.includes("normalizedEntries.some((entry) => entry === null)") || !helper.includes("if (!remoteAddress || !configuredAllowList?.trim()) return false")) {
  errors.push("PayFast source-IP validation must fail closed for missing or malformed configuration.");
}
for (const term of ["IPv4-mapped", "malformed", "allow-list"]) {
  if (!tests.toLowerCase().includes(term.toLowerCase())) errors.push(`Missing source-IP regression coverage: ${term}`);
}
if (errors.length) {
  console.error("PayFast source boundary validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("PayFast source-IP boundary validated (static check only; runtime tests still required).");
