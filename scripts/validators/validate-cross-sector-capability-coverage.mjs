import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "manifests/institutions/cross-sector-institution-source-extension.json");
const matrixPath = path.join(root, "manifests/institutions/cross-sector-capability-coverage.json");
const sourceData = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const data = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const errors = [];
const expected = sourceData.service_capabilities ?? [];
const sourceIds = new Set((sourceData.sources ?? []).map(source => source.source_id));
const allowedClasses = new Set(sourceData.institution_classes ?? []);
for (const source of sourceData.sources ?? []) {
  for (const cls of source.classes ?? []) {
    if (!allowedClasses.has(cls)) errors.push(`Unknown institution class ${cls} used by source ${source.source_id}`);
  }
}
if (data.schema !== "kingsmen.institutions.cross-sector-capability-coverage.v1") errors.push("Unexpected capability coverage schema");
if (data.country !== "ZA") errors.push("Country must remain ZA");
if (data.defaults?.coverage_state !== "DISCOVERY_ONLY") errors.push("Coverage must default to discovery only");
if (data.defaults?.route_state !== "NOT_CONNECTED") errors.push("Routes must default to NOT_CONNECTED");
if (data.defaults?.public_safe !== false || data.defaults?.review_required !== true) errors.push("Coverage must fail closed and require review");
const seen = new Set();
for (const item of data.capabilities ?? []) {
  if (!item.capability || seen.has(item.capability)) errors.push(`Missing or duplicate capability: ${item.capability}`);
  seen.add(item.capability);
  if (!Array.isArray(item.source_ids) || item.source_ids.length === 0) errors.push(`Capability has no source mapping: ${item.capability}`);
  for (const id of item.source_ids ?? []) if (!sourceIds.has(id)) errors.push(`Unknown source_id ${id} for ${item.capability}`);
  if (!["DISCOVERY_ONLY","AUTHORISED_PROVIDER_REQUIRED","SOURCE_GAP"].includes(item.coverage_state)) errors.push(`Invalid coverage state: ${item.capability}`);
  if (item.route_state !== "NOT_CONNECTED" || item.public_safe !== false || item.review_required !== true) errors.push(`Unsafe default for ${item.capability}`);
  if (!Array.isArray(item.evidence_required) || !item.evidence_required.length || !item.limitations) errors.push(`Evidence requirements/limitations missing: ${item.capability}`);
}
for (const capability of expected) if (!seen.has(capability)) errors.push(`Service capability missing from matrix: ${capability}`);
for (const capability of seen) if (!expected.includes(capability)) errors.push(`Unknown service capability: ${capability}`);
if (data.promotion_rules?.length < 5) errors.push("Expected explicit promotion/fail-closed rules");
if (errors.length) {
  console.error("Cross-sector capability coverage validation FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Cross-sector capability coverage validation PASSED: ${seen.size} capabilities mapped; all source IDs resolve; all routes remain NOT_CONNECTED and non-public-safe.`);
}
