import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");
const login = await read("../../apps/web/src/app/candidate/login/page.tsx");
const master = await read("../../apps/web/src/app/api/candidate/master-application/route.ts");
const parser = await read("../../apps/web/src/lib/read-limited-json.ts");
const upload = await read("../../apps/web/src/app/api/candidate/documents/upload-url/route.ts");
const finalize = await read("../../apps/web/src/app/api/candidate/documents/finalize/route.ts");
const download = await read("../../apps/web/src/app/api/candidate/documents/read-url/route.ts");
const vault = await read("../../supabase/functions/candidate-private-documents/index.ts");

const checks = [
  [login.includes("/auth/v1/token?grant_type=password"), "candidate login uses Supabase password-token endpoint"],
  [login.includes("/auth/v1/signup"), "registration uses Supabase Auth signup"],
  [login.includes("/auth/v1/recover"), "password recovery uses Supabase Auth recovery"],
  [login.includes('requested.startsWith("/candidate/") && !requested.startsWith("//")'), "post-auth redirect is constrained to candidate routes"],
  [login.includes("sb-${ref}-auth-token"), "session uses the Supabase browser auth key"],
  [login.includes("does not automatically link you to a candidate record"), "authentication does not implicitly resolve candidate identity"],
  [login.includes("authorised identity review"), "identity linking is delegated to authorized review"],
  [master.includes("MAX_REQUEST_BYTES = 128 * 1024"), "master application request has a 128 KiB limit"],
  [master.includes('if (!/^application\\/json(?:\\s*;|$)/i.test(contentType))'), "master application requires strict JSON content type"],
  [master.includes("!Number.isSafeInteger(declaredLength) || declaredLength < 0"), "master application rejects malformed Content-Length"],
  [master.includes("EXPLICIT_CONSENT_REQUIRED"), "master application requires explicit consent"],
  [master.includes("VALID_IDEMPOTENCY_KEY_REQUIRED"), "master application requires an idempotency key"],
  [master.includes('parsedUrl.protocol !== "https:"'), "provider URLs must use HTTPS"],
  [master.includes("IDENTITY_REVIEW_OR_PERMISSION_REQUIRED"), "master application fails closed when candidate identity/permission is unresolved"],
  [master.includes("no provider application was submitted"), "planning save is not represented as provider submission"],
  [parser.includes("maxBytes = 16 * 1024"), "shared API parser defaults to a 16 KiB limit"],
  [parser.includes("await reader.cancel()"), "shared API parser cancels oversized request streams"],
  [parser.includes('new TextDecoder("utf-8", { fatal: true })'), "shared API parser rejects invalid UTF-8"],
  [upload.includes("readLimitedJson(request, 16 * 1024)") && upload.includes("AUTHENTICATION_REQUIRED"), "upload-url API is bounded and bearer-authenticated"],
  [finalize.includes("readLimitedJson(request, 16 * 1024)") && finalize.includes("AUTHENTICATION_REQUIRED"), "finalize API is bounded and bearer-authenticated"],
  [download.includes("readLimitedJson(request, 16 * 1024)") && download.includes("AUTHENTICATION_REQUIRED"), "download-url API is bounded and bearer-authenticated"],
  [upload.includes('"Cache-Control": "no-store"') && finalize.includes('"Cache-Control": "no-store"') && download.includes('"Cache-Control": "no-store"'), "document API responses disable caching"],
  [vault.includes("actualSize !== Number(doc.size_bytes)") && vault.includes("signatureValid"), "vault finalization checks actual size and file signature"],
  [vault.includes('event_type: "READ_LINK_ISSUED"') && vault.includes("if (auditError)"), "signed-link issuance is audited and fails closed"],
  [vault.includes("createSignedUrl(doc.storage_path, 60"), "vault download links expire after 60 seconds"],
];

for (const [passed, description] of checks) assert.ok(passed, description);
console.log(`PASS candidate authentication, master application and Document Vault boundary (${checks.length} assertions)`);
