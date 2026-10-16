import { test, expect } from "@playwright/test";

// Synthetic-only API contract tests. These do not create real accounts and
// must not be described as provider-backed end-to-end authentication evidence.
test.describe("server-side auth boundary", () => {
  test("session endpoint never treats missing cookies as authenticated", async ({ request }) => {
    const response = await request.get("/api/auth/session");
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 200) expect(body.authenticated).toBe(false);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("login rejects malformed requests without establishing a session", async ({ request }) => {
    const response = await request.post("/api/auth/login", { data: {} });
    expect(response.status()).toBe(400);
    expect((await response.json()).ok).toBe(false);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("registration enforces minimum password length before provider calls", async ({ request }) => {
    const response = await request.post("/api/auth/register", { data: { email: "synthetic-candidate-a@staging.test", password: "short" } });
    expect(response.status()).toBe(400);
    expect((await response.json()).ok).toBe(false);
  });

  test("refresh without a refresh cookie cannot create a session", async ({ request }) => {
    const response = await request.post("/api/auth/refresh");
    expect(response.status()).toBe(401);
    expect((await response.json()).authenticated).toBe(false);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("logout clears session state even when no session exists", async ({ request }) => {
    const response = await request.post("/api/auth/logout");
    expect(response.status()).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
