import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [login, master, parser, upload, finalize, download, vault, workbenchPage, entry] = await Promise.all([
  read("../../apps/web/src/app/candidate/login/page.tsx"),
  read("../../apps/web/src/app/api/candidate/master-application/route.ts"),
  read("../../apps/web/src/lib/read-limited-json.ts"),
  read("../../apps/web/src/app/api/candidate/documents/upload-url/route.ts"),
  read("../../apps/web/src/app/api/candidate/documents/finalize/route.ts"),
  read("../../apps/web/src/app/api/candidate/documents/read-url/route.ts"),
  read("../../supabase/functions/candidate-private-documents/index.ts"),
  read("../../apps/web/src/app/candidate/workbench/page.tsx"),
  read("../../apps/web/src/app/candidate/page.tsx")
]);
const checks = [
  [login.includes("/auth/v1/token?grant_type=password"), "password sign-in uses Supabase Auth"],
  [login.includes("/auth/v1/signup"), "registration uses Supabase Auth"],
  [login.includes("/auth/v1/recover"), "recovery uses Supabase Auth"],
  [login.includes('requested.startsWith("/candidate/") && !requested.startsWith("//")'), "redirect stays within candidate routes"],
  [login.includes("sb-${ref}-auth-token"), "session uses Supabase browser key"],
  [login.includes("does not automatically link you to a candidate record"), "login does not silently link identity"],
  [login.includes("authorised identity review"), "identity linking requires authorized review"],
  [master.includes("MAX_REQUEST_BYTES = 128 * 1024"), "master API has a 128 KiB request cap"],
  [master.includes('if (!/^application\\/json(?:\\s*;|$)/i.test(contentType))'), "master API requires strict JSON MIME"],
  [master.includes("!Number.isSafeInteger(declaredLength) || declaredLength < 0"), "master API rejects malformed content length"],
  [master.includes("EXPLICIT_CONSENT_REQUIRED"), "master API requires explicit consent"],
  [master.includes("VALID_IDEMPOTENCY_KEY_REQUIRED"), "master API requires idempotency key"],
  [master.includes('parsedUrl.protocol !== "https:"'), "provider links require HTTPS"],
  [master.includes("IDENTITY_REVIEW_OR_PERMISSION_REQUIRED"), "unresolved candidate identity fails closed"],
  [master.includes("no provider application was submitted"), "planning save is not misrepresented as provider submission"],
  [parser.includes("maxBytes = 16 * 1024"), "shared parser defaults to 16 KiB"],
  [parser.includes("await reader.cancel()"), "oversized body stream is cancelled"],
  [parser.includes('new TextDecoder("utf-8", { fatal: true })'), "invalid UTF-8 is rejected"],
  [upload.includes("readLimitedJson(request, 16 * 1024)") && upload.includes("AUTHENTICATION_REQUIRED"), "upload-url API is bounded and authenticated"],
  [finalize.includes("readLimitedJson(request, 16 * 1024)") && finalize.includes("AUTHENTICATION_REQUIRED"), "finalize API is bounded and authenticated"],
  [download.includes("readLimitedJson(request, 16 * 1024)") && download.includes("AUTHENTICATION_REQUIRED"), "download-url API is bounded and authenticated"],
  [upload.includes('"Cache-Control": "no-store"') && finalize.includes('"Cache-Control": "no-store"') && download.includes('"Cache-Control": "no-store"'), "document responses disable caching"],
  [vault.includes("actualSize !== Number(doc.size_bytes)") && vault.includes("signatureValid"), "vault checks actual file size and signature"],
  [vault.includes('event_type: "READ_LINK_ISSUED"') && vault.includes("if (auditError)"), "download link audit fails closed"],
  [vault.includes("createSignedUrl(doc.storage_path, 60"), "download link expires after 60 seconds"],
  [["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP", "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT"].every(pathway => workbenchPage.includes(pathway)), "candidate workbench represents all six national pathways"],
  [workbenchPage.includes("provider-confirmed") && workbenchPage.includes("candidate-reported"), "workbench distinguishes candidate-reported from provider-confirmed state"],
  [workbenchPage.includes("programme choices") || workbenchPage.includes("programme choice"), "workbench communicates parent application and programme-choice model"],
  [entry.includes("/candidate/workbench") && entry.includes("/candidate/login"), "candidate entry connects to the authenticated workbenchPage and login"]
];
for (const [passed, description] of checks) assert.ok(passed, description);
console.log(`PASS candidate journey security contract (${checks.length} assertions)`);
