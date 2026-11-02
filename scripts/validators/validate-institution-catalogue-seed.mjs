import { readFileSync } from "node:fs";

const seedPath = "db/seeds/n15_public_university_provider_seed.sql";
const manifestPath = "manifests/n15/institution-catalogue-import-v1.json";
const failures = [];

const sql = readFileSync(seedPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const refs = [...sql.matchAll(/\('((?:INST_PUBLIC_UNI_[A-Z]+))'/g)].map((m) => m[1]);
const expected = manifest.first_batch.expected_records;

if (refs.length !== expected) failures.push(`Expected ${expected} provider rows, found ${refs.length}.`);
if (new Set(refs).size !== refs.length) failures.push("Duplicate provider_ref found in the seed.");
if (!sql.includes("safe_to_recommend") || !sql.includes("false")) failures.push("Seed must explicitly keep candidate recommendation disabled.");
if (!sql.includes("'NEEDS_REVIEW'")) failures.push("Seed must keep accreditation status in review.");
if (!sql.includes("on conflict (provider_ref) do update")) failures.push("Seed must be idempotent by provider_ref.");
if (!sql.includes("https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx")) failures.push("Authoritative university source register missing.");
if (/insert\s+into\s+public\.opportunity_programmes/i.test(sql)) failures.push("Institution identity seed must not create programme-availability claims.");
if (manifest.status !== "seed-authored-not-applied") failures.push("Manifest must disclose that the seed has not been applied.");
if (manifest.first_batch.initial_state.safe_to_recommend !== false) failures.push("Manifest must preserve fail-closed candidate publication.");
if (!manifest.release_gates.some((gate) => gate.includes("migration provenance"))) failures.push("Migration provenance release gate missing.");

if (failures.length) {
  console.error("Institution catalogue seed validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  seed: seedPath,
  manifest: manifestPath,
  records: refs.length,
  unique_provider_refs: new Set(refs).size,
  candidate_safe_by_default: false,
  programme_availability_claims: 0,
  applied_to_database: false
}, null, 2));
