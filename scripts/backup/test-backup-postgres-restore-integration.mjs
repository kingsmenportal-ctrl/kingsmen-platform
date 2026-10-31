#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const enabled = process.env.KINGSMEN_BACKUP_TEST_ALLOW_MUTATION === "true";
const host = process.env.KINGSMEN_BACKUP_TEST_HOST ?? "";
const port = Number(process.env.KINGSMEN_BACKUP_TEST_PORT ?? "5432");
const user = process.env.KINGSMEN_BACKUP_TEST_USER ?? "postgres";
const password = process.env.PGPASSWORD ?? "";
const sourceDb = process.env.KINGSMEN_BACKUP_TEST_SOURCE_DATABASE ?? "";
const restoreDb = process.env.KINGSMEN_BACKUP_TEST_RESTORE_DATABASE ?? "";
const passphrase = process.env.KINGSMEN_BACKUP_PASSPHRASE ?? "";

if (!enabled) throw new Error("KINGSMEN_BACKUP_TEST_ALLOW_MUTATION=true is required.");
if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error("Refusing to test against a non-loopback PostgreSQL host.");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid disposable PostgreSQL test port.");
if (!password) throw new Error("PGPASSWORD is required for the disposable PostgreSQL service.");
if (sourceDb !== "kingsmen_backup_source" || restoreDb !== "kingsmen_backup_restore" || sourceDb === restoreDb) {
  throw new Error("Source and restore database names must match the two isolated Kingsmen CI fixture names.");
}
if (passphrase.length < 20) throw new Error("KINGSMEN_BACKUP_PASSPHRASE must contain at least 20 characters.");

const require = createRequire(import.meta.url);
const pgPath = require.resolve("pg", { paths: [path.join(root, "apps/api")] });
const { Client } = require(pgPath);
const helper = path.join(root, "scripts/backup/encrypt-backup.mjs");
const pgDumpBin = process.env.KINGSMEN_BACKUP_TEST_PG_DUMP_BIN ?? "pg_dump";
const pgRestoreBin = process.env.KINGSMEN_BACKUP_TEST_PG_RESTORE_BIN ?? "pg_restore";
const scratch = mkdtempSync(path.join(tmpdir(), "kingsmen-postgres-backup-restore-"));
const plain = path.join(scratch, "truth-vault.dump");
const encrypted = path.join(scratch, "truth-vault.kmbak");
const decrypted = path.join(scratch, "truth-vault-restored.dump");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function run(binary, args, env = process.env) {
  const result = spawnSync(binary, args, { cwd: root, env, encoding: "utf8", timeout: 120_000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, binary + " failed (exit " + result.status + "): " + (result.stderr || result.stdout));
  return result.stdout;
}
function client(database) {
  return new Client({ host, port, user, password, database, connectionTimeoutMillis: 5000 });
}

let admin;
let source;
let restored;
let sourceCreated = false;
let restoreCreated = false;
try {
  const pgDumpVersion = run(pgDumpBin, ["--version"]);
  const pgRestoreVersion = run(pgRestoreBin, ["--version"]);
  assert.match(pgDumpVersion, /17\./, "pg_dump 17 is required for the PostgreSQL 17 fixture");
  assert.match(pgRestoreVersion, /17\./, "pg_restore 17 is required for the PostgreSQL 17 fixture");

  admin = client("postgres");
  await admin.connect();
  const existing = await admin.query(
    "select datname from pg_database where datname = any($1::text[])",
    [[sourceDb, restoreDb]]
  );
  assert.equal(existing.rowCount, 0, "Disposable source/restore databases must not pre-exist.");
  await admin.query("create database " + sourceDb);
  sourceCreated = true;
  await admin.query("create database " + restoreDb);
  restoreCreated = true;

  source = client(sourceDb);
  await source.connect();
  await source.query(
    "create table public.backup_restore_fixture (" +
      "item_id integer primary key, item_name text not null, score integer not null, payload bytea not null)"
  );
  const fixtures = [
    [1, "candidate-redacted-fixture", 11, Buffer.from("fixture-alpha\\n")],
    [2, "reviewer-audit-fixture", 23, Buffer.from([0, 1, 2, 255, 17])],
    [3, "finance-ledger-fixture", 37, Buffer.from("R169.99|R299.99|R399.99")]
  ];
  for (const [id, name, score, payload] of fixtures) {
    await source.query(
      "insert into public.backup_restore_fixture(item_id,item_name,score,payload) values($1,$2,$3,$4)",
      [id, name, score, payload]
    );
  }

  run(pgDumpBin, [
    "--no-password", "--format=custom", "--no-owner", "--no-privileges",
    "--file=" + plain, "--host=" + host, "--port=" + port, "--username=" + user, "--dbname=" + sourceDb
  ]);
  assert.ok(statSync(plain).size > 0, "pg_dump must create a non-empty custom-format archive.");
  run(pgRestoreBin, ["--list", plain]);
  const plainHash = digest(readFileSync(plain));

  run(process.execPath, [helper, "encrypt", plain, encrypted], {
    ...process.env,
    KINGSMEN_BACKUP_PASSPHRASE: passphrase
  });
  assert.ok(statSync(encrypted).size > 52, "encrypted .kmbak container must be non-empty.");
  assert.notEqual(digest(readFileSync(encrypted)), plainHash, "encrypted archive must differ from plaintext.");
  assert.equal(readFileSync(encrypted).subarray(0, 8).toString("ascii"), "KMBACK01", "encrypted container magic must be present.");

  run(process.execPath, [helper, "decrypt", encrypted, decrypted], {
    ...process.env,
    KINGSMEN_BACKUP_PASSPHRASE: passphrase
  });
  assert.equal(digest(readFileSync(decrypted)), plainHash, "authenticated decrypt must restore the exact archive bytes.");
  run(pgRestoreBin, ["--list", decrypted]);

  run(pgRestoreBin, [
    "--no-password", "--exit-on-error", "--no-owner", "--no-privileges",
    "--host=" + host, "--port=" + port, "--username=" + user, "--dbname=" + restoreDb, decrypted
  ]);

  restored = client(restoreDb);
  await restored.connect();
  const parityQuery =
    "select count(*)::int as row_count, sum(score)::int as score_total, " +
    "string_agg(item_id::text || ':' || item_name || ':' || score::text || ':' || encode(payload,'hex'), " +
    "E'\\\\n' order by item_id) as row_snapshot from public.backup_restore_fixture";
  const sourceParity = (await source.query(parityQuery)).rows[0];
  const restoreParity = (await restored.query(parityQuery)).rows[0];
  assert.deepEqual(restoreParity, sourceParity, "restored database rows and payload bytes must match the source fixture.");
  assert.equal(restoreParity.row_count, 3);
  assert.equal(restoreParity.score_total, 71);

  process.stdout.write(JSON.stringify({
    schema: "kingsmen.backup-postgresql-restore-integration.v1",
    status: "PASSED",
    passed: true,
    serverVersion: (await source.query("show server_version")).rows[0].server_version,
    pgDumpVersion: pgDumpVersion.trim(),
    pgRestoreVersion: pgRestoreVersion.trim(),
    encryptedContainer: "KMBACK01 AES-256-GCM",
    authenticatedRoundTrip: true,
    customArchiveCatalogVerified: true,
    restoredRowCount: restoreParity.row_count,
    sourceAndRestoreRowParity: true,
    stagingDatabaseTouched: false,
    databaseHost: "127.0.0.1",
    sourceDatabase: sourceDb,
    restoreDatabase: restoreDb,
    productionRestoreProven: false
  }, null, 2) + "\n");
} finally {
  if (restored) await restored.end().catch(() => {});
  if (source) await source.end().catch(() => {});
  if (admin) {
    await admin.query(
      "select pg_terminate_backend(pid) from pg_stat_activity where datname = any($1::text[]) and pid <> pg_backend_pid()",
      [[sourceDb, restoreDb]]
    ).catch(() => {});
    if (restoreCreated) await admin.query("drop database if exists " + restoreDb).catch(() => {});
    if (sourceCreated) await admin.query("drop database if exists " + sourceDb).catch(() => {});
    await admin.end().catch(() => {});
  }
  rmSync(scratch, { recursive: true, force: true });
}
