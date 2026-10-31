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
if (!Array.isArray(data.sources) || data.sources.length < 20) errors.push("Expected at least 20 cross-sector source anchors");
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
