import { test, expect } from "@playwright/test";

/**
 * Security-contract checks for candidate APIs. These tests deliberately use
 * no authenticated browser state and never submit real candidate data.
 * An unauthenticated request must fail closed; placeholder IDs must never
 * result in candidate data or a usable storage URL.
 */
test.describe("candidate API security boundary", () => {
  for (const path of ["/api/candidate/profile", "/api/candidate/applications"]) {
    test(`GET ${path} fails closed without an authenticated session`, async ({ request }) => {
      const response = await request.get(path);
      expect([401, 503]).toContain(response.status());
      expect(response.headers()["cache-control"]).toContain("no-store");

      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(["SIGNED_OUT", "UNAVAILABLE"]).toContain(body.status);
      expect(body.code).toBeTruthy();
      expect(body).not.toHaveProperty("candidate");
      expect(body).not.toHaveProperty("applications");
      expect(body).not.toHaveProperty("profile");
    });
  }

  test("PATCH /api/candidate/profile cannot write without an authenticated session", async ({ request }) => {
    const response = await request.patch("/api/candidate/profile", {
      data: { displayName: "Kingsmen API security test", candidateId: "untrusted-test-id" },
    });
    expect([401, 503]).toContain(response.status());
    expect(response.headers()["cache-control"]).toContain("no-store");

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(["SIGNED_OUT", "UNAVAILABLE"]).toContain(body.status);
    expect(body.code).toBeTruthy();
    expect(body).not.toHaveProperty("profile");
  });

  test("document status never returns records before ownership authorization exists", async ({ request }) => {
    const response = await request.get("/api/candidate/documents/status");
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
    expect(body).not.toHaveProperty("documents");
    expect(body).not.toHaveProperty("candidate");
  });

  for (const path of [
    "/api/candidate/documents/read-url",
    "/api/candidate/documents/upload-url",
  ]) {
    test(`POST ${path} rejects caller-supplied ownership identifiers`, async ({ request }) => {
      const response = await request.post(path, {
        data: {
          candidateId: "untrusted-test-candidate",
          documentId: "untrusted-test-document",
          documentTypeCode: "IDENTITY",
          filename: "not-a-real-document.pdf",
          mimeType: "application/pdf",
          sizeBytes: 128,
        },
      });
      expect(response.status()).toBe(503);
      expect(response.headers()["cache-control"]).toContain("no-store");
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
      expect(body).not.toHaveProperty("url");
      expect(body).not.toHaveProperty("signedUrl");
      expect(body).not.toHaveProperty("uploadUrl");
    });
  }
  for (const endpoint of [
    { path: "/api/candidate/workbench/readiness", payload: { candidateId: "untrusted-candidate", routeId: "untrusted-route" } },
    { path: "/api/candidate/workbench/cao-optimizer", payload: { candidateId: "untrusted-candidate", parentApplicationId: "untrusted-application" } },
    { path: "/api/candidate/workbench/choice-optimizer", payload: { candidateId: "untrusted-candidate", routeId: "untrusted-route", gate: "untrusted-gate" } },
  ]) {
    test(`POST ${endpoint.path} does not trust caller-supplied ownership identifiers`, async ({ request }) => {
      const response = await request.post(endpoint.path, { data: endpoint.payload });
      expect(response.status()).toBe(503);
      expect(response.headers()["cache-control"]).toContain("no-store");
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.productionReady).toBe(false);
      expect(body.code).toBe("CANDIDATE_AUTHORIZATION_NOT_CONFIGURED");
      expect(body).not.toHaveProperty("candidate");
      expect(body).not.toHaveProperty("application");
      expect(body).not.toHaveProperty("result");
      expect(body.serviceRoleVisibleToBrowser).toBe(false);
    });
  }


  test("candidate session introspection is private and reveals no candidate identifier", async ({ request }) => {
    const response = await request.get("/api/candidate-auth/session");
    expect([401, 503]).toContain(response.status());
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body).not.toHaveProperty("candidateId");
    expect(body).not.toHaveProperty("candidate");
    expect(body).not.toHaveProperty("sessionId");
  });

  test("candidate login rejects an untrusted or missing Origin before credential processing", async ({ request }) => {
    const response = await request.post("/api/candidate-auth/login", {
      data: { email: "kingsmen-test-a@staging.test", password: "not-a-real-password" },
    });
    expect(response.status()).toBe(403);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe("ORIGIN_NOT_ALLOWED");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("kingsmen_candidate_session=");
  });

  test("candidate logout rejects an untrusted or missing Origin and does not clear arbitrary cookies", async ({ request }) => {
    const response = await request.post("/api/candidate-auth/logout", {
      headers: { cookie: "unrelated=keep-me" },
    });
    expect(response.status()).toBe(403);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe("ORIGIN_NOT_ALLOWED");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("kingsmen_candidate_session=");
  });

  test("candidate auth endpoints enforce their HTTP methods", async ({ request }) => {
    const login = await request.get("/api/candidate-auth/login");
    expect(login.status()).toBe(405);
    expect(login.headers()["allow"]).toBe("POST");
    expect(login.headers()["cache-control"]).toContain("no-store");

    const logout = await request.get("/api/candidate-auth/logout");
    expect(logout.status()).toBe(405);
    expect(logout.headers()["allow"]).toBe("POST");
    expect(logout.headers()["cache-control"]).toContain("no-store");
  });

});
