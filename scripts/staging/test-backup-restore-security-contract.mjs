import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const backup = readFileSync("scripts/backup/New-KingsmenTruthVaultBackup.ps1", "utf8");
const restore = readFileSync("scripts/backup/Test-KingsmenTruthVaultRestore.ps1", "utf8");
const manifest = JSON.parse(readFileSync("manifests/ops/backup-restore-proof-v1.json", "utf8"));
const docs = readFileSync("docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md", "utf8");

assert.match(backup, /KINGSMEN_BACKUP_AGE_RECIPIENT/);
assert.match(backup, /age encryption failed/);
assert.match(backup, /plaintextTemporaryRemoved/);
assert.match(backup, /candidateDataIncluded = \$true/);
assert.match(backup, /privateStorageObjectsIncluded = \$false/);

assert.match(restore, /KINGSMEN_BACKUP_AGE_IDENTITY_FILE/);
assert.match(restore, /Get-PostgresConfig/);
assert.match(restore, /Restore target matches source database/);
assert.match(restore, /ConfirmRestoreDatabaseName/);
assert.match(restore, /AGE_DECRYPTION_FAILED/);
assert.match(restore, /QUERY_FAILED/);
assert.match(restore, /storageObjectParityVerified = \$false/);
assert.doesNotMatch(restore, /--clean/);
assert.match(restore, /--single-transaction/);

assert.equal(manifest.backupStrategy.encryption, "age");
assert.equal(manifest.backupStrategy.encryptedAtRestRequired, true);
assert.equal(manifest.backupStrategy.privateStorageObjectsIncluded, false);
assert.equal(manifest.backupStrategy.storageParityRequired, true);
assert.equal(manifest.productionReady, false);
assert.match(docs, /Private Storage parity is a separate gate/);
assert.match(docs, /Production data and public launch remain blocked/);

console.log("Backup/restore security contract checks passed.");
