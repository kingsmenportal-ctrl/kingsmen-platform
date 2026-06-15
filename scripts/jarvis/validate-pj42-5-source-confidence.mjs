#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const bandsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-source-confidence-bands.json');
const authorityPath = path.join(root, 'manifests', 'jarvis', 'jarvis-source-authority.json');
const rulesPath = path.join(root, 'manifests', 'jarvis', 'jarvis-source-confidence-rules.json');
const conflictPath = path.join(root, 'manifests', 'jarvis', 'jarvis-source-conflict-handling.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-source-confidence-validation.json');

const requiredBands = new Set([
  'verified_official',
  'high_trusted_recent',
  'medium_needs_review',
  'low_unverified_or_stale',
  'blocked_or_unsafe'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.5 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const bands = readJson(bandsPath);
  const authority = readJson(authorityPath);
  const rules = readJson(rulesPath);
  const conflicts = readJson(conflictPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(bands.confidence_bands) || bands.confidence_bands.length === 0) {
    fail('confidence_bands missing or empty.');
    return;
  }

  const bandIds = new Set();
  for (const band of bands.confidence_bands) {
    if (bandIds.has(band.band_id)) fail(`Duplicate confidence band: ${band.band_id}`);
    bandIds.add(band.band_id);
    if (!requiredBands.has(band.band_id)) fail(`Unknown confidence band: ${band.band_id}`);
    if (typeof band.may_answer_confidently !== 'boolean') fail(`${band.band_id} missing may_answer_confidently boolean.`);
    if (typeof band.may_trigger_action !== 'boolean') fail(`${band.band_id} missing may_trigger_action boolean.`);
    if (typeof band.requires_review !== 'boolean') fail(`${band.band_id} missing requires_review boolean.`);
    if (!band.minimum_authority_level) fail(`${band.band_id} missing minimum_authority_level.`);
  }

  for (const required of requiredBands) {
    if (!bandIds.has(required)) fail(`Required confidence band missing: ${required}`);
  }

  const verified = bands.confidence_bands.find((item) => item.band_id === 'verified_official');
  if (verified?.minimum_authority_level !== 'official_primary') {
    fail('verified_official must require official_primary authority.');
  }

  if (!Array.isArray(authority.authority_levels) || authority.authority_levels.length === 0) fail('authority levels missing.');
  const authorityIds = new Set();
  for (const level of authority.authority_levels || []) {
    authorityIds.add(level.level_id);
    if (!bandIds.has(level.allowed_confidence_ceiling)) fail(`${level.level_id} references unknown confidence ceiling ${level.allowed_confidence_ceiling}`);
  }
  if (!authorityIds.has('official_primary')) fail('official_primary authority level is required.');
  if (!authorityIds.has('blocked')) fail('blocked authority level is required.');

  if (!rules.freshness_windows || Object.keys(rules.freshness_windows).length === 0) fail('freshness_windows missing.');
  if (!Array.isArray(rules.band_rules) || rules.band_rules.length === 0) fail('band_rules missing.');
  for (const rule of rules.band_rules || []) {
    if (!bandIds.has(rule.then_band)) fail(`Rule ${rule.rule_id} references unknown band ${rule.then_band}`);
    if (!rule.if || typeof rule.if !== 'object') fail(`Rule ${rule.rule_id} missing if object.`);
  }

  if (!Array.isArray(conflicts.conflict_types) || conflicts.conflict_types.length === 0) fail('conflict_types missing.');
  for (const conflict of conflicts.conflict_types || []) {
    if (!bandIds.has(conflict.default_band)) fail(`Conflict ${conflict.conflict_id} references unknown band ${conflict.default_band}`);
  }
  if (!Array.isArray(conflicts.manual_review_triggers) || conflicts.manual_review_triggers.length === 0) fail('manual_review_triggers missing.');
  if (!Array.isArray(conflicts.blocked_triggers) || conflicts.blocked_triggers.length === 0) fail('blocked_triggers missing.');

  if (process.exitCode) return;
  console.log('PJ42.5 VALIDATION PASSED');
  console.log(`Confidence bands validated: ${bandIds.size}`);
  console.log(`Authority levels validated: ${authorityIds.size}`);
  console.log(`Band rules validated: ${(rules.band_rules || []).length}`);
  console.log(`Conflict types validated: ${(conflicts.conflict_types || []).length}`);
}

main();
