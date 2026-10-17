import { existsSync, readFileSync } from "node:fs";
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
  ["migration uses the non-conflicting 0040 filename", existsSync(resolve(root, "db/migrations/0040_candidate_auth_identity_link.sql")) && !existsSync(resolve(root, "db/migrations/0018_n20_candidate_auth_identity_link.sql"))],
  ["Auth user UUID is uniquely mapped", /supabase_user_id uuid NOT NULL UNIQUE/.test(migration)],
  ["candidate UUID is uniquely mapped", /candidate_id uuid NOT NULL UNIQUE REFERENCES public\.candidates\(id\) ON DELETE CASCADE/.test(migration)],
  ["mapping lifecycle values are constrained", /link_status IN \('PENDING', 'VERIFIED', 'REVOKED'\)/.test(migration)],
  ["identity link backend-only RLS", /USING \(kingsmen_security\.is_backend_service_role\(\)\)/.test(migration)],
  ["verified links require non-empty verification actor", /verified_by IS NOT NULL AND length\(btrim\(verified_by\)\) BETWEEN 1 AND 200/.test(migration)],
  ["revoked links require an explicit bounded reason", /revocation_reason IS NOT NULL AND length\(btrim\(revocation_reason\)\) BETWEEN 1 AND 500/.test(migration)],
  ["no email-based identity matching", !/where\s+.*email\s*=/.test(service)]
];
let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exitCode = 1;
