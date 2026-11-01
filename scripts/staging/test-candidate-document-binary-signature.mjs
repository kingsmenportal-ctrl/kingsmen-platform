import assert from "node:assert/strict";
import { isAllowedDocumentSignature, sha256Hex } from "../../supabase/functions/candidate-private-documents/document-signature.mjs";

assert.equal(isAllowedDocumentSignature(new TextEncoder().encode("%PDF-1.7"), "application/pdf"), true);
assert.equal(isAllowedDocumentSignature(new Uint8Array([0xff,0xd8,0xff,0x00]), "image/jpeg"), true);
assert.equal(isAllowedDocumentSignature(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), true);
assert.equal(isAllowedDocumentSignature(new TextEncoder().encode("%PD"), "application/pdf"), false);
assert.equal(isAllowedDocumentSignature(new Uint8Array([0xff,0xd8]), "image/jpeg"), false);
assert.equal(isAllowedDocumentSignature(new Uint8Array([0x89,0x50,0x4e,0x47]), "image/png"), false);
assert.equal(isAllowedDocumentSignature(new TextEncoder().encode("<svg></svg>"), "image/png"), false);
assert.equal(isAllowedDocumentSignature(new TextEncoder().encode("%PDF-1.7"), "image/png"), false);
assert.equal(isAllowedDocumentSignature(new Uint8Array(), "application/octet-stream"), false);
assert.equal(await sha256Hex(new TextEncoder().encode("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

console.log("PASS private document binary signature and SHA-256 tests (10 assertions).");
