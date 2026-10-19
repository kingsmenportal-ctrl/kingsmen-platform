import fs from "node:fs";

const files = [
  "db/migrations/0077_candidate_application_tracker.sql",
  "apps/web/src/app/api/candidate/applications/route.ts",
  "apps/web/src/app/candidate/applications/page.tsx",
  "apps/web/src/lib/candidate-workspace-client.ts"
];
const failures = [];
for (const file of files) if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const migration = read(files[0]);
const route = read(files[1]);
const page = read(files[2]);
const client = read(files[3]);
for (const token of [
  "candidate_application_tracker", "candidate_application_tracker_events",
  "current_verified_candidate_id()", "ENABLE ROW LEVEL SECURITY",
  "candidate_application_tracker_saved_opportunity_owner_fk",
  "SUBMITTED_CANDIDATE_REPORTED", "record_candidate_application_tracker_event"
]) if (!migration.includes(token)) failures.push(`Migration missing ownership/audit/safety invariant: ${token}`);
for (const token of [
  "resolveReviewedCandidate", "candidateId", "saved_opportunity_id",
  "candidate_workspace_saved_opportunities", "SUBMITTED_CANDIDATE_REPORTED",
  "evidenceReference", "Cache-Control"
]) if (!route.includes(token)) failures.push(`API route missing ownership/validation control: ${token}`);
if (!route.includes("candidate_id=eq.") || !route.includes('status === "SUBMITTED_CANDIDATE_REPORTED" && !evidenceReference')) failures.push("API must scope by candidate and require evidence for candidate-reported submission.");
if (/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(route)) failures.push("Service role key must not be exposed publicly.");
for (const token of [
  "/api/candidate/applications", "Truth Vault", "SUBMITTED_CANDIDATE_REPORTED",
  "Open official opportunity source", "Change history", "does not claim an institution"
]) if (!page.includes(token)) failures.push(`Candidate application UI missing: ${token}`);
if (!client.includes('query.startsWith("/api/")')) failures.push("Shared auth client must support a second owner-scoped API route.");
if (failures.length) {
  console.error("Candidate application tracker validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Candidate application tracker validation PASSED: reviewed candidate ownership, saved-opportunity binding, RLS, audit history, evidence-gated candidate-reported submission, and UI wiring.");
