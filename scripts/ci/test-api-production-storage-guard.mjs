#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCase(name, mode) {
  const env = { ...process.env, NODE_ENV: "production", PORT: "0" };
  delete env.KINGSMEN_DATABASE_URL;
  delete env.DATABASE_URL;
  if (mode === null) delete env.KINGSMEN_TRUTH_VAULT_MODE;
  else env.KINGSMEN_TRUTH_VAULT_MODE = mode;

  const result = spawnSync(process.execPath, ["apps/api/dist/server.js"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    timeout: 5000
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert(result.status !== 0, `${name}: API unexpectedly started in production without durable database configuration.`);
  assert(
    output.includes("requires KINGSMEN_DATABASE_URL or DATABASE_URL") ||
      output.includes("Memory-only Truth Vault is forbidden in NODE_ENV=production"),
    `${name}: startup failed for an unexpected reason. Output: ${output.slice(-1500)}`
  );
  console.log(JSON.stringify({ check: name, exitCode: result.status, passed: true }));
}

try {
  runCase("production_defaults_to_postgres_and_requires_database_url", null);
  runCase("production_rejects_explicit_memory_mode", "memory");
  runCase("production_rejects_explicit_memory_development_only_mode", "memory_development_only");
  console.log(JSON.stringify({ suite: "api-production-storage-guard", passed: true, cases: 3 }));
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
