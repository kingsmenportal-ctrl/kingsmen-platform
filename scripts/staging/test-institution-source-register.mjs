import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests/integrations/sa-institution-source-register-v1.json"), "utf8"));
const pathways = ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"];
const ids = manifest.sources.map((source) => source.source_id);

assert.equal(manifest.schema, "kingsmen.sa-institution-source-register.v1");
assert.deepEqual(manifest.canonical_pathways, pathways);
assert.equal(new Set(ids).size, ids.length, "source IDs must be unique");
assert.ok(manifest.sources.length >= 20, "national register must cover principal registry, qualification, admissions, funding and work-network sources");
for (const source of manifest.sources) {
  assert.match(source.source_id, /^[a-z0-9_]+$/);
  assert.match(source.url, /^https:\/\//);
  assert.ok(source.name && source.authority && source.source_class);
  assert.equal(source.api_status, "UNVERIFIED", "an undocumented API must not be described as connected");
  assert.ok(Number.isInteger(source.refresh_target_hours) && source.refresh_target_hours > 0);
  assert.ok(Array.isArray(source.evidence_required) && source.evidence_required.length > 0);
  assert.ok(source.integration_status && source.access_mode);
}
for (const sourceId of [
  "dhet_pset_masterlist", "dhet_tvet_directory", "dhet_seta_directory",
  "qcto_sdp_register", "saqa_qualification_register", "cao_admissions",
  "nsfas_funding", "govza_public_service_vacancies", "npmn_partner_discovery",
  "institution_owned_portals", "institution_accommodation_portals"
]) {
  assert.ok(ids.includes(sourceId), "required source family missing: " + sourceId);
}
assert.equal(manifest.current_live_baseline.verified_pipeline_providers, 0);
assert.equal(manifest.current_live_baseline.verified_pipeline_programmes, 0);
assert.equal(manifest.current_live_baseline.external_source_observations, 0);
assert.equal(manifest.current_live_baseline.confirmed_opportunity_deadlines, 0);
assert.equal(manifest.current_live_baseline.candidate_opportunity_matches, 0);
assert.ok(manifest.publication_invariants.some((line) => line.includes("stale_after")));
assert.ok(manifest.publication_invariants.some((line) => line.includes("candidate-reported submission")));
assert.match(manifest.rollout_targets.phase_4, /Partner-dependent/);
assert.match(manifest.rollout_targets.date_semantics, /not achieved milestones/);
console.log(JSON.stringify({
  status: "PASS",
  sourceFamilies: manifest.sources.length,
  pathwayCount: manifest.canonical_pathways.length,
  APIClaims: manifest.sources.filter((source) => source.api_status !== "UNVERIFIED").length,
  verifiedPipelineProviderBaseline: manifest.current_live_baseline.verified_pipeline_providers,
  verifiedPipelineProgrammeBaseline: manifest.current_live_baseline.verified_pipeline_programmes
}, null, 2));
