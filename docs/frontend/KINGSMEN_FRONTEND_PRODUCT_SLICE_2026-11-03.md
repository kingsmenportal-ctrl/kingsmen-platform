# Kingsmen frontend product slice — 2026-11-03

## Scope

Integrate the uploaded seven-screen HTML/CSS prototype into the existing Kingsmen Next.js app, preserving the site's navy/gold identity and safer server-authoritative state boundaries.

## Implemented frontend surfaces

- Responsive homepage with six canonical pathways.
- `/packages/` with the seven canonical paid products, explicit ZAR dot-decimal prices, correct priority-volume and concurrent managed-route limits, accommodation terms, and a separate free Destiny Map.
- `/candidate/login/`, `/auth/register/`, `/auth/callback/` and sign-out using the configured Supabase Auth endpoints.
- `/candidate/dashboard/` with candidate workspace navigation.
- `/candidate/profile/` connected to the profile service for load/save, six-pathway preferences, consent state and correction workflows.
- `/candidate/opportunity-matches/` and `/candidate/saved-opportunities/` using verified source feeds and authenticated save/list service contracts.
- `/candidate/workbench/` connected to `candidate-application-preparation`; parent application preparation is not provider submission.
- `/free-destiny-map/` connected to the existing consent-checked public intake API boundary.
- `/candidate/documents/` connected to private signed upload/finalise/list/download operations with browser preflight and server-side integrity evidence.
- `/candidate/finance/`, explicit PayFast sandbox checkout component, and separate payment return/cancel routes. The browser return never marks an order paid.
- `/preview/payment-confirmed/` and `/preview/staff-review/` remain clearly synthetic design examples.
- Static reference/smoke checks remain in `apps/web-frontend/`.

## Canonical products

| Product | Price | Priority applications | Concurrent managed-route capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor’s Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| CV Revamp | R49.99 | Standalone | 0 |

Foundational Accord includes 8 accommodation routes; accommodation support is available with paid plans. CV Revamp has 15 CV versions and 15 motivation letters, target 3 business days, and conditional +2 routes only after verified ownership and an eligible upgrade. Free Destiny Map is a separate R0 entry.

## Security and truth boundaries

- Browser-selected plan IDs are display preferences only; checkout reads and enforces server-side plan catalogue, confirmed email, verified candidate identity and idempotency.
- Checkout is sandbox-only, restricted to the allowed PayFast staging domain and permitted staging origins.
- Only validated server-side PayFast ITN/settlement records can activate a paid entitlement.
- Private document service does server-side content/size/hash validation and requires verified candidate identity and consent. Candidate UI cannot approve its own files.
- Matching/saved routes require approved, fresh source evidence and eligibility. No provider submission or receipt is implied by preparing an application draft.
- Candidate A/B, profile persistence across re-login, file upload/download, and checkout/ITN need authenticated staging runtime evidence before describing them as end-to-end verified.

## Validation/deployment

PR #317 is the consolidated frontend review stream. Earlier commits passed repository tests, API build and Next.js build. Latest-head CI must be read from the exact current SHA because the branch changed during this work.

Staging publish is still blocked at credential preflight: `NETLIFY_AUTH_TOKEN` is empty. No Netlify CLI deploy was invoked for the failed attempt; therefore no deployment URL, deploy ID or deployed SHA can be claimed. Add the Netlify personal access token as a GitHub Actions repository secret (do not paste it into chat), then rerun the draft-only job. The workflow deliberately omits `--prod` and smoke-tests the created preview before reporting its URL and ID.
