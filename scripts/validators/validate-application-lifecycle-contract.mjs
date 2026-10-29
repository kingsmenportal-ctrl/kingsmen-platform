#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const initial = read("db/migrations/0047_candidate_route_application_tracker.sql");
const integrity = read("db/migrations/0049_candidate_application_source_integrity.sql");
const policy = read("apps/api/src/routes/application-lifecycle-policy.ts");
const cao = read("apps/api/src/routes/cao-boundary.ts");

const checks = [];
const check = (name, condition) => { checks.push({ name, pass: Boolean(condition) }); assert.ok(condition, name); };
check("route tracker has immutable candidate-owned source identity", integrity.includes("new.user_id is distinct from old.user_id") && integrity.includes("new.route_programme_id is distinct from old.route_programme_id"));
check("route tracker enforces exactly one source", initial.includes("candidate_route_application_exact_source") && initial.includes("route_programme_id is not null and organisation_listing_id is null"));
check("route tracker enables RLS and authenticated owner checks", initial.includes("enable row level security") && initial.includes("user_id=(select auth.uid())"));
check("candidate submission requires reference and timestamp", integrity.includes("candidate_reported_submitted_at is not null") && integrity.includes("length(trim(candidate_submission_reference))"));
check("provider statuses are not accepted without verified provider-origin evidence in adapter", policy.includes('sourceKind !== "PROVIDER_ORIGIN"') && policy.includes("verifiedByAuthUserId") && policy.includes("isUuid(e.verifiedByAuthUserId)"));
check("candidate submission never implies provider confirmation", policy.includes("this is not provider-confirmed receipt"));
check("legacy applications workflow statuses remain unresolved absent evidence-backed mapping", policy.includes('if (input.source !== "candidate_route_applications")') && policy.includes('status: "LEGACY_UNRESOLVED"'));
check("CAO boundary delegates to one shared child-choice policy", cao.includes("validateApplicationChildChoices(choices)") && policy.includes("one parent Kingsmen application"));

console.log(JSON.stringify({
  schema: "kingsmen.application-lifecycle-contract.v1",
  passed: true,
  assertions: checks.length,
  checks,
  scope: "source contract only; staging row counts, Auth identity linking, and authenticated E2E remain separate proof gates"
}, null, 2));
