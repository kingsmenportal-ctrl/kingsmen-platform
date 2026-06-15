# N21.3 — Next Build Target: Playwright Scout Gateway

Status: queued after N21.2 Docling Smart Intake Foundation  
Purpose: make route/source portal scouting live under Kingsmen safety doctrine.

## Why this is next

Docling smart intake makes documents useful for candidate profiles.
The next public repo integration should make public route/source pages inspectable without unsafe automation.

## Scope

Build a Kingsmen-owned `PlaywrightScoutGateway` that can:

- check an allowlisted public route/source URL;
- record HTTP/page status;
- capture page title and safe metadata;
- detect blocked, changed, down, or manual-review states;
- return MAP/manual fallback reason when needed;
- create evidence for Route Universe and Jarvis.

## Non-negotiable boundary

The gateway may not:

- bypass CAPTCHA;
- bypass OTP;
- perform payment actions;
- submit official applications silently;
- store passwords/cookies/secrets;
- run against unapproved domains;
- write candidate or application truth directly.

## Planned files

| File | Purpose |
|---|---|
| `apps/web/src/lib/routes/scout/RouteScoutService.ts` | Safe route/source scout service. |
| `apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts` | Adapter contract. |
| `apps/web/src/app/api/routes/scout/route.ts` | Review-safe API endpoint. |
| `scripts/validators/validate-n21-playwright-scout.mjs` | Validator. |

## Acceptance

- allowlisted URL can be checked;
- unlisted URL is blocked;
- CAPTCHA/OTP/payment keywords create manual-review state;
- evidence id is returned;
- no submit action exists in the service.
