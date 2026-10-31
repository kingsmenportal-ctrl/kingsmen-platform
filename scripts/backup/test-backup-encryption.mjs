#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = mkdtempSync(join(tmpdir(), 'kingsmen-backup-crypto-'));
const helper = 'scripts/backup/encrypt-backup.mjs';
const input = join(root, 'source.dump');
const encrypted = join(root, 'source.kmbak');
const output = join(root, 'restored.dump');
const tampered = join(root, 'tampered.kmbak');
const secret = 'unit-test-only-passphrase-long-enough-2026';
const hash = (value) => createHash('sha256').update(value).digest('hex');
function run(args, password = secret) {
  return spawnSync(process.execPath, [helper, ...args], {
    encoding: 'utf8',
    env: { ...process.env, KINGSMEN_BACKUP_PASSPHRASE: password }
  });
}
try {
  const sample = Buffer.concat([Buffer.from('Kingsmen test archive\n'), Buffer.alloc(256 * 1024, 0x5a)]);
  writeFileSync(input, sample);
  const enc = run(['encrypt', input, encrypted]);
  assert.equal(enc.status, 0, enc.stderr);
  assert.ok(statSync(encrypted).size > 52);
  assert.notEqual(hash(readFileSync(encrypted)), hash(sample), 'ciphertext must differ from plaintext');
  const dec = run(['decrypt', encrypted, output]);
  assert.equal(dec.status, 0, dec.stderr);
  assert.equal(hash(readFileSync(output)), hash(sample), 'authenticated round-trip must preserve bytes');

  const bytes = readFileSync(encrypted);
  bytes[Math.floor(bytes.length / 2)] ^= 0x01;
  writeFileSync(tampered, bytes);
  const tamperResult = run(['decrypt', tampered, join(root, 'tampered.dump')]);
  assert.notEqual(tamperResult.status, 0, 'tampered ciphertext must fail authentication');

  const wrongPass = run(['decrypt', encrypted, join(root, 'wrong-pass.dump')], 'different-wrong-passphrase-000000');
  assert.notEqual(wrongPass.status, 0, 'wrong passphrase must fail authentication');
  console.log(JSON.stringify({
    schema: 'kingsmen.backup-encryption-tests.v1',
    status: 'PASSED',
    passed: true,
    checks: ['AES-256-GCM round-trip', 'ciphertext differs from plaintext', 'tamper rejection', 'wrong-passphrase rejection'],
    liveDatabaseTouched: false
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}
