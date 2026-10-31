import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const programmePath = path.join(root, "manifests/institutions/seed/dhet-tvet-occupational-programmes-2026.json");
const providerPath = path.join(root, "manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json");
const sourcePath = path.join(root, "manifests/institutions/national-institution-network-source-register.json");
const data = JSON.parse(fs.readFileSync(programmePath, "utf8"));
const providerSeed = JSON.parse(fs.readFileSync(providerPath, "utf8"));
const sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const failed = [];
const check = (name, value) => {
  const passed = Boolean(value);
  console.log((passed ? "PASS " : "FAIL ") + name);
  if (!passed) failed.push(name);
};
const norm = (value) => value.normalize("NFKD").toLowerCase()
  .replace(/for tvet/g, "tvet").replace(/[^a-z0-9]+/g, " ").trim();
const providerByName = new Map(providerSeed.records
  .filter(record => record.provider_type === "TVET_COLLEGE")
  .map(record => [norm(record.canonical_name), record]));
const providerByRef = new Map(providerSeed.records.map(record => [record.institution_ref, record]));
const aliasByName = new Map(data.provider_alias_rules.map(rule => [rule.source_name, rule]));
const programmes = data.programmes;
const saqaIds = new Set(programmes.map(item => item.saqa_id));
const rawProviderNames = [...new Set(programmes.flatMap(item => item.colleges))];
const rawMentions = programmes.reduce((sum, item) => sum + item.colleges.length, 0);
const source = sources.sources.find(item => item.source_id === data.source.source_register_id);

check("schema is versioned", data.schema === "kingsmen.institutions.dhet-tvet-occupational-programmes-seed.v1");
check("source resolves in the national source manifest", Boolean(source) && source.url === data.source.url);
check("source is the official DHET 2026 occupational qualifications PDF", data.source.url.startsWith("https://www.dhet.gov.za/") && /updated%20for%202026/i.test(data.source.url));
check("section B DSPP is intentionally not mixed into section A", data.source.sections_imported.includes("A - listed occupational qualifications") && data.source.section_b_policy.includes("separately"));
check("expected 38 distinct qualification records", programmes.length === 38 && saqaIds.size === 38);
check("published provider mentions reconcile to manifest count", rawMentions === data.counts.raw_provider_mentions && rawMentions === 331);
check("unique source-name count reconciles", rawProviderNames.length === data.counts.unique_source_provider_names && rawProviderNames.length === 56);
check("provider deduplication was deferred", data.counts.provider_programme_pairs_after_deduplication === null);
check("all parsed PDF layouts remain under human review", programmes.every(item => item.transcription_status === "NEEDS_HUMAN_SOURCE_LAYOUT_REVIEW"));
check("no programme is shown as open", programmes.every(item => item.intake_status === "UNKNOWN" && item.availability_status === "UNKNOWN"));
check("no deadline or candidate eligibility was inferred", programmes.every(item => item.deadline_status === "UNKNOWN" && item.eligibility_status === "UNKNOWN"));
check("no application route or integration is implied", programmes.every(item => item.application_route_status === "NOT_VERIFIED" && item.integration_status === "NOT_CONNECTED"));
check("published NSFAS flag is not a candidate funding guarantee", data.policy.published_nsfas_allowance_flag_implies_candidate_eligibility === false);
check("all programmes have names, page evidence, SAQA ID and published number", programmes.every(item => item.name && item.pages?.length && item.saqa_id && item.published_number));
check("SAQA IDs are not silently reused as published numbers", programmes.every(item => item.saqa_id !== item.published_number || item.notes));
check("NSFAS flags are source values only", programmes.every(item => ["YES", "NO"].includes(item.nsfas_allowance)));
check("each provider mention is non-empty", programmes.every(item => item.colleges.length > 0 && item.colleges.every(name => typeof name === "string" && name.trim().length > 0)));

let unmapped = [];
let aliasIssues = [];
for (const name of rawProviderNames) {
  if (providerByName.has(norm(name))) continue;
  const alias = aliasByName.get(name);
  if (!alias) {
    unmapped.push(name);
    continue;
  }
  if (!providerByRef.has(alias.candidate_institution_ref) ||
      providerByRef.get(alias.candidate_institution_ref).provider_type !== "TVET_COLLEGE" ||
      alias.status !== "NEEDS_HUMAN_REVIEW") {
    aliasIssues.push(name);
  }
}
check("every source provider name either matches a directory label or has an explicit alias candidate", unmapped.length === 0, unmapped.join("; "));
check("every alias points to an existing TVET seed entry and remains review-only", aliasIssues.length === 0, aliasIssues.join("; "));
check("source extraction limitations are explicit", data.source.rendered_pdf_screenshot_status === "UNAVAILABLE_CACHE_MISS_IN_WEB_SCREENSHOT_TOOL" && data.source.extraction_method.includes("human visual verification"));
check("duplicate provider mentions have transcription notes", programmes.every(item => new Set(item.colleges).size === item.colleges.length || (item.transcription_notes?.length ?? 0) > 0));

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "DHET 2026 TVET occupational qualification source seed",
  status: failed.length === 0 ? "VALIDATED_FOR_REVIEW_ONLY" : "FAILED",
  passed: failed.length === 0,
  qualification_records: programmes.length,
  raw_provider_mentions: rawMentions,
  unique_source_provider_names: rawProviderNames.length,
  exact_directory_name_matches: rawProviderNames.filter(name => providerByName.has(norm(name))).length,
  alias_candidates_pending_human_review: rawProviderNames.filter(name => aliasByName.has(name)).length,
  unmapped_provider_names: unmapped,
  alias_issues: aliasIssues,
  production_ready: false,
  candidate_facing_safe: false,
  generated_at: new Date().toISOString()
};
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exit(1);
