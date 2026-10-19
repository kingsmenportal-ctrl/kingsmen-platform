import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const functionSource = (name) =>
  readFile(resolve(repoRoot, "supabase/functions", name, "index.ts"), "utf8");

const functions = [
  { name: "candidate-identity-review-request", allowlist: /allowedOrigins\.has\(origin\)/ },
  { name: "candidate-workspace-readiness", allowlist: /allowedOrigins\.has\(origin\)/ },
  { name: "candidate-profile-review", allowlist: /ORIGINS\.has\(origin\)/ },
  { name: "candidate-application-preparation", allowlist: /origins\.has\(origin\)/ }
];

test("all candidate edge functions enforce an explicit CORS origin allowlist", async () => {
  for (const item of functions) {
    const source = await functionSource(item.name);
    assert.match(source, item.allowlist, `${item.name}: expected origin allowlist`);
    assert.doesNotMatch(
      source,
      /"Access-Control-Allow-Origin"\s*:\s*origin\s*\?\?/,
      `${item.name}: preflight must not blindly reflect an arbitrary Origin`
    );
    assert.match(source, /Origin not allowed/i, `${item.name}: disallowed origins must be rejected`);
  }
});

test("candidate edge functions authenticate bearer sessions server-side", async () => {
  for (const item of functions) {
    const source = await functionSource(item.name);
    assert.match(source, /Authorization/);
    assert.match(source, /auth\.getUser\(/, `${item.name}: must validate the session with Supabase Auth`);
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(source, /Cache-Control["']?\s*:\s*["']no-store/i);
  }
});

test("candidate data endpoints fail closed without an authorised verified identity link", async () => {
  for (const name of [
    "candidate-workspace-readiness",
    "candidate-profile-review",
    "candidate-application-preparation"
  ]) {
    const source = await functionSource(name);
    assert.match(source, /candidate_auth_identity_links/, `${name}: identity link lookup missing`);
    assert.match(source, /link_status["']?\s*,?\s*["']VERIFIED["']/);
    assert.match(source, /verified_at/);
    assert.match(source, /IDENTITY_NOT_VERIFIED/);
  }
});

test("application preparation accepts only fresh verified routes and safe verified providers", async () => {
  const source = await functionSource("candidate-application-preparation");
  assert.match(source, /route_status["']?\s*,?\s*["']VERIFIED["']/);
  assert.match(source, /availability_status/);
  assert.match(source, /source_confidence_band/);
  assert.match(source, /90\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(source, /public_safe/);
  assert.match(source, /verification_status/);
  assert.match(source, /https:.*test\(officialUrl\)/);
});

test("candidate identifiers are resolved from verified server-side identity, not trusted from browser input", async () => {
  for (const name of [
    "candidate-workspace-readiness",
    "candidate-profile-review",
    "candidate-application-preparation"
  ]) {
    const source = await functionSource(name);
    assert.match(source, /eq\(["']supabase_user_id["'],\s*(?:authData|userData)\.user\.id\)/);
    assert.match(source, /link\.candidate_id/);
  }
});
