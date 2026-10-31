import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifests/integrations/sa-institution-source-register-v1.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const pathways = ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"];
const ids = manifest.sources.map((source) => source.source_id);
const checks = [];
const add = (name, passed, detail = "") => checks.push({ name, passed: Boolean(passed), detail });

add("manifest schema is versioned", manifest.schema === "kingsmen.sa-institution-source-register.v1");
add("all six canonical pathways are present", pathways.length === manifest.canonical_pathways.length && pathways.every((value, index) => value === manifest.canonical_pathways[index]));
add("source IDs are unique", new Set(ids).size === ids.length);
add("national registry, quality, admissions, funding and employment source families exist", [
  "dhet_pset_masterlist", "dhet_tvet_directory", "dhet_seta_directory",
  "qcto_sdp_register", "qcto_occupational_qualifications", "saqa_qualification_register",
  "cao_admissions", "nsfas_funding", "govza_public_service_vacancies",
  "npmn_partner_discovery", "institution_owned_portals"
].every((id) => ids.includes(id)));
add("live canonical pipeline baseline is explicitly recorded as empty", manifest.current_live_baseline.verified_pipeline_providers === 0 &&
  manifest.current_live_baseline.verified_pipeline_programmes === 0 &&
  manifest.current_live_baseline.external_source_observations === 0 &&
  manifest.current_live_baseline.confirmed_opportunity_deadlines === 0 &&
  manifest.current_live_baseline.candidate_opportunity_matches === 0);
add("publication doctrine requires item-level source evidence and freshness", manifest.publication_invariants.some((line) => line.includes("last_checked_at")) &&
  manifest.publication_invariants.some((line) => line.includes("stale_after")));
add("direct transactional API access is partner-dependent", /Partner-dependent/.test(manifest.rollout_targets.phase_4));
add("rollout periods are explicitly target windows, not achievements", /internal target windows/i.test(manifest.rollout_targets.date_semantics));
add("manifest does not claim API access is already verified", manifest.sources.every((source) => source.api_status === "UNVERIFIED"));

for (const source of manifest.sources) {
  add("source " + source.source_id + " has an HTTPS URL", /^https:\/\//.test(source.url));
  add("source " + source.source_id + " has authority, type and explicit integration status",
    Boolean(source.authority && source.source_class && source.integration_status));
  add("source " + source.source_id + " has positive refresh target and evidence requirements",
    Number.isInteger(source.refresh_target_hours) && source.refresh_target_hours > 0 &&
    Array.isArray(source.evidence_required) && source.evidence_required.length > 0);
  add("source " + source.source_id + " avoids unsupported live-connection claims",
    !/DIRECT_API_LIVE|CONNECTED_ALL|AUTO_SUBMISSION_ENABLED/.test(source.integration_status));
  if (source.requires_partner_authorization) {
    add("source " + source.source_id + " remains unverified pending authorization",
      source.api_status === "UNVERIFIED" &&
      !/DIRECT_API_LIVE|AUTO_SUBMISSION_ENABLED/.test(source.integration_status));
  }
}

const failures = checks.filter((item) => !item.passed);
const result = {
  schema: "kingsmen.sa-institution-source-register.validation.v1",
  status: failures.length ? "FAILED" : "VALIDATED",
  passed: failures.length === 0,
  sourceFamilies: manifest.sources.length,
  pathwayCount: manifest.canonical_pathways.length,
  checks,
  failures,
  limitations: [
    "This validator tests the source register contract only; it does not crawl institutional websites or prove a listing is open.",
    "A directory source does not prove programme availability, current deadlines, accreditation, eligibility or provider outcomes.",
    "Provider API/feed connectivity requires separate authorization and runtime evidence."
  ]
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
