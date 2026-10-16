import { test, expect } from "@playwright/test";

/**
 * Security-contract checks for candidate APIs. These tests deliberately use
 * no authenticated browser state and never submit real candidate data.
 * Depending on environment configuration, an unauthenticated request must be
 * rejected as signed-out (401) or unavailable (503), never accepted.
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
      // The unauthenticated response must not expose candidate records.
      expect(body).not.toHaveProperty("candidate");
      expect(body).not.toHaveProperty("applications");
      expect(body).not.toHaveProperty("profile");
    });
  }

  test("PATCH /api/candidate/profile does not write without an authenticated session", async ({ request }) => {
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
});
