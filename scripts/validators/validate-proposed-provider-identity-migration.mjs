import { readFileSync, existsSync } from "node:fs";

const proposalPath = "docs/data/proposed-migrations/0107_canonical_provider_identity_evidence.proposed.sql";
const sql = readFileSync(proposalPath, "utf8");
const failures = [];
const required = [
  ["proposal-only marker", /PROPOSAL ONLY[\s—-]*NOT AN EXECUTABLE OR APPROVED MIGRATION/i],
  ["provider alias entity", /create table if not exists public\.opportunity_provider_aliases/i],
  ["provider location entity", /create table if not exists public\.opportunity_provider_locations/i],
  ["dated source observation entity", /create table if not exists public\.opportunity_provider_source_observations/i],
  ["alias evidence URL and observation time", /source_url text not null,[\s\S]*?observed_at timestamptz not null/i],
  ["location verification fail-closed default", /verification_state text not null default 'UNRESOLVED'/i],
  ["source lifecycle fail-closed default", /lifecycle_state text not null default 'UNRESOLVED'/i],
  ["RLS enabled on aliases", /alter table public\.opportunity_provider_aliases enable row level security/i],
  ["RLS enabled on locations", /alter table public\.opportunity_provider_locations enable row level security/i],
  ["RLS enabled on source observations", /alter table public\.opportunity_provider_source_observations enable row level security/i],
  ["anon/authenticated access revoked", /revoke all on public\.opportunity_provider_aliases from public, anon, authenticated/i],
  ["service role explicitly granted", /grant all on public\.opportunity_provider_source_observations to service_role/i],
  ["does not publish provider recommendations", /does not update[\s\S]*?safe_to_recommend/i],
  ["does not publish programme safety", /candidate_facing_safe/i]
];
for (const [label, pattern] of required) {
  if (!pattern.test(sql)) failures.push(`Missing or invalid contract: ${label}`);
}
if (existsSync("db/migrations/0107_canonical_provider_identity_evidence.sql")) {
  failures.push("Proposal must not also exist in the executable db/migrations directory before approval.");
}
if (!sql.includes("begin;") || !sql.includes("commit;")) {
  failures.push("Proposal must use an explicit transaction boundary.");
}
if (/insert\s+into\s+public\.(opportunity_providers|opportunity_programmes)/i.test(sql)) {
  failures.push("Schema proposal must not seed provider or programme publication data.");
}
if (failures.length) {
  console.error("Proposed provider identity/evidence migration contract FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({
  status: "PASS",
  proposal_only: true,
  tables: [
    "opportunity_provider_aliases",
    "opportunity_provider_locations",
    "opportunity_provider_source_observations"
  ],
  rls_enabled: true,
  public_candidate_access: false,
  applied_to_database: false
}, null, 2));
