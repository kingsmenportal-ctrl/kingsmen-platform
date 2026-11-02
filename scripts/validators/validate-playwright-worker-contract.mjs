#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../playwright/kingsmen-staging-smoke.mjs", import.meta.url), "utf8");
const plan = await readFile(new URL("../../docs/architecture/PLAYWRIGHT_WORKERS_RELEASE_PLAN.md", import.meta.url), "utf8");
const checks = [
  ["explicit staging origin", source, "KINGSMEN_STAGING_BASE_URL"],
  ["HTTPS and embedded credential guard", source, "BLOCKED_UNSAFE_BASE_URL"],
  ["cross-origin rejection", source, "BLOCKED_CROSS_ORIGIN_PATH"],
  ["bounded timeout", source, "BLOCKED_INVALID_TIMEOUT"],
  ["headless browser", source, "chromium.launch({ headless: true })"],
  ["mobile viewport", source, "width: 390, height: 844"],
  ["form accessibility", source, "unlabeledControlCount"],
  ["anonymous auth boundary", source, "anonymous-boundary:"],
  ["query string redaction", source, "pathname"],
  ["existing N16 queue reuse", plan, "N16 durable PostgreSQL queue"],
  ["unapproved provider actions blocked", plan, "human-assisted handoff"],
  ["deployment evidence", plan, "exact commit/image digest"]
];
for (const [label, text, needle] of checks) { assert.ok(text.includes(needle), "Missing contract: " + label); console.log("PASS", label); }
assert.ok(!/\.click\(.*submit|\.submit\(/s.test(source), "Smoke runner must not submit forms.");
console.log(JSON.stringify({ schema: "kingsmen.validation-report.v1", module: "Playwright worker contract", passed: true, checks: checks.length, runtimeExecuted: false }, null, 2));
