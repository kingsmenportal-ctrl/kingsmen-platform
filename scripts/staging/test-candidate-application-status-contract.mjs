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

assert.equal(statusContract.isCandidateEditableApplicationStatus("Draft"), true);
assert.equal(statusContract.isCandidateEditableApplicationStatus("Action required"), true);
assert.equal(statusContract.isCandidateEditableApplicationStatus("Submitted to Kingsmen"), false);
assert.equal(statusContract.isCandidateEditableApplicationStatus("READY_TO_SUBMIT"), false);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Draft", "READY_TO_SUBMIT"), true);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Action required", "READINESS_BLOCKED"), true);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Submitted to Kingsmen", "DRAFT"), false);
assert.equal(statusContract.canResumeCandidateApplicationDraft("Draft", "SUBMITTED_CONFIRMED"), false);
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
assert.match(service, /select\("id,application_ref,pathway_type,status,kingsmen_status,readiness_status/);
console.log("PASS: tracker, workbench, draft editor and authenticated service consume the candidate-facing contract");
console.log("Candidate application status contract: 4/4 groups passed");
