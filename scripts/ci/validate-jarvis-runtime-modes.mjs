#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateApiJarvisRuntime } = require("../../apps/api/dist/jarvis/jarvis-runtime-api.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function check(name, input, expected) {
  const result = evaluateApiJarvisRuntime(input);
  for (const [key, value] of Object.entries(expected)) {
    assert(result[key] === value, `${name}: expected ${key}=${JSON.stringify(value)}, received ${JSON.stringify(result[key])}`);
  }
  console.log(JSON.stringify({
    check: name,
    passed: true,
    finalDecision: result.finalDecision,
    executable: result.executable,
    dryRun: result.dryRun,
    status: result.status
  }));
  return result;
}

const defaultDryRun = check("default_is_non_executable_dry_run", {
  command: { commandTextSafe: "summarize readiness", intendedAction: "read_only_status" }
}, {
  finalDecision: "DRY_RUN_ONLY",
  executable: false,
  dryRun: true,
  status: "JARVIS_RUNTIME_DRY_RUN_ONLY"
});

const explicitExecution = check("explicit_execution_mode_is_distinct", {
  dryRun: false,
  command: { commandTextSafe: "summarize readiness", intendedAction: "read_only_status" }
}, {
  finalDecision: "ALLOW",
  executable: true,
  dryRun: false,
  status: "JARVIS_RUNTIME_ALLOWED"
});

const unsafeDryRun = check("unsafe_pattern_remains_blocked_in_dry_run", {
  command: { commandTextSafe: "disable RLS", intendedAction: "disable RLS" }
}, {
  finalDecision: "BLOCK",
  executable: false,
  dryRun: true,
  status: "JARVIS_RUNTIME_BLOCKED"
});

const liveDryRun = check("live_action_dry_run_never_executes", {
  command: { commandTextSafe: "prepare production release", intendedAction: "production release" }
}, {
  finalDecision: "DRY_RUN_ONLY",
  executable: false,
  dryRun: true,
  launchGateChecked: true,
  launchGateOpen: false,
  reasonCode: "JARVIS_API_DRY_RUN_ONLY_LAUNCH_GATE_CLOSED"
});
assert(liveDryRun.blockedBy.includes("launch_evidence_missing"), "live dry-run should expose missing launch evidence");
assert(defaultDryRun.executable === false && explicitExecution.executable === true && unsafeDryRun.executable === false,
  "runtime mode safety invariant failed");

console.log(JSON.stringify({ suite: "jarvis_runtime_modes", passed: true, assertions: 4 }));
