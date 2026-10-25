import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { TruthVaultRepository } = require("../../apps/api/dist/db/truth-vault-repository.js");

const envKeys = ["NODE_ENV", "KINGSMEN_TRUTH_VAULT_MODE", "KINGSMEN_DATABASE_URL", "DATABASE_URL"];
const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

function clearStorageEnvironment() {
  delete process.env.KINGSMEN_TRUTH_VAULT_MODE;
  delete process.env.KINGSMEN_DATABASE_URL;
  delete process.env.DATABASE_URL;
}

try {
  clearStorageEnvironment();
  process.env.NODE_ENV = "production";
  assert.throws(
    () => TruthVaultRepository.fromEnvironment(),
    /Production startup blocked:.*memory-only storage is development-only/,
    "production must not silently start with volatile in-memory storage"
  );

  process.env.KINGSMEN_TRUTH_VAULT_MODE = "memory";
  assert.throws(
    () => TruthVaultRepository.fromEnvironment(),
    /Production startup blocked:/,
    "explicit memory mode must also fail closed in production"
  );

  clearStorageEnvironment();
  process.env.NODE_ENV = "development";
  const developmentRepository = TruthVaultRepository.fromEnvironment();
  assert.equal(developmentRepository.storageMode, "memory_development_only");
  assert.equal(developmentRepository.enabled, false);

  process.env.NODE_ENV = "production";
  process.env.KINGSMEN_TRUTH_VAULT_MODE = "postgres";
  assert.throws(
    () => TruthVaultRepository.fromEnvironment(),
    /requires KINGSMEN_DATABASE_URL or DATABASE_URL/,
    "postgres mode must fail closed when no database URL is configured"
  );

  console.log(JSON.stringify({
    status: "PASS",
    module: "N03 Truth Vault production storage guard",
    checks: [
      "production rejects implicit memory storage",
      "production rejects explicit memory storage",
      "development retains intentional memory-only mode",
      "PostgreSQL mode rejects missing database configuration"
    ]
  }, null, 2));
} finally {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}
