#!/usr/bin/env node
/**
 * Regression tests for the Supabase migration integrity validator.
 * Uses isolated temporary directories; never reads or changes real migration data.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const validator = fileURLToPath(new URL("../validators/validate-supabase-migration-integrity.mjs", import.meta.url));
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "kingsmen-migration-integrity-"));

function runCase(name, files, expectedCode, expectedText) {
  const root = path.join(tempRoot, name);
  const dir = path.join(root, "db", "migrations");
  fs.mkdirSync(dir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, filename), content, "utf8");
  const result = spawnSync(process.execPath, [validator], { encoding: "utf8", env: { ...process.env, KINGSMEN_REPO_ROOT: root } });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  assert.equal(result.status, expectedCode, `${name}: unexpected exit code\n${output}`);
  assert.match(output, expectedText, `${name}: expected diagnostic missing\n${output}`);
}

try {
  runCase("valid", { "0079_first.sql": "select 1;\n", "0080_second.sql": "select 2;\n" }, 0, /Migration integrity gate PASSED/);
  runCase("duplicate", { "0079_first.sql": "select 1;\n", "0079_second.sql": "select 2;\n" }, 1, /duplicate migration version 0079/);
  runCase("empty", { "0080_empty.sql": " \n\t" }, 1, /empty migration/);
  const missingRoot = path.join(tempRoot, "missing");
  fs.mkdirSync(missingRoot, { recursive: true });
  const missing = spawnSync(process.execPath, [validator], { encoding: "utf8", env: { ...process.env, KINGSMEN_REPO_ROOT: missingRoot } });
  assert.equal(missing.status, 1, "missing migration directory must fail closed");
  assert.match(`${missing.stdout || ""}${missing.stderr || ""}`, /no supported migration directory found/);
  console.log("PASS: migration integrity regression suite (valid, duplicate version, empty file, missing directory).");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
