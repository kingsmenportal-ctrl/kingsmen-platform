import { test, expect } from "@playwright/test";

/**
 * Fail-closed regression coverage for the legacy tracker endpoint.
 *
 * These are synthetic identifiers only. The API must remain unavailable for
 * every caller until verified server-side identity and record ownership exist.
 * This proves the shutdown contract, NOT authenticated A/B isolation.
 */
const CANDIDATE_A = "synthetic-candidate-a";
const CANDIDATE_B = "synthetic-candidate-b";

test.describe("legacy application tracker API fail-closed boundary", () => {
  test("unauthenticated reads do not expose the shared workbench", async ({ request }) => {
    const response = await request.get("/api/personal-jobs/application-tracker");
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("BLOCKED");
    expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
    expect(JSON.stringify(body)).not.toContain("items");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("unauthenticated writes cannot mutate tracker records", async ({ request }) => {
    const response = await request.post("/api/personal-jobs/application-tracker", {
      data: {
        trackerId: "synthetic-tracker-a",
        candidateId: CANDIDATE_A,
        candidateControls: { candidateAcknowledged: true, candidateQuestion: "synthetic test only" }
      }
    });
    expect(response.status()).toBe(503);
    expect((await response.json()).code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
  });

  test("candidate A cannot use caller-supplied identifiers to access candidate B", async ({ request }) => {
    // The route ignores all caller identity/record claims and refuses access.
    // A future authenticated implementation must replace this with true
    // owner-scoped reads/writes and assert 403/404 for cross-owner attempts.
    const response = await request.post("/api/personal-jobs/application-tracker", {
      headers: { "x-test-candidate": CANDIDATE_A },
      data: {
        trackerId: "synthetic-tracker-b",
        workbenchId: "synthetic-workbench-b",
        packId: "synthetic-pack-b",
        candidateId: CANDIDATE_B,
        candidateControls: { candidateAcknowledged: false, candidateQuestion: "attempted cross-candidate write" }
      }
    });
    expect(response.status()).toBe(503);
    expect((await response.json()).code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
  });
});


test.describe("candidate document APIs fail closed until identity and ownership exist", () => {
  test("upload URL endpoint never returns a placeholder or caller-selected candidate identity", async ({ request }) => {
    const response = await request.post("/api/candidate/documents/upload-url", {
      data: {
        candidateId: CANDIDATE_A,
        documentTypeCode: "SYNTHETIC_TEST",
        filename: "synthetic.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128
      }
    });
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
    expect(body).not.toHaveProperty("signedUploadUrl");
    expect(body).not.toHaveProperty("candidateId");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("read URL endpoint refuses caller-supplied candidate B document identifiers", async ({ request }) => {
    const response = await request.post("/api/candidate/documents/read-url", {
      data: { candidateId: CANDIDATE_B, documentId: "synthetic-document-b" }
    });
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
    expect(body).not.toHaveProperty("signedReadUrl");
    expect(body).not.toHaveProperty("documentId");
  });

  test("document status does not return an unscoped read model", async ({ request }) => {
    const response = await request.get("/api/candidate/documents/status");
    expect(response.status()).toBe(503);
    expect((await response.json()).code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("founder document review does not accept caller-supplied proof IDs as authority", async ({ request }) => {
    const response = await request.post("/api/founder/documents/review", {
      data: {
        documentId: "synthetic-document-b",
        candidateId: CANDIDATE_B,
        proofId: "synthetic-proof",
        evidenceId: "synthetic-evidence",
        auditId: "synthetic-audit"
      }
    });
    expect(response.status()).toBe(503);
    expect((await response.json()).code).toBe("FOUNDER_AUTHORIZATION_NOT_CONFIGURED");
  });
});
