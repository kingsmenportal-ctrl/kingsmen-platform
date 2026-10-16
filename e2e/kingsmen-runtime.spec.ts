import { test, expect, type Page } from "playwright/test";

const BASE_URL = process.env.KINGSMEN_STAGING_BASE_URL || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const CANDIDATE_A = { email: process.env.TEST_A_EMAIL || "", password: process.env.TEST_A_PW || "" };
const CANDIDATE_B = { email: process.env.TEST_B_EMAIL || "", password: process.env.TEST_B_PW || "" };
const FOUNDER = { email: process.env.FOUNDER_TEST_EMAIL || "", password: process.env.FOUNDER_TEST_PW || "" };
const ACCESS_COOKIE = "kingsmen-access-token";

function required(name: string, value: string): string {
  if (!value.trim()) throw new Error(`Missing required staging E2E setting: ${name}`);
  return value;
}

test.beforeAll(() => {
  const target = new URL(required("KINGSMEN_STAGING_BASE_URL", BASE_URL));
  if (target.protocol !== "https:") throw new Error("Staging E2E requires an HTTPS target.");
  if (["localhost", "127.0.0.1", "::1"].includes(target.hostname)) {
    throw new Error("Staging E2E must not target a local development server.");
  }
  required("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY);
  required("TEST_A_EMAIL", CANDIDATE_A.email);
  required("TEST_A_PW", CANDIDATE_A.password);
  required("TEST_B_EMAIL", CANDIDATE_B.email);
  required("TEST_B_PW", CANDIDATE_B.password);
  required("FOUNDER_TEST_EMAIL", FOUNDER.email);
  required("FOUNDER_TEST_PW", FOUNDER.password);
});

test.describe("Kingsmen Portal — staging runtime evidence", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page, CANDIDATE_A);
  });

  test("1. Candidate A uploads and retrieves their own private document", async ({ page }) => {
    const document = await uploadTextDocument(page, "own-document");
    expect(document.registryStatus).toBe("REGISTERED");
    expect(document.canonicalDocumentRef).toBeTruthy();

    const download = await page.request.get(
      `/api/personal-jobs/apply-now/documents/${encodeURIComponent(document.documentId)}`
    );
    expect(download.status()).toBe(200);
    expect(await download.text()).toContain("Kingsmen staging runtime test fixture");
  });

  test("2. Candidate B cannot read Candidate A's document or storage object", async ({ browser, page }) => {
    const document = await uploadTextDocument(page, "isolation-document");
    expect(typeof document.storagePath).toBe("string");

    const contextB = await browser.newContext({ baseURL: BASE_URL });
    try {
      const pageB = await contextB.newPage();
      await login(pageB, CANDIDATE_B);

      const applicationDownload = await pageB.request.get(
        `/api/personal-jobs/apply-now/documents/${encodeURIComponent(document.documentId)}`
      );
      expect([403, 404]).toContain(applicationDownload.status());

      const cookie = (await contextB.cookies()).find((item) => item.name === ACCESS_COOKIE);
      expect(cookie?.value).toBeTruthy();
      const storagePath = String(document.storagePath);
      const storageUrl = new URL(
        `/storage/v1/object/authenticated/candidate-documents/${storagePath.split("/").map(encodeURIComponent).join("/")}`,
        SUPABASE_URL
      );
      const directStorage = await pageB.request.get(storageUrl.toString(), {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${cookie!.value}`
        }
      });
      expect(directStorage.status()).not.toBe(200);
    } finally {
      await contextB.close();
    }
  });

  test("3. Canonical registration and evidence references survive reload", async ({ page }) => {
    const document = await uploadTextDocument(page, "canonical-registration");
    expect(document.registryStatus).toBe("REGISTERED");
    expect(typeof document.canonicalDocumentRef).toBe("string");
    expect(typeof document.evidenceRef).toBe("string");

    await page.reload();
    await expect(page.getByText(document.fileName, { exact: true })).toBeVisible();
    const refreshed = await getDocument(page, document.documentId);
    expect(refreshed.canonicalDocumentRef).toBe(document.canonicalDocumentRef);
    expect(refreshed.evidenceRef).toBe(document.evidenceRef);
  });

  test("4. A failed delete response never appears as a successful deletion", async ({ page }) => {
    const document = await uploadTextDocument(page, "delete-failure");
    await page.route("**/api/personal-jobs/apply-now", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        let body: { action?: string } = {};
        try { body = request.postDataJSON() as { action?: string }; } catch { /* Continue non-JSON requests normally. */ }
        if (body.action === "deleteDocument") {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              status: "STORAGE_FAILED",
              error: "The private file could not be deleted. The document record was kept."
            })
          });
          return;
        }
      }
      await route.continue();
    });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).first().click();
    await expect(page.getByRole("alert")).toContainText("private file could not be deleted");
    await expect(page.getByText("Document deleted.", { exact: true })).toHaveCount(0);
    await page.unroute("**/api/personal-jobs/apply-now");

    const stillPresent = await getDocument(page, document.documentId);
    expect(stillPresent.documentId).toBe(document.documentId);
  });

  test("5. Founder review is authenticated and persisted with an audit decision", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    try {
      const founderPage = await context.newPage();
      await login(founderPage, FOUNDER);

      const documentRef = required("FOUNDER_TEST_DOCUMENT_REF", process.env.FOUNDER_TEST_DOCUMENT_REF || "");
      const candidateRef = required("FOUNDER_TEST_CANDIDATE_REF", process.env.FOUNDER_TEST_CANDIDATE_REF || "");
      const proofRef = required("FOUNDER_TEST_PROOF_REF", process.env.FOUNDER_TEST_PROOF_REF || "");
      const evidenceRef = required("FOUNDER_TEST_EVIDENCE_REF", process.env.FOUNDER_TEST_EVIDENCE_REF || "");
      const auditId = `e2e_audit_${Date.now()}`;

      const response = await founderPage.request.post("/api/founder/documents/review", {
        data: {
          documentId: documentRef,
          candidateId: candidateRef,
          proofId: proofRef,
          evidenceId: evidenceRef,
          auditId,
          reviewStatus: "needs_more_info",
          safeNotes: "Automated staging review regression; no candidate PII."
        }
      });
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.persisted).toBe(true);
      expect(result.decision.sourceStatusChanged).toBe(false);
      const decisionRef = result.decision.decisionRef as string;
      expect(decisionRef).toBeTruthy();

      const cookie = (await context.cookies()).find((item) => item.name === ACCESS_COOKIE);
      expect(cookie?.value).toBeTruthy();
      const query = new URLSearchParams({
        select: "decision_ref,review_status,safe_notes,source_status_changed",
        decision_ref: `eq.${decisionRef}`
      });
      const persisted = await founderPage.request.get(
        new URL(`/rest/v1/founder_document_review_decisions?${query}`, SUPABASE_URL).toString(),
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${cookie!.value}` } }
      );
      expect(persisted.status()).toBe(200);
      const rows = await persisted.json();
      expect(rows).toHaveLength(1);
      expect(rows[0].review_status).toBe("needs_more_info");
      expect(rows[0].source_status_changed).toBe(false);
    } finally {
      await context.close();
    }
  });

  test("6. Candidate state survives a fresh authenticated browser session", async ({ browser, page }) => {
    const document = await uploadTextDocument(page, "fresh-session");
    const freshContext = await browser.newContext({ baseURL: BASE_URL });
    try {
      const freshPage = await freshContext.newPage();
      await login(freshPage, CANDIDATE_A);
      await freshPage.goto("/candidate/documents");
      await expect(freshPage.getByRole("heading", { name: "Document vault" })).toBeVisible();
      await expect(freshPage.getByText(document.fileName, { exact: true })).toBeVisible();
      const refreshed = await getDocument(freshPage, document.documentId);
      expect(refreshed.canonicalDocumentRef).toBe(document.canonicalDocumentRef);
    } finally {
      await freshContext.close();
    }
  });
});

async function login(page: Page, account: { email: string; password: string }) {
  const response = await page.request.post("/api/auth/login", {
    data: { email: account.email, password: account.password }
  });
  expect(response.status(), "staging test account sign-in must succeed").toBe(200);
  const session = await response.json();
  expect(session.ok).toBe(true);
  expect((await page.context().cookies()).some((cookie) => cookie.name === ACCESS_COOKIE)).toBe(true);
}

async function uploadTextDocument(page: Page, label: string): Promise<Record<string, any>> {
  const fileName = `kingsmen-e2e-${label}-${Date.now()}.txt`;
  await page.goto("/candidate/documents");
  await expect(page.getByRole("heading", { name: "Document vault" })).toBeVisible();
  await page.locator("#candidate-document-file").setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from("Kingsmen staging runtime test fixture. No candidate PII.\n")
  });
  await page.getByRole("button", { name: "Upload document", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Document uploaded and registered in the canonical vault", { timeout: 15000 });
  const response = await page.request.get("/api/personal-jobs/apply-now");
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(Array.isArray(payload.documents)).toBe(true);
  const document = payload.documents.find((item: Record<string, unknown>) => item.fileName === fileName);
  expect(document, "uploaded document must appear in the authenticated workspace").toBeTruthy();
  return document as Record<string, any>;
}

async function getDocument(page: Page, documentId: string): Promise<Record<string, any>> {
  const response = await page.request.get("/api/personal-jobs/apply-now");
  expect(response.status()).toBe(200);
  const payload = await response.json();
  const document = Array.isArray(payload.documents)
    ? payload.documents.find((item: Record<string, unknown>) => item.documentId === documentId)
    : undefined;
  expect(document, "document must remain in the authenticated workspace").toBeTruthy();
  return document as Record<string, any>;
}
