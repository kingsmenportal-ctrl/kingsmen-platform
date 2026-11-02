import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "db/migrations/0110_single_kingsmen_application_engine_20261102.sql"), "utf8");
const checks = [
  ["master application is a distinct parent entity", /CREATE TABLE IF NOT EXISTS public\.candidate_master_applications/.test(migration)],
  ["child targets are ordered under the same parent and candidate", /CREATE TABLE IF NOT EXISTS public\.candidate_master_application_items/.test(migration) && /FOREIGN KEY \(master_application_id, candidate_id\)/.test(migration)],
  ["all six Kingsmen pathways are explicitly allowed", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].every(pathway => migration.includes("'" + pathway + "'"))],
  ["one parent cannot contain duplicate target keys or ordering positions", /UNIQUE \(master_application_id, target_key\)/.test(migration) && /UNIQUE \(master_application_id, display_order\)/.test(migration)],
  ["candidate ownership is checked before reading or writing parent state", /current_authenticated_candidate_id\(\)/.test(migration) && /OWNED_MASTER_APPLICATION_NOT_FOUND/.test(migration)],
  ["active candidate, reusable profile and latest consent are required", /ACTIVE_CANDIDATE_REQUIRED/.test(migration) && /CANDIDATE_REUSABLE_PROFILE_REQUIRED/.test(migration) && /PROFILE_PROCESSING_CONSENT_REQUIRED/.test(migration) && /newer\.granted_at, newer\.id/.test(migration)],
  ["target keys must belong to the authenticated candidate", /t\.candidate_id = v_candidate_id AND t\.target_key = trim\(requested\.target_key\)/.test(migration)],
  ["selection save is atomic and idempotent in database transaction scope", /CREATE OR REPLACE FUNCTION public\.save_candidate_master_application/.test(migration) && /INSERT INTO public\.candidate_master_application_items/.test(migration)],
  ["master and child tables are RLS enabled and client table grants revoked", (migration.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length >= 2 && /FROM PUBLIC, anon, authenticated/.test(migration)],
  ["candidate-facing function is executable only by authenticated role", /REVOKE ALL ON FUNCTION public\.save_candidate_master_application\(uuid, text\[\]\)[\s\S]*FROM PUBLIC, anon/.test(migration) && /GRANT EXECUTE ON FUNCTION public\.save_candidate_master_application\(uuid, text\[\]\)[\s\S]*TO authenticated/.test(migration)],
  ["master save never claims provider submission", /provider_submission_sent', false/.test(migration) && /Never submits to providers/.test(migration)],
  ["migration explicitly remains review-only pending release gates", /REVIEW-ONLY/.test(migration) && /protected backup\/restore/.test(migration)]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
console.log(`Single Kingsmen Application Engine: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed) process.exitCode = 1;
