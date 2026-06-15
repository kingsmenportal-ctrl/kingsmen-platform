# Handoff — N21.2 to N21.3

N21.2 completed the Docling smart intake foundation.

N21.3 should build Playwright Scout Gateway next.

## Why

After documents can produce candidate draft fields, Kingsmen needs verified route/source status.

## N21.3 must create

- `apps/web/src/lib/routes/scout/RouteScoutService.ts`
- `apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts`
- `apps/web/src/app/api/routes/scout/route.ts`
- `scripts/validators/validate-n21-playwright-scout.mjs`

## Boundary

The scout may inspect approved public route/source pages only.
It may not bypass CAPTCHA/OTP/payment or submit applications silently.
