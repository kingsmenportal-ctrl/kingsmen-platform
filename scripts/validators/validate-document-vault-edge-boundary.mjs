import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../../supabase/functions/candidate-private-documents/index.ts", import.meta.url), "utf8");
assert.ok(source.includes("readBoundedJson(req)"), "bounded parser must be used");
assert.ok(source.includes("maxBytes = 16 * 1024"), "16 KiB body cap must exist");
assert.ok(source.includes("Content-Type must be application/json"), "JSON content type must be enforced");
assert.ok(source.includes("total > maxBytes"), "streamed bytes must be capped");
assert.ok(source.includes("declared > maxBytes"), "declared Content-Length must be capped");
assert.ok(source.includes("status: 415"), "non-JSON requests must be rejected");
assert.ok(source.includes("TextDecoder("), "UTF-8 decoding must be explicit");
assert.ok(source.includes("reader.cancel("), "oversized streams must be cancelled");
assert.ok(!source.includes("req.json()"), "unbounded JSON parser must not return");
assert.ok(source.includes('.eq("id", id).eq("candidate_id", candidateId)'), "document finalization must be candidate scoped");
assert.ok(source.includes("createSignedUrl(doc.storage_path, 60"), "signed download links must expire in 60 seconds");

assert.ok(source.includes("const MAX_BYTES = 10 * 1024 * 1024"), "uploaded files must be capped at 10 MiB");
assert.ok(source.includes("image/png") && source.includes("application/pdf") && source.includes("image/jpeg"), "only approved PDF/JPEG/PNG types may be mapped");
assert.ok(source.includes("fileBytes") || source.includes("bytes.subarray") || source.includes("signature"), "finalization must inspect file signature bytes");
assert.ok(source.includes("size_bytes") && source.includes("MAX_BYTES"), "actual upload size must be bounded");
assert.ok(source.includes("READ_LINK_ISSUED"), "download link issuance must be audited");
assert.ok(source.includes("if (auditError)") && source.includes("A download link could not be issued because its audit record could not be saved"), "download must fail closed if audit persistence fails");
assert.ok(source.includes("IDENTITY_NOT_VERIFIED"), "candidate document access must fail closed until identity is verified");
assert.ok(source.includes("DOCUMENT_REVIEWER_REQUIRED"), "reviewer actions must require active reviewer permission");
assert.ok(source.includes("Vary: Origin") || source.includes('"Vary": "Origin"') || source.includes('"Vary": "Origin"'), "responses must vary by origin");
assert.ok(source.includes("if (req.method !== \"POST\")"), "non-POST actions must be rejected");


assert.ok(source.includes("actualSize !== Number(doc.size_bytes)"), "finalization must compare actual and declared file sizes");
assert.ok(source.includes("signatureValid"), "finalization must validate the file signature against its declared MIME type");
assert.ok(source.includes("crypto.subtle.digest(\"SHA-256\", bytes)"), "finalized file bytes must be fingerprinted with SHA-256");
assert.ok(source.includes("createSignedUploadUrl(path, { upsert: false })"), "uploads must not overwrite an existing object path");
assert.ok(source.includes("event_type: \"UPLOAD_CONFIRMED\"") && source.includes("event_type: \"UPLOAD_FAILED\""), "upload success and failure transitions must be auditable");

console.log("PASS Document Vault edge boundary contract (26 assertions)");
