#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const pathOf = (path) => join(repoRoot, path);
const read = (path) => readFileSync(pathOf(path), "utf8");
const checks = [];
const failed = [];
const add = (name, passed, detail, evidencePath) => {
  const item = { name, passed: Boolean(passed), detail, evidencePath };
  checks.push(item);
  if (!item.passed) failed.push(item);
};

const required = [
  "manifests/ops/backup-restore-proof-v1.json",
  "docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md",
  "scripts/backup/New-KingsmenTruthVaultBackup.ps1",
  "scripts/backup/Test-KingsmenTruthVaultRestore.ps1"
];
for (const path of required) add("file_exists:" + path, existsSync(pathOf(path)), path, path);

if (required.every((path) => existsSync(pathOf(path)))) {
  const backup = read("scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  const restore = read("scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  const manifest = JSON.parse(read("manifests/ops/backup-restore-proof-v1.json"));

  add("backup_uses_pg_dump", backup.includes("pg_dump"), "PostgreSQL custom-format archive", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  add("backup_requires_age_recipient", backup.includes("KINGSMEN_BACKUP_AGE_RECIPIENT") && backup.includes("age"), "age encryption is mandatory", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  add("backup_removes_plaintext", backup.includes("plaintextTemporaryRemoved") && backup.includes("Remove-Item"), "plaintext intermediate removed", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  add("backup_records_encrypted_hash", backup.includes("Get-FileHash") && backup.includes("SHA256") && backup.includes("encryptedAtRest"), "encrypted archive SHA-256 required", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  add("backup_truthfully_marks_candidate_data", backup.includes("candidateDataIncluded = $true") && backup.includes("rawCandidateRowsPrinted = $false"), "archive may contain personal data; reports do not print raw rows", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");
  add("backup_does_not_claim_storage_bytes", backup.includes("privateStorageObjectsIncluded = $false") && backup.includes("storageParityRequired = $true"), "private Storage parity remains separate", "scripts/backup/New-KingsmenTruthVaultBackup.ps1");

  add("restore_requires_source_and_target", restore.includes("SourceDatabaseUrl") && restore.includes("RestoreDatabaseUrl"), "both source and restore target are mandatory", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_compares_normalized_identity", restore.includes("Get-PostgresConfig") && restore.includes("Identity =") && restore.includes("Restore target matches source database"), "normalized target identity must differ", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_requires_target_confirmation", restore.includes("ConfirmRestoreDatabaseName"), "exact isolated target database confirmation", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_requires_age_identity", restore.includes("KINGSMEN_BACKUP_AGE_IDENTITY_FILE") && restore.includes("AGE_DECRYPTION_FAILED"), "encrypted backup decryption required", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_requires_empty_target", restore.includes("RESTORE_TARGET_MUST_BE_AN_EMPTY_ISOLATED_DATABASE"), "existing objects are not cleaned or overwritten", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_uses_single_transaction", restore.includes("--single-transaction") && !restore.includes("--clean"), "restore fails transactionally without clean/drop", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_count_failures_fail_drill", restore.includes("QUERY_FAILED") && restore.includes("$allPassed") && restore.includes("if (-not $allPassed) { exit 1 }"), "missing or failed parity query blocks success", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_uses_env_not_password_args", restore.includes("$env:PGPASSWORD = $Config.Password"), "database password passed through process environment", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");
  add("restore_does_not_claim_storage_parity", restore.includes("storageObjectParityVerified = $false") && restore.includes("storageParityRequired = $true"), "private Storage proof remains outstanding", "scripts/backup/Test-KingsmenTruthVaultRestore.ps1");

  add("manifest_age_encryption_required", manifest.backupStrategy?.encryption === "age" && manifest.backupStrategy?.encryptedAtRestRequired === true, "age encryption mandatory", "manifests/ops/backup-restore-proof-v1.json");
  add("manifest_storage_parity_required", manifest.backupStrategy?.privateStorageObjectsIncluded === false && manifest.backupStrategy?.storageParityRequired === true, "Storage object bytes not included", "manifests/ops/backup-restore-proof-v1.json");
  add("manifest_production_stays_blocked", manifest.productionReady === false && manifest.publicLaunchAllowed === false && manifest.productionDataAllowed === false, "source proof does not authorize launch", "manifests/ops/backup-restore-proof-v1.json");
}

const report = {
  schema: "kingsmen.backup-restore-source-proof.v2",
  module: "Kingsmen Backup and Restore Proof",
  status: failed.length === 0 ? "BACKUP_RESTORE_SOURCE_PROOF_PASSED" : "BACKUP_RESTORE_SOURCE_PROOF_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  productionDataAllowed: false,
  stagingRestoreDrillCompleted: false,
  privateStorageParityVerified: false,
  databaseUrlRedacted: true,
  rawCandidateRowsReturned: false,
  backupStorageAllowedInGit: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length === 0
    ? "Run a real approved encrypted staging database restore and a separate private Storage object parity drill."
    : "Repair backup/restore source boundaries."
};

const reportPath = pathOf("reports/ops/backup-restore-proof-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
