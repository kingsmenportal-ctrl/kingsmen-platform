import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(root, "manifests/institutions/cross-sector-institution-source-extension.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const requiredClasses = [
  "PUBLIC_ADMINISTRATION", "MUNICIPALITY", "STATE_OWNED_ENTERPRISE", "PUBLIC_ENTITY",
  "EDUCATION_AND_SKILLS", "HEALTH_AND_CARE", "EMPLOYER_AND_RECRUITMENT",
  "FUNDING_AND_SOCIAL_SUPPORT", "FINANCE_AND_INSURANCE", "HOUSING_AND_ACCOMMODATION",
  "TRANSPORT_AND_ESSENTIAL_SERVICES", "LEGAL_AID_AND_COMMUNITY_SERVICES",
  "NGO_NPO_AND_FOUNDATION", "REGULATOR_AND_PROFESSIONAL_COUNCIL", "TECHNOLOGY_AND_DELIVERY_VENDOR"
];
if (data.schema !== "kingsmen.institutions.cross-sector-source-extension.v1") errors.push("Unexpected schema version");
if (data.country !== "ZA") errors.push("Country must remain ZA");
if (data.integration_contract?.registry_strategy !== "EXTEND_EXISTING_CANONICAL_INSTITUTION_REGISTRY") errors.push("Must extend the canonical registry");
if (data.integration_contract?.create_parallel_registry !== false) errors.push("Parallel registry must remain prohibited");
if (data.integration_contract?.default_record_state !== "NEEDS_REVIEW") errors.push("Records must default to NEEDS_REVIEW");
if (data.integration_contract?.default_public_safe !== false) errors.push("Records must default to not public safe");
if (data.integration_contract?.default_connector_state !== "NOT_CONNECTED") errors.push("Connectors must default to NOT_CONNECTED");
for (const cls of requiredClasses) if (!data.institution_classes.includes(cls)) errors.push(`Missing institution class: ${cls}`);
if (!Array.isArray(data.sources) || data.sources.length < 177) errors.push("Expected at least 177 cross-sector source anchors after the GCIS profile reconciliation");
const setaProviderKeys = (data.sources ?? []).filter(source => /^seta_[a-z0-9]+_official$/.test(source.source_id)).map(source => source.provider_key);
if (setaProviderKeys.length !== 21 || new Set(setaProviderKeys).size !== 21 || setaProviderKeys.some(key => !key)) errors.push("Expected 21 distinct individual SETA provider keys");
const employerKeys = (data.sources ?? []).filter(source => /^gcis_soe_.*_employer$/.test(source.source_id)).map(source => source.provider_key);
if (employerKeys.length !== 9 || new Set(employerKeys).size !== 9 || employerKeys.some(key => !key)) errors.push("Expected nine unique, individually keyed GCIS public-employer anchors");
if (!(data.sources ?? []).some(source => source.source_id === "gcis_public_entities_and_soe_directory")) errors.push("Missing GCIS directory anchor for 123 public institutions and SOEs");
const gcisProfileSources = (data.sources ?? []).filter(source => source.metadata?.gcis_profile_url || source.metadata?.official_gcis_profile_url);
const gcisProfileUrls = gcisProfileSources.map(source => source.metadata.gcis_profile_url ?? source.metadata.official_gcis_profile_url);
const gcisProviderKeys = gcisProfileSources.map(source => source.provider_key);
if (gcisProfileSources.length !== 123 || new Set(gcisProfileUrls).size !== 123 || new Set(gcisProviderKeys).size !== 123 || gcisProviderKeys.some(key => !key)) errors.push("Expected all 123 unique GCIS public-entity profiles with unique canonical provider keys");

const requiredBulkSources = [
  "gcis_provincial_local_municipal_directory",
  "national_treasury_municipal_finance_data",
  "dhet_pset_landscape_2026_27",
  "lurits_registered_school_masterlist",
  "national_health_facility_master_list",
  "govza_bursary_funding_guide",
  "bursaries_africa_provider_index_leads",
  "nsfas_accommodation_directory"
];
for (const id of requiredBulkSources) {
  if (!(data.sources ?? []).some(source => source.source_id === id)) errors.push("Missing authoritative discovery/lead source: " + id);
}

const ids = new Set();
for (const source of data.sources ?? []) {
  if (!source.source_id || ids.has(source.source_id)) errors.push(`Missing or duplicate source_id: ${source.source_id}`);
  ids.add(source.source_id);
  if (!source.name || !source.authority || !Array.isArray(source.classes) || !source.classes.length) errors.push(`Incomplete source metadata: ${source.source_id}`);
  if (source.url !== null && (!/^https:\/\//.test(source.url) || !source.url.startsWith("https://"))) errors.push(`Invalid source URL: ${source.source_id}`);
  if (source.connector_state !== "NOT_CONNECTED") errors.push(`Connector incorrectly pre-activated: ${source.source_id}`);
  if (source.review_required !== true) errors.push(`Human review must be required: ${source.source_id}`);
  if (!Array.isArray(source.supports) || !Array.isArray(source.does_not_prove)) errors.push(`Evidence claim boundaries missing: ${source.source_id}`);
  if (!Number.isInteger(source.refresh_after_days) || source.refresh_after_days < 1) errors.push(`Invalid freshness interval: ${source.source_id}`);
}
if (!data.completion_gates?.some(g => g.includes("source_authorities"))) errors.push("Must require reconciliation with existing source_authorities");
if (!data.completion_gates?.some(g => g.includes("independent review"))) errors.push("Must require independent review before migration");
if (errors.length) {
  console.error("Cross-sector institution source extension validation FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Cross-sector institution source extension validation PASSED: ${data.sources.length} source anchors, ${requiredClasses.length} institution classes, all connectors remain NOT_CONNECTED by default.`);
}
