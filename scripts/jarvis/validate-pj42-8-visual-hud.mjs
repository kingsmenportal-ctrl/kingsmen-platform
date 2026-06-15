#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'manifests', 'jarvis', 'jarvis-visual-surface-catalog.json');
const layoutPath = path.join(root, 'manifests', 'jarvis', 'jarvis-hud-layout-system.json');
const contractsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-hud-component-contracts.json');
const statesPath = path.join(root, 'manifests', 'jarvis', 'jarvis-hud-state-machine.json');
const mobilePath = path.join(root, 'manifests', 'jarvis', 'jarvis-hud-accessibility-mobile.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-visual-hud-validation.json');

const requiredSurfaces = new Set([
  'commander_wake_screen',
  'jarvis_voice_orb',
  'live_response_stream',
  'command_card',
  'mission_board',
  'tool_use_indicator',
  'source_confidence_chip',
  'evidence_drawer',
  'approval_modal',
  'system_health_panel',
  'portal_scout_screenshot_card',
  'route_intelligence_panel',
  'finance_health_panel',
  'document_pipeline_panel',
  'mobile_founder_view'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.8 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const catalog = readJson(catalogPath);
  const layouts = readJson(layoutPath);
  const contracts = readJson(contractsPath);
  const states = readJson(statesPath);
  const mobile = readJson(mobilePath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(catalog.surfaces) || catalog.surfaces.length === 0) {
    fail('surface catalog missing or empty.');
    return;
  }

  const surfaceIds = new Set();
  for (const surface of catalog.surfaces) {
    if (surfaceIds.has(surface.surface_id)) fail(`Duplicate surface_id: ${surface.surface_id}`);
    surfaceIds.add(surface.surface_id);
    if (!Array.isArray(surface.required_states) || surface.required_states.length === 0) fail(`${surface.surface_id} missing required_states.`);
    if (!Array.isArray(surface.required_fields) || surface.required_fields.length === 0) fail(`${surface.surface_id} missing required_fields.`);
    if (typeof surface.mobile_required !== 'boolean') fail(`${surface.surface_id} missing mobile_required boolean.`);
  }

  for (const required of requiredSurfaces) {
    if (!surfaceIds.has(required)) fail(`Required HUD surface missing: ${required}`);
  }

  if (!Array.isArray(layouts.layouts) || layouts.layouts.length === 0) fail('layouts missing or empty.');
  for (const layout of layouts.layouts || []) {
    for (const surfaceId of layout.required_surfaces || []) {
      if (!surfaceIds.has(surfaceId)) fail(`Layout ${layout.layout_id} references unknown surface ${surfaceId}`);
    }
  }

  if (!Array.isArray(contracts.component_contracts) || contracts.component_contracts.length === 0) fail('component contracts missing or empty.');
  for (const component of contracts.component_contracts || []) {
    if (!surfaceIds.has(component.surface_id)) fail(`Component ${component.component_id} references unknown surface ${component.surface_id}`);
    if (component.commander_only !== true) fail(`Component ${component.component_id} must be commander_only.`);
    if (!Array.isArray(component.required_props) || component.required_props.length === 0) fail(`Component ${component.component_id} missing required_props.`);
  }

  if (!Array.isArray(states.states) || states.states.length === 0) fail('HUD states missing.');
  if (!states.states.includes('awaiting_approval')) fail('awaiting_approval state is required.');
  if (!states.states.includes('using_tool')) fail('using_tool state is required.');
  if (!states.states.includes('blocked')) fail('blocked state is required.');
  if (!Array.isArray(states.transitions) || states.transitions.length === 0) fail('HUD transitions missing.');

  if (mobile.mobile_rules?.mobile_founder_view_required !== true) fail('mobile Founder view must be required.');
  if (mobile.accessibility_rules?.status_must_not_rely_on_color_only !== true) fail('status must not rely on color only.');
  if (mobile.accessibility_rules?.screen_reader_labels_required !== true) fail('screen reader labels required.');

  if (process.exitCode) return;
  console.log('PJ42.8 VALIDATION PASSED');
  console.log(`HUD surfaces validated: ${surfaceIds.size}`);
  console.log(`Layouts validated: ${(layouts.layouts || []).length}`);
  console.log(`Component contracts validated: ${(contracts.component_contracts || []).length}`);
  console.log(`HUD states validated: ${(states.states || []).length}`);
}

main();
