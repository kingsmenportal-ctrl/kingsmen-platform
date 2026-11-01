#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migrationPath = "db/migrations/0087_n14_connector_table_grant_hardening.sql";
const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

const requiredTables = [
  "integration_connectors",
  "workflow_connector_registry",
  "integration_outbox",
  "integration_inbox",
  "workflow_result_events",
  "webhook_security_events",
  "n8n_workflow_dispatches",
  "airtable_mirror_events",
  "playwright_probe_events",
  "integration_dead_letter_queue",
  "integration_health_snapshots"
];

assert.match(normalized, /^begin;\s*revoke all privileges on table /, "migration must run transactionally and revoke table privileges first");
assert.match(normalized, / from anon, authenticated, public;\s*commit;$/, "revoke must cover anon, authenticated, and PUBLIC and commit");
assert.doesNotMatch(normalized, /\bgrant\b/, "hardening migration must not add table privileges");
assert.doesNotMatch(normalized, /\bdrop\s+(?:table|schema|function)\b/, "migration must not drop database objects");

const revokeStatement = normalized.match(/revoke all privileges on table (.*?) from anon, authenticated, public;/);
assert.ok(revokeStatement, "expected one explicit REVOKE ALL table statement");
const listed = revokeStatement[1]
  .split(",")
  .map((value) => value.trim().replace(/^public\./, ""))
  .filter(Boolean);
assert.equal(new Set(listed).size, listed.length, "operational table list must not contain duplicates");
assert.deepEqual([...listed].sort(), [...requiredTables].sort(), "N14 backend-only table scope must stay explicit and complete");

console.log("PASS N14 connector table grant hardening migration contract", JSON.stringify({
  migration: migrationPath,
  revokedRoles: ["anon", "authenticated", "public"],
  backendOnlyTables: listed.length,
  privilegeGrantsAdded: 0,
  destructiveDDL: false
}));
