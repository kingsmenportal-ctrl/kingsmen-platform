import { readFileSync } from "node:fs";

const universitySeedPath = "db/seeds/n15_public_university_provider_seed.sql";
const tvetSeedPath = "db/seeds/n15_public_tvet_provider_seed.sql";
const manifestPath = "manifests/n15/institution-catalogue-import-v1.json";
const failures = [];

const universitySql = readFileSync(universitySeedPath, "utf8");
const tvetSql = readFileSync(tvetSeedPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const universityRefs = [...universitySql.matchAll(/\('((?:INST_PUBLIC_UNI_[A-Z]+))'/g)].map((m) => m[1]);
const tvetRefs = [...tvetSql.matchAll(/\('((?:INST_PUBLIC_TVET_[A-Z_]+))'/g)].map((m) => m[1]);
const allRefs = [...universityRefs, ...tvetRefs];

if (universityRefs.length !== manifest.first_batch.expected_records) failures.push(`Expected ${manifest.first_batch.expected_records} university rows, found ${universityRefs.length}.`);
if (tvetRefs.length !== manifest.second_batch.expected_records) failures.push(`Expected ${manifest.second_batch.expected_records} TVET rows, found ${tvetRefs.length}.`);
if (new Set(allRefs).size !== allRefs.length) failures.push("Duplicate provider_ref found across catalogue seed batches.");

for (const [name, sql] of [["university", universitySql], ["TVET", tvetSql]]) {
  if (!sql.includes("safe_to_recommend") || !sql.includes("false")) failures.push(`${name} seed must explicitly keep candidate recommendation disabled.`);
  if (!sql.includes("'NEEDS_REVIEW'")) failures.push(`${name} seed must keep accreditation status in review.`);
  if (!sql.includes("on conflict (provider_ref) do update")) failures.push(`${name} seed must be idempotent by provider_ref.`);
  if (/insert\s+into\s+public\.opportunity_programmes/i.test(sql)) failures.push(`${name} identity seed must not create programme-availability claims.`);
}

if (!universitySql.includes("https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx")) failures.push("Authoritative university source register missing.");
if (!tvetSql.includes("https://nsfas.org.za/content/institutions.html")) failures.push("NSFAS TVET institution directory evidence missing.");
if (manifest.status !== "seed-authored-not-applied") failures.push("Manifest must disclose that seeds have not been applied.");
if (manifest.first_batch.initial_state.safe_to_recommend !== false) failures.push("University seed must preserve fail-closed candidate publication.");
if (manifest.second_batch.initial_state.safe_to_recommend !== false) failures.push("TVET seed must preserve fail-closed candidate publication.");
if (!manifest.release_gates.some((gate) => gate.includes("migration provenance"))) failures.push("Migration provenance release gate missing.");

if (failures.length) {
  console.error("Institution catalogue seed validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  university_records: universityRefs.length,
  tvet_records: tvetRefs.length,
  total_records: allRefs.length,
  unique_provider_refs: new Set(allRefs).size,
  candidate_safe_by_default: false,
  programme_availability_claims: 0,
  applied_to_database: false
}, null, 2));
