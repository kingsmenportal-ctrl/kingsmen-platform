#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sourcePath = join(root, 'apps/api/src/finance/payfast-signature.ts');
const source = readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const module = { exports: {} };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
const { createPayFastSignature, verifyPayFastSignature, redactPayFastSecrets } = module.exports;

const fields = { merchant_id: '10000100', m_payment_id: 'ord_test_001', amount_gross: '169.99', payment_status: 'COMPLETE' };
const signature = createPayFastSignature(fields, 'test-passphrase');
assert.match(signature, /^[a-f0-9]{32}$/);
assert.equal(verifyPayFastSignature(fields, signature, 'test-passphrase'), true, 'valid signature must verify');
assert.equal(verifyPayFastSignature(fields, signature.toUpperCase(), 'test-passphrase'), true, 'hex signature comparison remains case-insensitive');
assert.equal(verifyPayFastSignature(fields, 'invalid-signature', 'test-passphrase'), false, 'malformed signature must fail closed');
assert.equal(verifyPayFastSignature(fields, 'a'.repeat(31), 'test-passphrase'), false, 'short signature must fail closed');
assert.equal(verifyPayFastSignature(fields, 'a'.repeat(33), 'test-passphrase'), false, 'long signature must fail closed');
assert.equal(verifyPayFastSignature(fields, 'g'.repeat(32), 'test-passphrase'), false, 'non-hex signature must fail closed');
assert.equal(verifyPayFastSignature({ ...fields, amount_gross: '170.00' }, signature, 'test-passphrase'), false, 'modified payload must fail verification');
assert.deepEqual(redactPayFastSecrets({ ...fields, merchant_key: 'not-a-real-secret', passphrase: 'not-a-real-passphrase' }), fields, 'credential fields must be redacted');
assert.match(source, /crypto\.timingSafeEqual\(calculated, received\)/, 'comparison must use timingSafeEqual');
console.log(JSON.stringify({ suite: 'payfast-signature-hardening', passed: true, assertions: 9, livePaymentsEnabled: false }, null, 2));
