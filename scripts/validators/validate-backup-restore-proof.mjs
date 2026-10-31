#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const pathOf = (path) => join(repoRoot, path);
const read = (path) => readFileSync(pathOf(path), "utf8");
const checks = [];
const failed = [];
const add = (name, passed, detail, path = "") => {
  const item = { name, passed: Boolean(passed), detail, path };
  checks.push(item);
  if (!item.passed) failed.push(item);
};

const required = [
  "package.json",
  ".gitignore",
  "manifests/ops/backup-restore-proof-v1.json",
  "docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md",
  "scripts/backup/New-KingsmenTruthVaultBackup.ps1",
  "scripts/backup/Test-KingsmenTruthVaultRestore.ps1",
  "scripts/proof/prove-backup-restore-boundary.mjs"
];
for (const path of required) add("file_exists:" + path, existsSync(pathOf(path)), existsSync(pathOf(path)) ? "found" : "missing", path);

const forbidden = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /github_pat_[A-Za-z0-9_]{20,}/i,
  /\bsk-[A-Za-z0-9_-]{20,}/i,
  /\bservice_role_[A-Za-z0-9._-]{32,}/i,
  /\bpostgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i
];

for (const path of required.filter((candidate) => existsSync(pathOf(candidate)))) {
  const source = read(path);
  for (const pattern of forbidden) add("secret_scan:" + path, !pattern.test(source), "no forbidden secret-like value", path);
}

if (existsSync(pathOf("manifests/ops/backup-restore-proof-v1.json"))) {
  const manifest = JSON.parse(read("manifests/ops/backup-restore-proof-v1.json"));
  add("manifest_production_ready_false", manifest.productionReady === false, String(manifest.productionReady));
  add("manifest_public_launch_false", manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed));
  add("manifest_production_data_false", manifest.productionDataAllowed === false, String(manifest.productionDataAllowed));
  add("manifest_age_encryption", manifest.backupStrategy?.encryption === "age" && manifest.backupStrategy?.encryptedAtRestRequired === true, "age encryption mandatory");
  add("manifest_storage_parity", manifest.backupStrategy?.privateStorageObjectsIncluded === false && manifest.backupStrategy?.storageParityRequired === true, "private Storage parity remains required");
  add("manifest_nineteen_scenarios", Array.isArray(manifest.proofScenarios) && manifest.proofScenarios.length >= 19, String(manifest.proofScenarios?.length));
}

if (existsSync(pathOf("reports/ops/backup-restore-proof-latest.json"))) {
  const proof = JSON.parse(read("reports/ops/backup-restore-proof-latest.json"));
  add("source_proof_passed", proof.status === "BACKUP_RESTORE_SOURCE_PROOF_PASSED", proof.status);
  add("source_proof_not_production_ready", proof.productionReady === false, String(proof.productionReady));
  add("source_proof_drill_not_fabricated", proof.stagingRestoreDrillCompleted === false, String(proof.stagingRestoreDrillCompleted));
  add("source_proof_storage_parity_pending", proof.privateStorageParityVerified === false, String(proof.privateStorageParityVerified));
}

const report = {
  schema: "kingsmen.validation-report.v2",
  module: "Kingsmen Backup and Restore Proof",
  status: failed.length === 0 ? "BACKUP_RESTORE_PROOF_VALIDATED" : "BACKUP_RESTORE_PROOF_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  stagingRestoreDrillCompleted: false,
  privateStorageParityVerified: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed_checks: failed,
  nextAction: failed.length === 0
    ? "Run the real encrypted staging database restore, then private Storage object backup/restore parity and independent sign-off."
    : "Repair backup/restore proof source or validation checks."
};

const reportPath = pathOf("reports/ops/backup-restore-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
