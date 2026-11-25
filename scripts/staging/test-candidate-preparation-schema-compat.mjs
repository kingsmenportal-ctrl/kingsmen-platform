import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = (path) => readFileSync(resolve(root, path), "utf8");

const preparation = source("supabase/functions/candidate-application-preparation/index.ts");
const tracker = source("apps/web/src/components/candidate/CandidateApplicationTracker.tsx");
const statusHelper = source("apps/web/src/lib/candidate-application-status.ts");
const applicationEditor = source("apps/web/src/app/candidate/applications/[applicationId]/page.tsx");

// This query must stay compatible with the staging schema until the separately
// reviewed Kingsmen status-column migration has been approved and applied.
const selectMatch = preparation.match(
  /admin\.from\(["']candidate_applications["']\)\s*\.select\(["']([^"']+)["']\)/
);
assert.ok(selectMatch, "Candidate preparation must keep an explicit candidate_applications column list.");
const selectedColumns = selectMatch[1].split(",").map((column) => column.trim());
for (const requiredColumn of [
  "id",
  "application_ref",
  "pathway_type",
  "status",
  "readiness_status",
  "readiness_snapshot",
  "created_at",
  "updated_at"
]) {
  assert.ok(selectedColumns.includes(requiredColumn), `Candidate preparation must include current staging column ${requiredColumn}.`);
}
assert.ok(
  !selectedColumns.includes("kingsmen_status"),
  "Candidate preparation must not request the absent kingsmen_status column before the approved migration is applied."
);

// The UI must never invent a customer-facing status from internal workflow codes.
// An absent status remains visible as unavailable and blocks editing/resume.
assert.ok(
  statusHelper.includes('normalizeCandidateFacingApplicationStatus(value) ?? "Status not available"'),
  "Missing or unknown Kingsmen status must render as unavailable."
);
assert.ok(
  tracker.includes("canResumeCandidateApplicationDraft(application.kingsmen_status, application.status)"),
  "Tracker draft-resume eligibility must use the canonical status plus the internal pre-submission gate."
);
assert.ok(
  applicationEditor.includes("kingsmen_status?: CandidateFacingApplicationStatus | string | null;"),
  "Application editor must treat the not-yet-deployed candidate status field as optional."
);
assert.ok(
  applicationEditor.includes("!serverEditable || !isCandidateEditableApplicationStatus(application.kingsmen_status)"),
  "Application editor save must fail closed if server status/editability is absent or unapproved."
);

console.log("CANDIDATE_PREPARATION_SCHEMA_COMPAT_CONTRACT_PASSED");
console.log("- Candidate-preparation query uses only columns present in current staging schema.");
console.log("- Missing/unknown candidate-facing status remains unavailable, never inferred from internal states.");
console.log("- Draft-resume/edit paths fail closed until the approved status contract is deployed.");
