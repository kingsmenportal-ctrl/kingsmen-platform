import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifests/institutions/national-institution-network-source-register.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const failures = [];
const pass = (name, condition, detail = "") => {
  const ok = Boolean(condition);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};
const requiredPathways = [
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS",
  "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"
];
const requiredSourceTypes = [
  "NATIONAL_REGISTRY_INDEX", "PUBLIC_UNIVERSITY_DIRECTORY",
  "PRIVATE_HIGHER_EDUCATION_REGISTER", "PRIVATE_COLLEGE_REGISTER",
  "TVET_DIRECTORY", "CET_DIRECTORY", "SETA_DIRECTORY",
  "OCCUPATIONAL_PROVIDER_REGISTER", "QUALIFICATION_REGISTER",
  "CENTRAL_APPLICATIONS_PORTAL", "STUDENT_FINANCIAL_AID_DIRECTORY",
  "PUBLIC_SERVICE_VACANCIES", "GOVERNMENT_EMPLOYMENT_VACANCIES"
];
pass("schema identifier", manifest.schema === "kingsmen.institutions.national-source-register.v1");
pass("country scope is South Africa", manifest.country === "ZA");
pass("all six Kingsmen pathways included", requiredPathways.every(x => manifest.pathways.includes(x)));
pass("official source categories represented", requiredSourceTypes.every(x => manifest.sources.some(s => s.source_type === x)));
pass("source list has meaningful coverage", manifest.sources.length >= 12);
pass("source identifiers unique", new Set(manifest.sources.map(s => s.source_id)).size === manifest.sources.length);
const anchorSnapshot = manifest.existing_anchor_snapshot;
const knownAnchorKeys = new Set(anchorSnapshot?.source_keys ?? []);
pass("existing anchor snapshot captured", anchorSnapshot?.observed_on === "2026-10-31");
pass("source-authority row counts recorded", anchorSnapshot?.source_authorities_count === 21 && anchorSnapshot?.opportunity_source_authorities_count === 21);
pass("source keys match across authority tables", anchorSnapshot?.exact_key_matches === 21 && knownAnchorKeys.size === 21);
pass("stale verification gap is not hidden", anchorSnapshot?.source_authorities_last_verified_at_non_null_count === 1);
pass("duplicate-avoidance policy recorded", Array.isArray(anchorSnapshot?.reconciliation_policy) && anchorSnapshot.reconciliation_policy.length >= 3);

for (const source of manifest.sources) {
  const anchorMapping = source.existing_anchor_mapping;
  pass("anchor mapping present: " + source.source_id, Boolean(anchorMapping) && Array.isArray(anchorMapping.existing_source_keys) && typeof anchorMapping.status === "string");
  pass("anchor references are known: " + source.source_id, Boolean(anchorMapping) && anchorMapping.existing_source_keys.every(key => knownAnchorKeys.has(key)));
  pass("anchor mismatch status explicit: " + source.source_id, Boolean(anchorMapping) && typeof anchorMapping.relationship === "string" && typeof anchorMapping.url_match === "boolean");
  pass("exact URL map has one matching anchor: " + source.source_id, anchorMapping?.url_match !== true || anchorMapping.existing_source_keys.length === 1);
  let parsed;
  try {
    parsed = new URL(source.url);
  } catch {
    pass(`URL parses: ${source.source_id}`, false, source.url);
    continue;
  }
  pass(`HTTPS only: ${source.source_id}`, parsed.protocol === "https:");
  pass(`authority host matches URL: ${source.source_id}`, parsed.hostname.toLowerCase() === source.authority_host.toLowerCase());
  pass(`freshness cadence present: ${source.source_id}`, Number.isInteger(source.refresh_after_days) && source.refresh_after_days >= 1);
  pass(`human review explicitly required: ${source.source_id}`, source.requires_human_review === true);
  pass(`link status explicit: ${source.source_id}`, ["checked", "requires_live_check"].includes(source.link_status));
  pass(`both positive and negative claim scope: ${source.source_id}`, source.claims_supported.length > 0 && source.claims_not_supported.length > 0);
  pass(`no intake or submission assumptions: ${source.source_id}`,
    source.claims_not_supported.some(x => /open intake|currently open|submission|application receipt|partnership/i.test(x)));
}

pass("directory does not create partners", manifest.policy.directory_entry_is_partnership === false);
pass("provider listing does not imply open intake", manifest.policy.provider_listing_proves_open_intake === false);
pass("programme existence does not imply deadline", manifest.policy.programme_listing_proves_current_deadline === false);
pass("portal visit does not imply submission", manifest.policy.portal_visit_proves_submission === false);
pass("provider receipt required for confirmed submission", manifest.policy.provider_receipt_required_for_provider_confirmed_submission === true);
pass("destination-specific approval required for automation", manifest.policy.automated_submission_requires_provider_specific_approval_or_authorization === true);
pass("candidate confirmation is required per destination", manifest.policy.candidate_final_confirmation_required_per_destination === true);
pass("stop at CAPTCHA, MFA or unknown legal declaration", manifest.policy.stop_automation_on_captcha_mfa_or_unknown_legal_declaration === true);
pass("CET source link is held for revalidation", manifest.sources.find(x => x.source_id === "dhet_cet_list")?.link_status === "requires_live_check");

console.log(`National institution source-register validation: ${failures.length === 0 ? "PASS" : "FAIL"}; ${failures.length} failing check(s).`);
if (failures.length) {
  console.error(JSON.stringify({ failed: failures }, null, 2));
  process.exit(1);
}
