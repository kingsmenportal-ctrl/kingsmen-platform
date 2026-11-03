import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/migrations/0107_application_capacity_entitlements_20261101.sql");
const releaseCapacityFunction = migration.split("CREATE OR REPLACE FUNCTION public.release_candidate_application_capacity(")[1]?.split("$function$;")[0] ?? "";
const api = read("apps/web/src/app/api/candidate/application-capacity/route.ts");
const page = read("apps/web/src/app/candidate/application-capacity/page.tsx");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");
const tracker = read("apps/web/src/app/candidate/applications/page.tsx");
const packageJson = JSON.parse(read("package.json"));
const postgresWorkflow = read(".github/workflows/candidate-experience-ci.yml");
const postgresBootstrap = read("scripts/staging/fixtures/application-capacity-postgres-bootstrap.sql");
const postgresTest = read("scripts/staging/test-application-capacity-postgres.sql");

const checks = [
  ["order-time priority cap is stored in a normalized finance_orders column", /ADD COLUMN IF NOT EXISTS priority_application_count integer/.test(migration) && /finance_orders_priority_application_count_chk/.test(migration)],
  ["legacy JSON entitlement snapshot is never queried by the capacity service", !/\.entitlement_snapshot|->>?.*entitlement_snapshot/.test(migration + api + page)],
  ["new finance orders capture active catalogue limits at creation", /capture_finance_order_capacity_terms/.test(migration) && /finance_plan_catalog/.test(migration) && /KINGSMEN_CAPACITY_2026_11_01_V1/.test(migration)],
  ["order-time entitlement fields cannot be altered after creation", /FINANCE_ORDER_CAPACITY_TERMS_ARE_IMMUTABLE/.test(migration)],
  ["capacity requires a PAID order and a matching COMPLETE verified payment", /fo\.order_status='PAID'/.test(migration) && /fp\.payment_status='COMPLETE'/.test(migration) && /fp\.verified IS TRUE/.test(migration) && /fp\.amount_gross_cents=fo\.amount_cents/.test(migration)],
  ["only active ZAR service terms grant priority or managed capacity", /fo\.currency='ZAR'/.test(migration) && /fo\.service_term_days>0/.test(migration) && /period_expires_at/.test(migration)],
  ["capacity release declares its own transaction timestamp for identity-link freshness", migration.includes("CREATE OR REPLACE FUNCTION public.release_candidate_application_capacity(") && migration.includes("v_now timestamptz:=clock_timestamp()")],
  ["capacity release takes an exclusive parent-application lock before checking for new submission work", releaseCapacityFunction.includes("WHERE ca.id=v_reservation.application_id AND ca.candidate_id=v_candidate FOR UPDATE")],
  ["capacity release is blocked by any downstream submission job for the exact candidate application", releaseCapacityFunction.includes("IF EXISTS (") && releaseCapacityFunction.includes("FROM public.candidate_application_submission_jobs sj") && releaseCapacityFunction.includes("sj.application_id=v_reservation.application_id") && releaseCapacityFunction.includes("sj.candidate_id=v_candidate")],
  ["capacity release locks its parent application before checking submission history and mutating the reservation", releaseCapacityFunction.indexOf("WHERE ca.id=v_reservation.application_id AND ca.candidate_id=v_candidate FOR UPDATE;") >= 0 && releaseCapacityFunction.indexOf("WHERE ca.id=v_reservation.application_id AND ca.candidate_id=v_candidate FOR UPDATE;") < releaseCapacityFunction.indexOf("FROM public.candidate_application_submission_jobs sj") && releaseCapacityFunction.indexOf("FROM public.candidate_application_submission_jobs sj") < releaseCapacityFunction.indexOf("UPDATE public.candidate_application_capacity_reservations")],
  ["capacity release is blocked by submission-attempt, dispatch, provider-acknowledgement and outcome events", ["SUBMISSION_AUTHORIZED","SUBMISSION_ATTEMPT_CREATED","SUBMISSION_DISPATCHED","PROVIDER_ACKNOWLEDGED","PROVIDER_STATUS_RECORDED","PROVIDER_OUTCOME_RECORDED","REVIEW_DECISION_RECORDED","OUTCOME_RECORDED","OUTCOME_DISPUTED","OUTCOME_CORRECTION_DECIDED","OUTCOME_SUPERSEDED"].every(event => releaseCapacityFunction.includes("'" + event + "'"))],
  ["finance orders match the Auth-bound candidate UUID while consent uses public_ref", /v_candidate_ref:=v_candidate::text/.test(migration) && /fo\.candidate_ref=v_candidate_ref/.test(migration) && /cv\.candidate_ref=v_candidate_ref/.test(migration) && /pc\.candidate_ref=v_public_ref/.test(migration)],
  ["candidate identity is derived from exactly one verified auth link", /auth\.uid\(\)/.test(migration) && /link_status='VERIFIED'/.test(migration) && /v_count<>1/.test(migration) && /verified_by IS NOT NULL/.test(migration)],
  ["reservations are candidate/application bound and idempotent", /FOREIGN KEY \(application_id,candidate_id\)/.test(migration) && /UNIQUE \(candidate_id,idempotency_key\)/.test(migration) && /candidate_capacity_one_active_use_per_application_uq/.test(migration)],
  ["allocation uses a transaction advisory lock before checking usage", /pg_advisory_xact_lock/.test(migration) && /candidate-application-capacity:/.test(migration)],
  ["active reservations remain counted across overlapping plan upgrades", !migration.includes("r.entitlement_order_ref=v_order.order_ref") && /r.period_expires_at>v_now/.test(migration)],
  ["priority and managed-route usage are accounted independently", /PRIORITY_APPLICATION/.test(migration) && /MANAGED_ROUTE/.test(migration) && /priority_application_limit/.test(migration) && /managed_route_limit/.test(migration)],
  ["CV Revamp bonus requires prior verified CV Revamp ownership", /cv\.plan_code='CV_REVAMP_R49_99'/.test(migration) && /cvp\.verified IS TRUE/.test(migration) && /cvp\.verified_at<=v_order\.verified_at/.test(migration)],
  ["catalogue access is explicitly independent of paid capacity", /ALL_SIX_PATHWAYS/.test(migration)],
  ["capacity events are append-only", /prevent_candidate_capacity_event_mutation/.test(migration) && /BEFORE UPDATE OR DELETE ON public\.candidate_application_capacity_events/.test(migration)],
  ["reservation tables use RLS and client roles receive no direct table privileges", /ENABLE ROW LEVEL SECURITY/.test(migration) && /FROM PUBLIC,anon,authenticated/.test(migration)],
  ["authenticated role receives only the three capacity RPCs", /GRANT EXECUTE ON FUNCTION public\.get_candidate_application_capacity\(\) TO authenticated/.test(migration) && /GRANT EXECUTE ON FUNCTION public\.reserve_candidate_application_capacity/.test(migration) && /GRANT EXECUTE ON FUNCTION public\.release_candidate_application_capacity/.test(migration)],
  ["API forwards caller bearer and anon key only, never service role", /Authorization: authorization/.test(api) && /apikey: config\.anonKey/.test(api) && !/SUPABASE_SERVICE_ROLE_KEY/.test(api)],
  ["API strictly validates reserve/release actions and inputs", /reserve_candidate_application_capacity/.test(api) && /release_candidate_application_capacity/.test(api) && /USAGE_TYPES/.test(api) && /UUID\.test/.test(api)],
  ["capacity reads only the latest PayFast payment state", migration.includes("p.provider='PAYFAST'") && migration.includes("ORDER BY p.created_at DESC,p.payment_ref DESC LIMIT 1")],
  ["reserve locks the paid order and exact verified payment during allocation", migration.includes("v_payment_ref:=v_summary->>'verified_payment_ref'") && migration.includes("fo.order_status='PAID'") && migration.includes("FOR SHARE") && migration.includes("fp.amount_gross_cents=(") && migration.includes("fp.verified_at=v_period_start")],
  ["candidate UI loads capacity from backend and supports reserve/release", /\/api\/candidate\/application-capacity/.test(page) && /action: "reserve"/.test(page) && /action: "release"/.test(page) && /crypto\.randomUUID\(\)/.test(page)],
  ["UI preserves all six pathways regardless of plan", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].every(x => page.includes(x))],
  ["candidate dashboard and application tracker link to capacity", /candidate\/application-capacity/.test(dashboard) && /candidate\/application-capacity/.test(tracker)],
  ["capacity contract runs in Candidate Experience CI", /validate-application-capacity-entitlements\.mjs/.test(packageJson.scripts["candidate:experience:check"])],
  ["Candidate Experience CI provisions an isolated PostgreSQL 17 service", /image:\s*postgres:17/.test(postgresWorkflow) && /PGHOST:\s*localhost/.test(postgresWorkflow)],
  ["CI bootstraps, applies migration 0107 and executes the PostgreSQL integration suite in order", postgresWorkflow.indexOf("application-capacity-postgres-bootstrap.sql")>=0 && postgresWorkflow.indexOf("0107_application_capacity_entitlements_20261101.sql")>postgresWorkflow.indexOf("application-capacity-postgres-bootstrap.sql") && postgresWorkflow.indexOf("test-application-capacity-postgres.sql")>postgresWorkflow.indexOf("0107_application_capacity_entitlements_20261101.sql")],
  ["PostgreSQL fixture defines isolated test roles and a test Auth uid without provider or staging credentials", postgresBootstrap.includes("CREATE ROLE authenticated NOLOGIN") && postgresBootstrap.includes("CREATE ROLE service_role NOLOGIN BYPASSRLS") && postgresBootstrap.includes("CREATE OR REPLACE FUNCTION auth.uid()") && !/SUPABASE_SERVICE_ROLE_KEY|PAYFAST_MERCHANT_KEY|DATABASE_URL/.test(postgresBootstrap)],
  ["PostgreSQL integration covers order-time entitlement snapshots and immutable finance order terms", postgresTest.includes("order-time catalogue snapshot is incorrect") && postgresTest.includes("immutable order terms unexpectedly changed")],
  ["PostgreSQL integration covers verified settlement, prior-CV bonus and all-six-pathway access", postgresTest.includes("verified paid capacity summary or prior-CV bonus is incorrect") && postgresTest.includes("ALL_SIX_PATHWAYS") && postgresTest.includes("PAYFAST")],
  ["PostgreSQL integration tests idempotency and independent priority/managed capacity exhaustion", postgresTest.includes("idempotent retry did not reuse original reservation") && postgresTest.includes("priority capacity over-allocation was not rejected") && postgresTest.includes("managed-route over-allocation was not rejected")],
  ["PostgreSQL integration tests candidate isolation, ambiguous identity and least-privilege role grants", postgresTest.includes("candidate B released candidate A reservation") && postgresTest.includes("ambiguous Auth identity did not fail closed") && postgresTest.includes("authenticated role has direct capacity-table access")],
  ["PostgreSQL integration verifies downstream submission work blocks release and unused drafts can release", postgresTest.includes("release should be blocked when a submission job exists") && postgresTest.includes("release should be blocked when provider receipt event exists") && postgresTest.includes("unused editable draft reservation should release")],
  ["PostgreSQL integration verifies the capacity audit ledger is append-only", postgresTest.includes("capacity event update unexpectedly succeeded") && postgresTest.includes("candidate_application_capacity_events")]
];

let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
  if (!passed) failed++;
}
process.stdout.write("Application capacity entitlement contract: " + (checks.length - failed) + "/" + checks.length + " passed\n");
if (failed) process.exit(1);
