import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = await readFile(path.join(root, "apps/web/src/lib/candidate-application-draft-contract.ts"), "utf8");
const route = await readFile(path.join(root, "apps/web/src/app/api/candidate/application-draft/route.ts"), "utf8");
const page = await readFile(path.join(root, "apps/web/src/app/candidate/applications/[applicationId]/page.tsx"), "utf8");

for (const field of ["given_name", "family_name", "date_of_birth", "nationality", "contact_email"]) {
  assert.ok(contract.includes(`"${field}"`), `required field contract missing: ${field}`);
}
for (const behavior of [
  "validateCandidateDraftAnswers",
  "validateCandidateApplicationAnswerData",
  "submissionReadiness",
  "assertCandidateDraftVersion",
  "isValidIdempotencyKey",
  "canEditCandidateDraft"
]) {
  assert.ok(contract.includes(`function ${behavior}`), `draft lifecycle helper missing: ${behavior}`);
}
assert.match(route, /AUTHENTICATION_REQUIRED/);
assert.match(route, /readLimitedJson\(request, BODY_LIMIT\)/);
assert.match(route, /get_candidate_application_draft/);
assert.match(route, /save_candidate_application_draft/);
assert.match(route, /p_expected_version/);
assert.match(route, /p_idempotency_key/);
assert.match(route, /normalizeCandidateApplicationAnswerData\(incoming\.answer_data\)/);
assert.match(route, /validateCandidateApplicationAnswerData\(answerData\)/);
assert.match(route, /APPLICATION_DRAFT_ANSWERS_INVALID/);
assert.match(route, /Cache-Control.*no-store/);
assert.match(route, /IDENTITY_OR_OWNERSHIP_REQUIRED/);
assert.match(route, /APPLICATION_DRAFT_VERSION_CONFLICT/);
assert.match(page, /APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT/);
assert.match(page, /Choose “Reload saved draft” to reconcile the latest saved version/);
assert.match(page, /This did not submit your application to a provider/);
assert.match(contract, /additional_answers\.length > 20/);
assert.match(contract, /motivation_statement: 5000/);
assert.match(contract, /qualifications_summary: 3000/);

console.log("Candidate application draft contract checks passed.");
