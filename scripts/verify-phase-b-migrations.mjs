#!/usr/bin/env node
/**
 * Static integrity checks for Kingsmen Phase B database migrations.
 * This deliberately does not connect to Supabase or apply SQL.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationDir = path.join(root, "db", "migrations");
const expected = [
  "0059_candidate_identity_link_requests.sql",
  "0060_atomic_marketplace_review.sql",
  "0061_candidate_identity_review_workflow.sql",
  "0062_candidate_registration_identity_request.sql",
  "0063_atomic_payfast_itn_reconciliation.sql",
  "0064_payfast_intent_order_invoice_atomic.sql",
  "0065_founder_finance_exception_review.sql",
  "0066_founder_operations_notification_queue.sql",
  "0067_founder_control_plane_approval_actions.sql",
  "0068_candidate_portal_messages.sql",
  "0069_founder_profile_change_review.sql",
  "0070_candidate_refund_requests.sql",
  "0071_founder_candidate_portal_messaging.sql",
];
const requiredFunctions = new Map([
  ["0060_atomic_marketplace_review.sql", ["review_marketplace_entity"]],
  ["0061_candidate_identity_review_workflow.sql", ["get_candidate_identity_link_queue", "review_candidate_identity_link"]],
  ["0062_candidate_registration_identity_request.sql", ["request_candidate_identity_link"]],
  ["0063_atomic_payfast_itn_reconciliation.sql", ["process_payfast_itn"]],
  ["0064_payfast_intent_order_invoice_atomic.sql", ["create_payfast_payment_intent"]],
  ["0065_founder_finance_exception_review.sql", ["get_founder_finance_exceptions", "review_finance_refund_request"]],
  ["0066_founder_operations_notification_queue.sql", ["get_founder_ops_queue", "founder_requeue_notification", "founder_resolve_dead_letter"]],
  ["0067_founder_control_plane_approval_actions.sql", ["founder_review_control_plane_approval", "founder_review_policy_exception"]],
  ["0068_candidate_portal_messages.sql", ["create_candidate_portal_message", "mark_candidate_portal_message_read"]],
  ["0069_founder_profile_change_review.sql", ["get_founder_profile_change_queue", "review_candidate_profile_change"]],
  ["0070_candidate_refund_requests.sql", ["request_candidate_refund"]],
  ["0071_founder_candidate_portal_messaging.sql", ["get_founder_candidate_messages", "founder_reply_candidate_message"]],
]);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

const actualFiles = (await readdir(migrationDir)).filter((name) => /^00(5[9]|6[0-9]|7[01])_.*\.sql$/.test(name)).sort();
for (const name of expected) {
  const count = actualFiles.filter((file) => file === name).length;
  if (count !== 1) fail(`Expected exactly one ${name}; found ${count}`);
}
for (const name of actualFiles) {
  if (!expected.includes(name)) fail(`Unexpected Phase B migration filename: ${name}`);
}
for (const name of expected) {
  const filePath = path.join(migrationDir, name);
  let sql;
  try {
    sql = await readFile(filePath, "utf8");
  } catch {
    continue;
  }
  if (!sql.trim()) {
    fail(`${name} is empty`);
    continue;
  }
  if (!sql.includes("--")) fail(`${name} has no explanatory SQL comments`);
  for (const fn of requiredFunctions.get(name) ?? []) {
    const fnPattern = new RegExp(`\\b(?:FUNCTION|PROCEDURE)\\s+(?:public\\.)?${fn}\\s*\\(`, "i");
    if (!fnPattern.test(sql)) fail(`${name} does not define expected function ${fn}`);
  }
  // SECURITY DEFINER is sensitive. Require an explicit search_path setting somewhere
  // in the same migration; human review is still required for function-by-function safety.
  if (/SECURITY\s+DEFINER/i.test(sql) && !/SET\s+search_path\s*=/i.test(sql)) {
    fail(`${name} contains SECURITY DEFINER but no explicit SET search_path clause`);
  }
}
if (!process.exitCode) {
  console.log(`Phase B migration static integrity passed: ${expected.length} files, ${[...requiredFunctions.values()].flat().length} expected RPC definitions.`);
  console.log("No database connection was made and no migration was applied.");
}
