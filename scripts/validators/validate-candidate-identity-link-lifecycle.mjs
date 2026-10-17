import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const service = readFileSync(resolve(root, "apps/api/src/candidate/candidate-identity-link-lifecycle.ts"), "utf8");
const migration = readFileSync(resolve(root, "db/migrations/0040_candidate_auth_identity_link.sql"), "utf8");
const checks = [
  ["operator authorization required", /isAuthorizedOperator\(actorId\)/.test(service)],
  ["pending-only verification", /link\.link_status = 'PENDING'/.test(service)],
  ["explicit revocation reason", /revocation_reason = \$3/.test(service)],
  ["audit events in lifecycle", /insert into public\.audit_events/.test(service)],
  ["transaction caller explicitly required", /withCandidateBackendTransaction\(\)/.test(service)],
  ["identity link backend-only RLS", /USING \(kingsmen_security\.is_backend_service_role\(\)\)/.test(migration)],
  ["no email-based identity matching", !/where\s+.*email\s*=/.test(service)]
];
let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exitCode = 1;
