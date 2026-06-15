#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const approvalPath = path.join(root, 'manifests', 'jarvis', 'jarvis-approval-policy.json');
const evidencePath = path.join(root, 'manifests', 'jarvis', 'jarvis-evidence-ledger-contract.json');
const workflowsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-approval-workflows.json');
const eventsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-evidence-event-types.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-approval-evidence-validation.json');

const requiredStatuses = new Set(['not_required', 'pending', 'approved', 'denied', 'expired', 'blocked']);
const requiredEvents = new Set(['tool_answer', 'approval_request', 'approval_decision', 'blocked_action', 'tool_failure', 'success_claim', 'manual_fallback']);
const requiredEvidenceFields = new Set([
  'evidence_id',
  'created_at',
  'actor',
  'command_id',
  'intent_id',
  'adapter_id',
  'risk_level',
  'approval_status',
  'source_confidence_band',
  'result_summary',
  'next_safe_action'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.9 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const approval = readJson(approvalPath);
  const evidence = readJson(evidencePath);
  const workflows = readJson(workflowsPath);
  const events = readJson(eventsPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(approval.approval_rules) || approval.approval_rules.length === 0) fail('approval_rules missing.');
  const approvalRuleIds = new Set();
  for (const rule of approval.approval_rules || []) {
    if (approvalRuleIds.has(rule.rule_id)) fail(`Duplicate approval rule: ${rule.rule_id}`);
    approvalRuleIds.add(rule.rule_id);
    if (!Array.isArray(rule.risk_levels) || rule.risk_levels.length === 0) fail(`${rule.rule_id} missing risk_levels.`);
    if (typeof rule.approval_required !== 'boolean') fail(`${rule.rule_id} missing approval_required boolean.`);
    if (!rule.hud_surface) fail(`${rule.rule_id} missing hud_surface.`);
  }

  for (const status of requiredStatuses) {
    if (!approval.approval_statuses?.includes(status)) fail(`Approval status missing: ${status}`);
  }

  if (!Array.isArray(evidence.evidence_fields) || evidence.evidence_fields.length === 0) fail('evidence_fields missing.');
  for (const field of requiredEvidenceFields) {
    if (!evidence.evidence_fields.includes(field)) fail(`Evidence field missing: ${field}`);
  }

  if (evidence.claim_rules?.success_claim_requires_evidence !== true) fail('success_claim_requires_evidence must be true.');
  if (evidence.claim_rules?.official_status_claim_requires_source_proof !== true) fail('official_status_claim_requires_source_proof must be true.');
  if (evidence.claim_rules?.blocked_action_must_record_blocked_reason !== true) fail('blocked_action_must_record_blocked_reason must be true.');

  if (!Array.isArray(workflows.workflows) || workflows.workflows.length === 0) fail('workflows missing.');
  const workflowIds = new Set((workflows.workflows || []).map((workflow) => workflow.workflow_id));
  for (const requiredWorkflow of ['approval_not_required', 'approval_required_before_tool', 'blocked_action_refusal', 'tool_failure_path']) {
    if (!workflowIds.has(requiredWorkflow)) fail(`Workflow missing: ${requiredWorkflow}`);
  }

  if (!Array.isArray(events.event_types) || events.event_types.length === 0) fail('event_types missing.');
  const eventTypes = new Set((events.event_types || []).map((event) => event.event_type));
  for (const requiredEvent of requiredEvents) {
    if (!eventTypes.has(requiredEvent)) fail(`Event type missing: ${requiredEvent}`);
  }
  if (!events.event_display_surfaces?.blocked_action?.includes('blocked_card')) fail('blocked_action must display blocked_card.');
  if (!events.event_display_surfaces?.tool_failure?.includes('failure_card')) fail('tool_failure must display failure_card.');

  if (process.exitCode) return;
  console.log('PJ42.9 VALIDATION PASSED');
  console.log(`Approval rules validated: ${approvalRuleIds.size}`);
  console.log(`Evidence fields validated: ${evidence.evidence_fields.length}`);
  console.log(`Workflows validated: ${workflowIds.size}`);
  console.log(`Event types validated: ${eventTypes.size}`);
}

main();
