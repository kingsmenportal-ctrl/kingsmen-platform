import fs from "node:fs";

const files = {
  trackerMigration: "db/migrations/0077_candidate_application_tracker.sql",
  preparationMigration: "db/migrations/0078_candidate_application_preparation_readiness.sql",
  trackerRoute: "apps/web/src/app/api/candidate/applications/route.ts",
  preparationRoute: "apps/web/src/app/api/candidate/applications/preparation/route.ts",
  trackerPage: "apps/web/src/app/candidate/applications/page.tsx",
  preparationPage: "apps/web/src/app/candidate/applications/preparation/page.tsx",
  client: "apps/web/src/lib/candidate-workspace-client.ts",
  integration: "scripts/tests/test-candidate-application-tracker-api.mjs"
};
const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
for (const file of Object.values(files)) if (!fs.existsSync(file)) failures.push("Missing " + file);
const sources = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));
for (const token of [
  "candidate_application_tracker", "candidate_application_tracker_events",
  "current_verified_candidate_id()", "ENABLE ROW LEVEL SECURITY",
  "candidate_application_tracker_saved_opportunity_owner_fk",
  "SUBMITTED_CANDIDATE_REPORTED", "record_candidate_application_tracker_event"
]) if (!sources.trackerMigration.includes(token)) failures.push("Tracker migration missing invariant: " + token);
for (const token of [
  "candidate_application_preparation_items", "candidate_application_preparation_events",
  "current_verified_candidate_id()", "ENABLE ROW LEVEL SECURITY",
  "candidate_application_preparation_tracker_owner_fk", "READY_CANDIDATE_REPORTED",
  "record_candidate_application_preparation_event", "official_source_url = '' OR official_source_url ~ '^https://'"
]) if (!sources.preparationMigration.includes(token)) failures.push("Preparation migration missing invariant: " + token);
for (const token of ["resolveReviewedCandidate", "candidateId", "candidate_workspace_saved_opportunities", "evidenceReference", "Cache-Control"]) {
  if (!sources.trackerRoute.includes(token)) failures.push("Tracker API missing owner/evidence control: " + token);
}
if (!sources.trackerRoute.includes('status === "SUBMITTED_CANDIDATE_REPORTED" && !evidenceReference')) failures.push("Tracker API must require evidence for candidate-reported submission.");
for (const token of ["resolveReviewedCandidate", "ownTracker", "candidate_application_preparation_items", "candidate_application_preparation_events", "officialSourceUrl", "READY_CANDIDATE_REPORTED", "verificationBoundary"]) {
  if (!sources.preparationRoute.includes(token)) failures.push("Preparation API missing owner/evidence boundary: " + token);
}
if (!sources.preparationRoute.includes('status === "READY_CANDIDATE_REPORTED" && !evidenceReference')) failures.push("Preparation API must require evidence before candidate reports an item ready.");
if (/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(sources.trackerRoute + sources.preparationRoute)) failures.push("Service role key must not be exposed publicly.");
for (const token of ["/api/candidate/applications", "Truth Vault", "SUBMITTED_CANDIDATE_REPORTED", "Open official opportunity source", "Change history", "preparation"]) {
  if (!sources.trackerPage.includes(token)) failures.push("Tracker UI missing integration: " + token);
}
for (const token of ["/api/candidate/applications/preparation", "official source", "READY_CANDIDATE_REPORTED", "evidence reference", "candidate-reported", "does not invent institution-specific requirements"]) {
  if (!sources.preparationPage.toLowerCase().includes(token.toLowerCase())) failures.push("Preparation UI missing requirement: " + token);
}
if (!sources.client.includes('query.startsWith("/api/")')) failures.push("Shared auth client must support owner-scoped APIs.");
for (const token of ["candidate_application_preparation_items", "cross-candidate isolation", "missingEvidence", "audit history"]) {
  if (!sources.integration.toLowerCase().includes(token.toLowerCase())) failures.push("Integration coverage missing: " + token);
}
if (failures.length) {
  console.error("Candidate application preparation validation FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("Candidate application preparation validation PASSED: verified-candidate ownership, tracker binding, RLS, HTTPS official-source links, evidence-gated candidate-reported readiness, audit history, and UI/API wiring.");
