import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const webDirectory = path.resolve(root, "apps/web");
const require = createRequire(path.join(webDirectory, "package.json"));
const ts = require("typescript");

const statusPath = "apps/web/src/lib/candidate-application-status.ts";
const statusSource = read(statusPath);
const proposal = read("docs/rebuild/proposals/candidate-application-status-contract.proposal.sql");
const transpiled = ts.transpileModule(statusSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
});
const runtimeUrl = "data:text/javascript;base64," + Buffer.from(transpiled.outputText, "utf8").toString("base64");
const statusContract = await import(runtimeUrl);

const expectedStatuses = [
  "Draft",
  "Submitted to Kingsmen",
  "Under review",
  "Action required",
  "Prepared for provider",
  "Provider receipt confirmed",
  "Decision recorded"
];
assert.deepEqual(statusContract.CANDIDATE_APPLICATION_STATUSES, expectedStatuses);
assert.equal(statusContract.normalizeCandidateFacingApplicationStatus("Draft"), "Draft");
assert.equal(statusContract.normalizeCandidateFacingApplicationStatus("Decision recorded"), "Decision recorded");
assert.equal(statusContract.normalizeCandidateFacingApplicationStatus("READY_TO_SUBMIT"), null,
  "Internal workflow states must not be promoted to candidate-facing statuses.");
assert.equal(statusContract.normalizeCandidateFacingApplicationStatus(undefined), null);
assert.equal(statusContract.candidateFacingApplicationStatusLabel("PROVIDER_REVIEW"), "Status not available");
assert.equal(statusContract.candidateFacingApplicationStatusLabel("Under review"), "Under review");

const expectedGuidance = {
  "Draft": "Next step: continue your draft",
  "Submitted to Kingsmen": "Next step: follow Kingsmen review updates",
  "Under review": "Next step: check for a Kingsmen update",
  "Action required": "Next step: review the required action",
  "Prepared for provider": "Next step: verify provider submission instructions",
  "Provider receipt confirmed": "Next step: keep the provider receipt evidence",
  "Decision recorded": "Next step: review the recorded decision"
};
for (const [status, heading] of Object.entries(expectedGuidance)) {
  assert.equal(statusContract.candidateApplicationStatusGuidance(status)?.heading, heading,
    `Candidate guidance should exist for ${status}`);
  assert.ok(statusContract.candidateApplicationStatusGuidance(status)?.detail.length > 20,
    `Candidate guidance should explain the safe next step for ${status}`);
}
assert.equal(statusContract.candidateApplicationStatusGuidance("PROVIDER_REVIEW"), null,
  "Unknown internal machine states must not receive an invented candidate action.");
assert.equal(statusContract.candidateApplicationStatusGuidance(null), null,
  "Missing status must keep the explicit unavailable-status fallback.");

assert.equal(statusContract.isCandidateEditableApplicationStatus("Draft"), true);
assert.equal(statusContract.isCandidateEditableApplicationStatus("Action required"), true);
assert.equal(statusContract.isCandidateEditableApplicationStatus("Submitted to Kingsmen"), false);
assert.equal(statusContract.isCandidateEditableApplicationStatus("READY_TO_SUBMIT"), false);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Draft", "READY_TO_SUBMIT"), true);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Action required", "READINESS_BLOCKED"), true);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Submitted to Kingsmen", "DRAFT"), false);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Draft", "SUBMITTED_CONFIRMED"), false);
assert.ok(proposal.includes("APPLICATION_KINGSMEN_STATUS_MAPPING_REQUIRED"), "Progressed rows need explicit reviewed status mapping.");
assert.ok(proposal.includes("SET readiness_status"), "Draft save must invalidate prior readiness.");
assert.ok(proposal.includes("v_application.kingsmen_status NOT IN"), "Only approved candidate-facing statuses may be edited.");
assert.ok(proposal.includes("candidate_applications_kingsmen_status_check"), "The database contract must constrain candidate-facing labels.");
assert.ok(proposal.includes("APPLICATION_DRAFT_SAVED"), "Draft saves must retain the append-only audit event.");
assert.ok(!proposal.includes("SET status ="), "Draft save must not rewrite the internal workflow status.");

console.log("PASS: seven approved candidate-facing application statuses are exact and runtime-validated");
console.log("PASS: unknown/internal machine states remain unavailable, not candidate-facing labels");
console.log("PASS: draft resume requires both an editable Kingsmen status and a pre-submission workflow state");

const tracker = read("apps/web/src/components/candidate/CandidateApplicationTracker.tsx");
const workbench = read("apps/web/src/components/candidate/CandidateApplicationWorkbench.tsx");
const page = read("apps/web/src/app/candidate/applications/[applicationId]/page.tsx");
const service = read("supabase/functions/candidate-application-preparation/index.ts");
assert.match(tracker, /candidateFacingApplicationStatusLabel\(application\.kingsmen_status\)/);
assert.doesNotMatch(tracker, /<span[^>]*>\{label\(application\.status\)\}<\/span>/);
assert.match(workbench, /candidateFacingApplicationStatusLabel\(parent\.kingsmen_status\)/);
assert.doesNotMatch(workbench, /Application state:\s*\{parent\.status\}/);
assert.match(page, /body\.is_editable === true/);
assert.match(page, /isCandidateEditableApplicationStatus\(application\.kingsmen_status\)/);
assert.doesNotMatch(page, /status:\s*"DRAFT"/,
  "A draft save in the client must not rewrite the internal workflow state.");
const applicationSelect = service.match(
  /admin\.from\(["']candidate_applications["']\)\s*\.select\(["']([^"']+)["']\)/
);
assert.ok(applicationSelect, "Candidate preparation must keep an explicit application column list.");
const selectedApplicationColumns = applicationSelect[1].split(",").map(column => column.trim());
assert.ok(selectedApplicationColumns.includes("status") && selectedApplicationColumns.includes("readiness_status"));
assert.ok(!selectedApplicationColumns.includes("kingsmen_status"),
  "Do not query the candidate-facing status column until the separately reviewed migration is installed.");

console.log("PASS: tracker, workbench and editor consume the candidate-facing contract while the service query remains compatible with the current staging schema");
console.log("Candidate application status contract: 4/4 groups passed");
