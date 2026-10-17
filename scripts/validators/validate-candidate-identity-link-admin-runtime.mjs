import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "apps/api/src/candidate/candidate-identity-link-admin-runtime.ts"), "utf8");
const checks = [
  ["trusted resolver required", /operatorResolver\.resolve\(requestContext\)/.test(source)],
  ["action-specific permissions", /REQUIRED_PERMISSION\[action\]/.test(source)],
  ["database transaction owned by runtime", /withCandidateBackendTransaction\(this\.pool/.test(source)],
  ["no HTTP role parsing", !/request\.body\.role|headers\[['"]x-role['"]\]/i.test(source)],
  ["explicit fail-closed principal check", /CANDIDATE_IDENTITY_LINK_OPERATOR_REQUIRED/.test(source)],
  ["explicit fail-closed permission check", /CANDIDATE_IDENTITY_LINK_PERMISSION_REQUIRED/.test(source)]
];
let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exitCode = 1;
