import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20261029194500_reconcile_cao_client_privileges_and_active_candidate_cap.sql"), "utf8");
const failures = [];
const check = (name, condition) => {
  console.log((condition ? "PASS " : "FAIL ") + name);
  if (!condition) failures.push(name);
};

check("migration is transactional and ordered before the CAO 0096 read-only attestation", migration.startsWith("-- Corrective migration between the last recorded 0095 migration") && migration.includes("BEGIN;") && migration.trimEnd().endsWith("COMMIT;"));
check("preflight refuses schema drift, invalid cap configuration and overflow", migration.includes("ACTIVE_CANDIDATE_CAP_SCHEMA_MISMATCH") && migration.includes("CAO_BRIDGE_SCHEMA_MISMATCH") && migration.includes("ACTIVE_CANDIDATE_CAP_CONFIG_INVALID") && migration.includes("ACTIVE_CANDIDATE_CAP_PREEXISTING_OVERFLOW"));
check("CAO client table grants are revoked and backend CRUD is explicit", migration.includes("REVOKE ALL PRIVILEGES ON TABLE public.cao_choice_items FROM PUBLIC, anon, authenticated") && migration.includes("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cao_choice_items TO service_role"));
check("active-candidate cap reads the approved runtime setting", migration.includes("KINGSMEN_CAP_ACTIVE_CANDIDATES") && migration.includes("v_cap NOT IN (500,1000,5000,10000,25000)") && migration.includes("ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED"));
check("active-candidate admission is concurrency-safe and does not block deactivation", migration.includes("hashtextextended('kingsmen.active-candidate-admission.v1', 0)") && migration.includes("v_active_count >= v_cap") && migration.includes("candidates_active_capacity_guard") && migration.includes("IF NEW.is_active IS NOT TRUE") && migration.includes("IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE"));
check("security-definer function has a fixed search path and no client execute grants", migration.includes("SECURITY DEFINER") && migration.includes("SET search_path = pg_catalog, public, pg_temp") && migration.includes("REVOKE ALL PRIVILEGES ON FUNCTION public.enforce_candidate_active_capacity() FROM PUBLIC, anon, authenticated"));
check("postflight verifies client grants, trigger and configured cap", migration.includes("CAO_CLIENT_PRIVILEGE_POSTFLIGHT_FAILED") && migration.includes("ACTIVE_CANDIDATE_CAP_TRIGGER_POSTFLIGHT_FAILED") && migration.includes("ACTIVE_CANDIDATE_CAP_POSTFLIGHT_FAILED"));
check("migration does not fabricate migration ledger history", !migration.toLowerCase().includes("insert into supabase_migrations.schema_migrations") && migration.includes("does not fabricate history for 0096-0098"));
console.log("CAO privilege and dynamic active-candidate cap migration contract: " + (failures.length ? "FAILED" : "PASS") + " (" + failures.length + " failures)");
if (failures.length) process.exit(1);
