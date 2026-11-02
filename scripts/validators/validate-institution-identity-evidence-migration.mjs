#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const migration = readFileSync(resolve(root, "db/migrations/20261102010000_institution_identity_and_application_evidence.sql"), "utf8");
const checks = [];
const check = (name, condition) => {
  checks.push({ name, pass: Boolean(condition) });
  assert.ok(condition, name);
};

check("provider aliases retain provider FK and normalized uniqueness",
  migration.includes("references public.route_providers(id) on delete restrict") &&
  migration.includes("normalized_alias") && migration.includes("unique(provider_id, normalized_alias)"));
check("campuses have distinct identity, location and official-source evidence",
  migration.includes("create table public.route_provider_campuses") &&
  migration.includes("campus_key") && migration.includes("province text") &&
  migration.includes("source_url text not null check (source_url ~ '^https://')") &&
  migration.includes("verification_status"));
check("institution register observations preserve dated distinct regulatory statuses",
  migration.includes("create table public.institution_register_observations") &&
  migration.includes("source_snapshot_date date not null") &&
  migration.includes("'REGISTERED','PROVISIONAL','CANCELLED','LAPSED'") &&
  migration.includes("reconciliation_status"));
check("eligibility decisions are persisted and versioned",
  migration.includes("create table public.candidate_application_eligibility_decisions") &&
  migration.includes("evaluator_version") && migration.includes("rules_snapshot") &&
  migration.includes("'ELIGIBLE','INELIGIBLE','REVIEW_REQUIRED','INSUFFICIENT_EVIDENCE'"));
check("handoff and provider receipt are separate event types",
  migration.includes("create table public.candidate_application_handoff_events") &&
  migration.includes("'HANDOFF_PREPARED','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED','PROVIDER_RECEIPT_CONFIRMED'") &&
  migration.includes("event_type <> 'PROVIDER_RECEIPT_CONFIRMED'") &&
  migration.includes("evidence_origin in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED')"));
check("all new tables enable RLS and deny browser-role grants",
  (migration.match(/enable row level security/g) ?? []).length === 5 &&
  (migration.match(/revoke all on public\./g) ?? []).length === 5 &&
  !/grant\s+(?:select|insert|update|delete|all)[^;]*\s+to\s+(?:public|anon|authenticated)/i.test(migration));
check("migration is transactional",
  migration.trimStart().startsWith("-- Institution identity evidence") &&
  migration.includes("begin;") && migration.trimEnd().endsWith("commit;"));

console.log(JSON.stringify({
  schema: "kingsmen.institution-identity-evidence-migration-contract.v1",
  passed: true,
  assertions: checks.length,
  checks,
  note: "Static contract only. Does not prove migration application, database compatibility, RLS runtime behavior, or authenticated staging tests."
}, null, 2));
