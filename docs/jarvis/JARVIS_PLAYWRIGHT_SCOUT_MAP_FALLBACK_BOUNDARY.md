# Jarvis Playwright Scout MAP Fallback Boundary

Schema: `kingsmen.jarvis-playwright-scout-map-fallback-boundary.v1`

Route: `/api/jarvis/playwright-scout-map-fallback-boundary`

Jarvis may inspect Playwright readiness, but Playwright remains a probe/scout only. It may not become final application authority, bypass backend policy, bypass an institution rule, or automate CAPTCHA/OTP flows.

## Locked doctrine

- Playwright scout/probe only.
- Backend command envelope required.
- PostgreSQL Truth Vault remains system truth.
- Manual Application Package fallback is required.
- Phoenix fallback is required.
- CAPTCHA/OTP is manual-only.
- No fake status.
- No raw secrets.
- No direct provider calls from web.
- No local shell execution from web.
- Browser may not run Playwright directly.
- Portal automation may not bypass policy.

## Required runtime evidence

Runtime proof must show:

1. `/api/jarvis/playwright-scout-map-fallback-boundary` returns the boundary payload.
2. Backend health is reachable.
3. Backend storage mode is `postgres_truth_vault`.
4. Jarvis command envelope accepts `PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK`.
5. MAP fallback remains enabled.
6. Phoenix fallback remains enabled.
7. CAPTCHA/OTP automation remains blocked.

If any institution portal blocks automation, the system must generate a Manual Application Package and continue by manual route instead of pretending the portal submission succeeded.
