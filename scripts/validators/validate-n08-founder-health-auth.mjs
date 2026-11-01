import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("supabase/functions/n08-founder-control-plane-health/index.ts", "utf8");

// Security contract: never authorize the privileged service path by decoding JWT claims.
// The exact server-held service key is accepted for the backend worker; all other
// bearers must be verified by Supabase Auth and tied to an active PLATFORM_ADMIN grant.
assert.doesNotMatch(source, /function\s+tokenRole\s*\(/, "unverified tokenRole decoder must not exist");
assert.doesNotMatch(source, /JSON\.parse\(atob\(/, "unverified JWT payload decoding must not be used for authorization");
assert.match(source, /if\s*\(bearer\s*!==\s*serviceKey\)/, "service bypass must require exact server-held service key");
assert.match(source, /authClient\.auth\.getUser\(bearer\)/, "non-service tokens must be verified by Supabase Auth");
assert.match(source, /eq\("auth_user_id",\s*userData\.user\.id\)/, "reviewer grant must be tied to verified user ID");
assert.match(source, /eq\("is_active",\s*true\)/, "reviewer grant must be active");
assert.match(source, /\.is\("revoked_at",\s*null\)/, "revoked reviewer grants must be rejected");
assert.match(source, /ALLOWED_FOUNDER_ROLES/, "founder role allow-list must remain enforced");

console.log("PASS: N08 founder health authentication boundary contract");
