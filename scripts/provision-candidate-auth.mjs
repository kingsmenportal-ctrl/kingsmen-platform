#!/usr/bin/env node
import process from "node:process";

const candidateId = process.env.CANDIDATE_ID || "";
const authUserId = process.env.SUPABASE_AUTH_USER_ID || "";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuid.test(candidateId) || !uuid.test(authUserId)) {
  console.error("Refusing provisioning: set CANDIDATE_ID and SUPABASE_AUTH_USER_ID to exact UUIDs.");
  process.exit(2);
}
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Refusing provisioning: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(2);
}

let base;
try {
  base = new URL(supabaseUrl);
  if (base.protocol !== "https:" || base.username || base.password) throw new Error("invalid URL");
} catch {
  console.error("Refusing provisioning: SUPABASE_URL must be a valid HTTPS URL.");
  process.exit(2);
}

const response = await fetch(new URL("/rest/v1/rpc/bind_candidate_auth_user", base), {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify({ p_candidate_id: candidateId, p_auth_user_id: authUserId }),
  signal: AbortSignal.timeout(10_000),
  cache: "no-store"
});

if (!response.ok) {
  // Never echo the request headers, key, or raw database error into logs.
  console.error(`Candidate provisioning rejected (HTTP ${response.status}). Verify the candidate and confirmed Auth identity, then review database logs securely.`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "BINDING_REQUEST_ACCEPTED",
  candidateId,
  authUserId,
  note: "No service credential was printed. Verify the binding in the staging database before allowing the candidate journey."
}, null, 2));
