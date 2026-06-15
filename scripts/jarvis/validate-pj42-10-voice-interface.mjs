#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const wakePath = path.join(root, 'manifests', 'jarvis', 'jarvis-wake-greeting.json');
const statePath = path.join(root, 'manifests', 'jarvis', 'jarvis-voice-state-machine.json');
const safetyPath = path.join(root, 'manifests', 'jarvis', 'jarvis-voice-command-safety.json');
const boundaryPath = path.join(root, 'manifests', 'jarvis', 'jarvis-speech-tts-boundary.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-voice-interface-validation.json');

const requiredStates = new Set([
  'sleeping',
  'wake_detected',
  'listening',
  'transcribing',
  'normalizing',
  'thinking',
  'using_tool',
  'awaiting_approval',
  'speaking',
  'completed',
  'blocked',
  'failed'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.10 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const wake = readJson(wakePath);
  const states = readJson(statePath);
  const safety = readJson(safetyPath);
  const boundary = readJson(boundaryPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(wake.wake_greetings) || wake.wake_greetings.length === 0) fail('wake_greetings missing.');
  const standard = wake.wake_greetings.find((item) => item.greeting_id === 'standard_kingsmen_command_wake');
  if (!standard) fail('standard_kingsmen_command_wake missing.');
  if (standard && standard.commander_only !== true) fail('standard wake greeting must be Commander-only.');
  if (standard && standard.kingsmen_branded !== true) fail('standard wake greeting must be Kingsmen-branded.');
  if (standard && !standard.text.includes('Welcome to Kingsmen Command')) fail('standard wake greeting must welcome Commander to Kingsmen Command.');

  if (!Array.isArray(states.voice_states) || states.voice_states.length === 0) fail('voice_states missing.');
  const stateIds = new Set(states.voice_states || []);
  for (const state of requiredStates) {
    if (!stateIds.has(state)) fail(`Required voice state missing: ${state}`);
  }
  if (!Array.isArray(states.transitions) || states.transitions.length === 0) fail('voice transitions missing.');
  if (states.hud_visibility_rules?.state_must_be_visible !== true) fail('voice state must be visible in HUD.');

  if (!Array.isArray(safety.safety_rules) || safety.safety_rules.length === 0) fail('voice safety rules missing.');
  if (!safety.safety_rules.includes('voice_is_not_a_shortcut_around_policy_gate')) fail('voice must not bypass policy gate.');
  if (!safety.safety_rules.includes('voice_is_not_a_shortcut_around_approval')) fail('voice must not bypass approval.');
  if (safety.ambiguous_transcript_policy?.execute_on_ambiguity !== false) fail('ambiguous transcript must not execute command.');
  if (!Array.isArray(safety.blocked_voice_actions) || safety.blocked_voice_actions.length === 0) fail('blocked voice actions missing.');
  if (!safety.blocked_voice_actions.includes('speak_to_candidate_as_jarvis')) fail('candidate-facing Jarvis voice must be blocked.');

  if (boundary.speech_to_text_rules?.transcript_is_draft !== true) fail('speech transcript must be treated as draft.');
  if (boundary.speech_to_text_rules?.must_not_execute_unclear_command !== true) fail('unclear command must not execute.');
  if (boundary.text_to_speech_rules?.must_not_speak_private_raw_data_by_default !== true) fail('TTS must not speak private raw data by default.');
  if (boundary.audio_privacy_rules?.candidate_voice_mode_forbidden !== true) fail('candidate voice mode must be forbidden.');

  if (process.exitCode) return;
  console.log('PJ42.10 VALIDATION PASSED');
  console.log(`Wake greetings validated: ${wake.wake_greetings.length}`);
  console.log(`Voice states validated: ${stateIds.size}`);
  console.log(`Voice safety rules validated: ${safety.safety_rules.length}`);
}

main();
