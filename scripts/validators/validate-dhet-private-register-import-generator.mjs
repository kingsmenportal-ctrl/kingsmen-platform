#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMigration, validateManifest } from "../institutions/build-dhet-private-register-evidence-migration.mjs";

const baseRecord = {
  source_record_ref: "private_higher_education:registered:001:2020/he07/001",
  source_register: "private_higher_education",
  source_section: "1. REGISTERED INSTITUTIONS",
  source_snapshot_date: "2026-07-06",
  canonical_name_candidate: "Example Higher Institute",
  normalized_name_key: "example-higher-institute",
  source_url: "https://www.dhet.gov.za/Registers_DocLib/example.pdf",
  source_excerpt: "Example Higher Institute 2020/HE07/001",
  registration_status: "REGISTERED",
  registration_identifier: "2020/HE07/001",
  registration_identifiers_observed: ["2020/HE07/001"],
  registration_status_review_required: false,
  identity_conflict_status: "NO_CONFLICT_DETECTED_REVIEW_STILL_REQUIRED",
  conflict_flags: [],
  import_eligible: true,
  identity_review_status: "VERIFIED_CANONICAL_IDENTITY",
  alias_reconciliation_status: "RECONCILED",
  campus_extraction_status: "REVIEWED",
  province_candidates: ["Gauteng"],
  province_status: "SOURCE_LISTED_CANDIDATE",
  campus_site_candidates: ["Main Campus, Johannesburg"],
  alias_candidates: [],
  possible_existing_provider_matches: [],
  official_route_status: "NOT_VERIFIED",
  integration_status: "NOT_CONNECTED",
  automation_authorized: false
};
const manifest = (record = baseRecord) => ({
  schema: "kingsmen.institutions.dhet-private-register-candidates.v1",
  records: [{ ...record }]
});
const valid = manifest();
assert.deepEqual(validateManifest(valid), [], "fully reviewed single-record fixture must validate");
const sql = buildMigration(valid);
for (const token of [
  "BEGIN;",
  "ON CONFLICT(source_register,source_snapshot_date,source_record_ref) DO UPDATE",
  "DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT",
  "DHET_REGISTER_REGISTRATION_STATUS_CONFLICT",
  "DHET_REGISTER_UNRESOLVED_RECORD_CONFLICT",
  "DHET_REGISTER_EXISTING_CANONICAL_IDENTITY_CONFLICT",
  "DHET_REGISTER_ROUTE_SAFETY_POSTFLIGHT_FAILED",
  "'NOT_VERIFIED','NOT_CONNECTED',false"
]) assert.ok(sql.includes(token), "generated migration contract missing " + token);

const blocked = [
  ["missing registration identifier", { registration_identifier: null, registration_identifiers_observed: [] }, "exactly one registration identifier"],
  ["registration identifier mismatch", { registration_identifier: "2020/HE07/002" }, "inconsistent registration identifier"],
  ["unresolved identity conflict", { identity_conflict_status: "CONFLICT_REVIEW_REQUIRED", conflict_flags: ["REGISTRATION_IDENTIFIER_REUSED_WITH_DIFFERENT_NAME"] }, "unresolved registration identity/status conflict"],
  ["duplicate source conflict", { identity_conflict_status: "DUPLICATE_SOURCE_ENTRY_REVIEW", conflict_flags: ["DUPLICATE_REGISTRATION_ENTRY"] }, "unresolved registration identity/status conflict"],
  ["status adjudication pending", { registration_status_review_required: true }, "unresolved registration status"],
  ["discontinuation request", { registration_status: "DISCONTINUATION_REQUESTED_REVIEW" }, "only a discontinuation request"],
  ["no import authorization", { import_eligible: false }, "not explicitly import-authorized"],
  ["canonical identity not verified", { identity_review_status: "NEEDS_CANONICAL_IDENTITY_REVIEW" }, "lacks verified canonical identity review"],
  ["provider alias not reconciled", { alias_reconciliation_status: "MANUAL_REVIEW_REQUIRED" }, "lacks completed alias/provider-key reconciliation"],
  ["campus/site not reviewed", { campus_extraction_status: "REVIEW_REQUIRED" }, "lacks completed campus/site review"],
  ["route improperly verified", { official_route_status: "OPEN" }, "unsafe route/integration state"],
  ["integration incorrectly connected", { integration_status: "CONNECTED" }, "unsafe route/integration state"],
  ["automation accidentally enabled", { automation_authorized: true }, "unsafe route/integration state"]
];
for (const [name, patch, expected] of blocked) {
  const errors = validateManifest(manifest({ ...baseRecord, ...patch }));
  assert.ok(errors.some((e) => e.includes(expected)), name + " must be blocked by the import generator");
}
const duplicateIdentity = manifest();
duplicateIdentity.records.push({
  ...baseRecord,
  source_record_ref: "private_higher_education:registered:002:2020/he07/001",
  canonical_name_candidate: "Different Institution",
  normalized_name_key: "different-institution"
});
assert.ok(
  validateManifest(duplicateIdentity).some((e) => e.includes("registration identifier maps to conflicting normalized names")),
  "one registration identifier must not resolve to two canonical institutions"
);
console.log("PASS DHET import generator functional fail-closed tests (" + blocked.length + " rejection cases plus duplicate-identity preflight)");
