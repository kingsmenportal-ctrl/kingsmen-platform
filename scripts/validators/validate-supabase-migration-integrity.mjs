#!/usr/bin/env node
/**
 * Kingsmen migration integrity gate.
 *
 * Checks repository migration directories for duplicate numeric version prefixes,
 * empty SQL migrations, and filename collisions. This is a source-tree guard only:
 * it does not claim that migrations were applied to any Supabase environment.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.env.KINGSMEN_REPO_ROOT || process.cwd());
const candidates = [
  path.join(repoRoot, "db", "migrations"),
  path.join(repoRoot, "supabase", "migrations"),
];
const migrationDirs = candidates.filter((dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory());

if (migrationDirs.length === 0) {
  console.error("FAIL: no supported migration directory found (expected db/migrations or supabase/migrations).");
  process.exit(1);
}

let failures = 0;
let filesChecked = 0;

for (const dir of migrationDirs) {
  const files = fs.readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  const versions = new Map();

  for (const name of files) {
    const fullPath = path.join(dir, name);
    const sql = fs.readFileSync(fullPath, "utf8");
    filesChecked += 1;

    if (!sql.trim()) {
      console.error(`FAIL: empty migration: ${path.relative(repoRoot, fullPath)}`);
      failures += 1;
    }

    const match = name.match(/^(\d{4,})[_-]/);
    if (!match) continue;

    const version = match[1];
    const previous = versions.get(version);
    if (previous) {
      console.error(
        `FAIL: duplicate migration version ${version} in ${path.relative(repoRoot, dir)}: ${previous} and ${name}`,
      );
      failures += 1;
    } else {
      versions.set(version, name);
    }
  }

  console.log(`Checked ${files.length} SQL migration file(s) in ${path.relative(repoRoot, dir)}.`);
}

if (failures > 0) {
  console.error(`Migration integrity gate FAILED: ${failures} issue(s) across ${filesChecked} file(s).`);
  process.exit(1);
}

console.log(`Migration integrity gate PASSED: ${filesChecked} SQL migration file(s), no empty migrations or duplicate numeric versions.`);
