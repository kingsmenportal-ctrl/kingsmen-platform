import { readFileSync } from "node:fs";

const batches = [
  { name: "university", path: "db/seeds/n15_public_university_provider_seed.sql", manifestKey: "first_batch", pattern: /\('((?:INST_PUBLIC_UNI_[A-Z]+))'/g },
  { name: "TVET", path: "db/seeds/n15_public_tvet_provider_seed.sql", manifestKey: "second_batch", pattern: /\('((?:INST_PUBLIC_TVET_[A-Z_]+))'/g },
  { name: "SETA", path: "db/seeds/n15_seta_provider_seed.sql", manifestKey: "third_batch", pattern: /\('((?:INST_SETA_[A-Z_]+))'/g }
];
const manifestPath = "manifests/n15/institution-catalogue-import-v1.json";
const failures = [];
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const allRefs = [];
const counts = {};

for (const batch of batches) {
  const sql = readFileSync(batch.path, "utf8");
  const refs = [...sql.matchAll(batch.pattern)].map((m) => m[1]);
  counts[batch.name] = refs.length;
  allRefs.push(...refs);

  if (refs.length !== manifest[batch.manifestKey].expected_records) {
    failures.push(`Expected ${manifest[batch.manifestKey].expected_records} ${batch.name} rows, found ${refs.length}.`);
  }
  if (!sql.includes("safe_to_recommend") || !sql.includes("false")) failures.push(`${batch.name} seed must explicitly keep candidate recommendation disabled.`);
  if (!sql.includes("on conflict (provider_ref) do update")) failures.push(`${batch.name} seed must be idempotent by provider_ref.`);
  if (/insert\s+into\s+public\.opportunity_programmes/i.test(sql)) failures.push(`${batch.name} identity seed must not create programme-availability claims.`);
}
if (new Set(allRefs).size !== allRefs.length) failures.push("Duplicate provider_ref found across catalogue seed batches.");

const universitySql = readFileSync(batches[0].path, "utf8");
const tvetSql = readFileSync(batches[1].path, "utf8");
const setaSql = readFileSync(batches[2].path, "utf8");
if (!universitySql.includes("https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx")) failures.push("University source register missing.");
if (!tvetSql.includes("https://nsfas.org.za/content/institutions.html")) failures.push("NSFAS TVET directory evidence missing.");
if (!setaSql.includes("https://www.dhet.gov.za/")) failures.push("DHET SETA source entry point missing.");
if (!setaSql.includes("'NOT_APPLICABLE','HIGH',false")) failures.push("SETA seed must not assert provider accreditation or recommendation safety.");
if (manifest.status !== "seed-authored-not-applied") failures.push("Manifest must disclose that seeds have not been applied.");
for (const key of ["first_batch", "second_batch", "third_batch"]) {
  if (manifest[key].initial_state.safe_to_recommend !== false) failures.push(`${key} must preserve fail-closed candidate publication.`);
}
if (!manifest.release_gates.some((gate) => gate.includes("migration provenance"))) failures.push("Migration provenance release gate missing.");

if (failures.length) {
  console.error("Institution catalogue seed validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  batches: counts,
  total_records: allRefs.length,
  unique_provider_refs: new Set(allRefs).size,
  candidate_safe_by_default: false,
  programme_availability_claims: 0,
  applied_to_database: false
}, null, 2));
