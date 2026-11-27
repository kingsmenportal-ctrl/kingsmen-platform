import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webDirectory = path.resolve(root, "apps/web");
const require = createRequire(path.resolve(webDirectory, "package.json"));
const { chromium } = require("playwright");
const baseUrl = "http://127.0.0.1:3000";
const fakeSupabaseRef = "ci-project";
const documentId = "11111111-1111-4111-8111-111111111111";
const uploadToken = "ci-signed-upload-token";
const readToken = "ci-signed-read-token";
const timestamp = "2026-11-25T12:00:00.000Z";
const pdfBytes = Buffer.from("%PDF-1.7\nKingsmen CI private document fixture\n", "utf8");
const expectedDigest = createHash("sha256").update(pdfBytes).digest("hex");
const serviceRequests = [];
const storageRequests = [];
let uploadedBytes = null;
let serverDocument = null;
let latestDocumentType = "ID_DOCUMENT";
let latestFilename = "CI-candidate-document.pdf";
let latestApplicationId = null;
let latestEvidencePurpose = "CANDIDATE_DOCUMENT";

const corsHeaders = {
  "access-control-allow-origin": baseUrl,
  "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
  "access-control-allow-headers": "authorization, apikey, content-type, x-upsert",
  "access-control-max-age": "0"
};
const server = spawn(process.execPath, [
  path.resolve(webDirectory, "node_modules/next/dist/bin/next"),
  "start", "-H", "127.0.0.1", "-p", "3000"
], {
  cwd: webDirectory,
  detached: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://ci-project.supabase.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-only-not-a-real-anon-key"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
server.stdout.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });
server.stderr.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });
let browser;
let context;
let expiredContext;

async function installAuth(contextToConfigure, expiresAt) {
  await contextToConfigure.addInitScript(({ ref, expiry }) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "ci-test-access-token-not-valid-for-any-real-service",
      expires_at: expiry
    }));
  }, { ref: fakeSupabaseRef, expiry: expiresAt });
}

function servicePayload(action) {
  if (action.action === "create_upload") {
    assert.equal(action.mimeType, "application/pdf");
    assert.equal(action.sizeBytes, pdfBytes.length);
    if (action.applicationId) {
      assert.equal(action.applicationId, "ffffffff-ffff-4fff-8fff-fffffffffff1");
      assert.equal(action.documentTypeCode, "APPLICATION_PROOF");
      assert.equal(action.evidencePurpose, "PROVIDER_SUBMISSION_RECEIPT");
    } else {
      assert.equal(action.documentTypeCode, "ID_DOCUMENT");
      assert.equal(action.filename, "CI-candidate-document.pdf");
      assert.equal(action.evidencePurpose, "CANDIDATE_DOCUMENT");
    }
    latestDocumentType = action.documentTypeCode;
    latestFilename = action.filename;
    latestApplicationId = action.applicationId ?? null;
    latestEvidencePurpose = action.evidencePurpose;
    return {
      ok: true,
      documentId,
      document: { id: documentId, status: "UPLOAD_PENDING" },
      signedUploadUrl: "https://ci-storage.test/storage/v1/object/upload/sign/candidate-private-documents/ci-fixture.pdf",
      signedUploadToken: uploadToken
    };
  }
  if (action.action === "finalize_upload") {
    assert.equal(action.documentId, documentId);
    assert.ok(uploadedBytes, "File bytes must reach private storage before finalisation.");
    assert.deepEqual(uploadedBytes, pdfBytes);
    const serverDigest = createHash("sha256").update(uploadedBytes).digest("hex");
    assert.equal(serverDigest, expectedDigest);
    serverDocument = {
      id: documentId,
      filename: latestFilename,
      original_filename: latestFilename,
      document_type: latestDocumentType,
      application_id: latestApplicationId,
      evidence_purpose: latestEvidencePurpose,
      size_bytes: uploadedBytes.length,
      status: "UPLOADED_CANDIDATE_REPORTED",
      sha256_hex: serverDigest,
      uploaded_at: timestamp
    };
    return {
      ok: true,
      status: "UPLOADED_CANDIDATE_REPORTED",
      document: { id: documentId, status: "UPLOADED_CANDIDATE_REPORTED", sha256_hex: serverDigest }
    };
  }
  if (action.action === "create_download_url") {
    assert.equal(action.documentId, documentId);
    assert.equal(serverDocument?.status, "UPLOADED_CANDIDATE_REPORTED");
    return {
      ok: true,
      signedReadUrl: "https://ci-storage.test/storage/v1/object/sign/candidate-private-documents/ci-fixture.pdf?token=" + readToken,
      expiresInSeconds: 60
    };
  }
  throw new Error("Unexpected document action: " + String(action.action));
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Next.js test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/candidate/documents/");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js test server did not become ready.\n" + serverOutput);

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  await installAuth(context, Math.floor(Date.now() / 1000) + 3600);
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(15_000);

  await context.route("**/functions/v1/candidate-private-documents", async route => {
    const request = route.request();
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method === "GET") {
      serviceRequests.push({ method, action: "list", url: request.url() });
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { ok: true, documents: serverDocument ? [serverDocument] : [] }
      });
      return;
    }
    assert.equal(method, "POST");
    const action = request.postDataJSON();
    assert.equal(request.headers().apikey, "ci-only-not-a-real-anon-key");
    assert.match(request.headers().authorization ?? "", /^Bearer ci-test-access-token/);
    serviceRequests.push({ method, action: action.action, body: action, url: request.url() });
    await route.fulfill({ status: 200, headers: corsHeaders, json: servicePayload(action) });
  });

  await context.route("https://ci-storage.test/**", async route => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    storageRequests.push({
      method: request.method(),
      url: request.url(),
      contentType: request.headers()["content-type"],
      upsert: request.headers()["x-upsert"]
    });
    assert.equal(request.method(), "PUT", "Private storage is written only via the signed upload capability.");
    const target = new URL(request.url());
    assert.equal(target.searchParams.get("token"), uploadToken);
    assert.equal(request.headers()["content-type"], "application/pdf");
    assert.equal(request.headers()["x-upsert"], "false");
    uploadedBytes = request.postDataBuffer();
    await route.fulfill({ status: 200, headers: { ...corsHeaders, "content-type": "application/json" }, body: "{}" });
  });

  await page.goto(baseUrl + "/candidate/documents/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your documents, handled carefully." }).waitFor();
  await page.getByRole("heading", { name: "Preflight, upload and track your documents." }).waitFor();
  await page.getByLabel("Document type").selectOption("ID_DOCUMENT");
  await page.locator('input[type="file"]').setInputFiles({
    name: "CI-candidate-document.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes
  });
  await page.getByText("Local preflight passed", { exact: true }).waitFor();
  assert.equal(await page.getByText(expectedDigest, { exact: true }).count(), 1,
    "Browser preflight SHA-256 must match the selected file bytes.");

  await page.getByRole("button", { name: /Upload securely and finalise/ }).click();
  await page.getByText("CI-candidate-document.pdf", { exact: true }).waitFor();
  await page.getByText("Uploaded · awaiting authorised review", { exact: true }).waitFor();
  assert.ok(uploadedBytes, "The selected PDF must reach the private storage signed-upload URL.");
  assert.deepEqual(uploadedBytes, pdfBytes);
  assert.equal(storageRequests.length, 1);
  assert.equal(serviceRequests.filter(item => item.action === "create_upload").length, 1);
  assert.equal(serviceRequests.filter(item => item.action === "finalize_upload").length, 1);
  assert.ok(serviceRequests.some(item => item.method === "GET" && item.action === "list"),
    "Finalised document list must be reloaded from the private service.");
  assert.equal(serverDocument.sha256_hex, expectedDigest);

  await page.getByRole("button", { name: "Request temporary private download" }).click();
  const downloadLink = page.getByRole("link", { name: "Open private file" });
  await downloadLink.waitFor();
  const href = await downloadLink.getAttribute("href");
  assert.ok(href?.startsWith("https://ci-storage.test/"));
  assert.equal(new URL(href).searchParams.get("token"), readToken);
  assert.equal(await downloadLink.getAttribute("target"), "_blank");
  assert.match(await downloadLink.getAttribute("rel") ?? "", /noopener/);
  await page.getByText("expires in approximately 60 seconds", { exact: false }).waitFor();
  assert.equal(serviceRequests.filter(item => item.action === "create_download_url").length, 1);

  // Provider receipts are attached to the exact parent application and stay
  // candidate-reported until independent reviewer verification.
  const receiptPage = await context.newPage();
  const parentApplicationId = "ffffffff-ffff-4fff-8fff-fffffffffff1";
  await receiptPage.goto(baseUrl + "/candidate/documents/?application_id=" + parentApplicationId
    + "&evidence_purpose=PROVIDER_SUBMISSION_RECEIPT", { waitUntil: "networkidle" });
  await receiptPage.getByText("Provider receipt for this Kingsmen application", { exact: true }).waitFor();
  const receiptType = receiptPage.getByLabel("Document type");
  await receiptPage.waitForFunction(() => document.querySelector("select")?.value === "APPLICATION_PROOF");
  assert.equal(await receiptType.isDisabled(), true, "Receipt evidence must keep the provider-proof document type.");
  await receiptPage.locator('input[type="file"]').setInputFiles({
    name: "CI-provider-receipt.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes
  });
  await receiptPage.getByText("Local preflight passed", { exact: true }).waitFor();
  await receiptPage.getByRole("button", { name: /Upload securely and finalise/ }).click();
  await receiptPage.getByText("CI-provider-receipt.pdf", { exact: true }).waitFor();
  const providerReceiptRequest = serviceRequests.find(item =>
    item.action === "create_upload" && item.body?.evidencePurpose === "PROVIDER_SUBMISSION_RECEIPT");
  assert.ok(providerReceiptRequest, "Provider receipt flow must call create_upload.");
  assert.equal(providerReceiptRequest.body.applicationId, parentApplicationId);
  assert.equal(providerReceiptRequest.body.documentTypeCode, "APPLICATION_PROOF");
  assert.equal(providerReceiptRequest.body.evidencePurpose, "PROVIDER_SUBMISSION_RECEIPT");
  assert.equal(serverDocument.application_id, parentApplicationId);
  assert.equal(serverDocument.evidence_purpose, "PROVIDER_SUBMISSION_RECEIPT");
  assert.equal(serverDocument.status, "UPLOADED_CANDIDATE_REPORTED",
    "A candidate upload must not be promoted to verified status.");

  expiredContext = await browser.newContext();
  await installAuth(expiredContext, Math.floor(Date.now() / 1000) - 60);
  const expiredPage = await expiredContext.newPage();
  let expiredDocumentRequests = 0;
  await expiredPage.route("**/functions/v1/candidate-private-documents", async route => {
    expiredDocumentRequests += 1;
    await route.fulfill({ status: 200, headers: corsHeaders, json: { ok: true, documents: [] } });
  });
  await expiredPage.goto(baseUrl + "/candidate/documents/", { waitUntil: "networkidle" });
  await expiredPage.getByText("Your session has expired. Sign in again to continue.", { exact: false }).waitFor();
  assert.equal(expiredDocumentRequests, 0, "Expired session must not read or upload private documents.");

  console.log("PASS: PDF type/size/hash preflight precedes any upload request");
  console.log("PASS: candidate upload uses a signed, non-upserting capability and a separate finalisation request");
  console.log("PASS: server-confirmed document and digest appear in the private-document list");
  console.log("PASS: download uses a short-lived signed URL and safe new-tab attributes");
  console.log("PASS: provider receipt upload is linked to the correct parent application and remains candidate-reported");
  console.log("PASS: expired candidate session is rejected before private-document service calls");
} finally {
  if (expiredContext) await expiredContext.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
