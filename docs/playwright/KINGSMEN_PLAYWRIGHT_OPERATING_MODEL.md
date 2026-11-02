# Kingsmen Playwright operating model

## Purpose

Playwright is a browser execution capability inside Kingsmen. It is not a database, payment authority, candidate identity system, provider authorisation, or application state machine.

This implementation deliberately delivers two separated capabilities:

1. **Kingsmen Browser QA** — Chromium-based, anonymous, read-only browser checks for the Kingsmen web application, executed by GitHub Actions.
2. **Provider Source Scout** — a dedicated, isolated Chromium container that inspects only founder-approved public HTTPS provider sources. It is read-only, single-concurrency, and does not authenticate or interact with forms.

The existing N16 worker policy remains authoritative. Its current contract is `PLAYWRIGHT_SCOUT_ONLY`. This change does not expand that permission.

## Browser QA coverage

The automated QA runner checks the public homepage, Free Destiny Map and Kingsmen entry page at desktop and mobile viewport sizes. It also checks the existing candidate dashboard, documents, workbench, finance, messages, saved-opportunities, Founder Control Plane, proof-centre and admin routes in an unauthenticated session.

It records HTTP outcomes, same-origin navigation, uncaught browser-error counts and mobile horizontal overflow. It does not create candidate accounts, log in, upload documents, submit applications, change payment state, or capture screenshots/traces. Authenticated Candidate A/B and reviewer proof remains a separate staging gate and must use the existing authorised staging E2E process.

Run locally:

```sh
npm ci
npm ci --prefix apps/web
npx playwright install chromium
npm run build --prefix apps/web
npm run start --prefix apps/web
```

In another shell, set `KINGSMEN_QA_BASE_URL` to the local app origin and run:

```sh
KINGSMEN_QA_BASE_URL=http://127.0.0.1:3000 npm run playwright:qa
```

Reports default to `reports/playwright/qa-latest.json`. Reports contain route paths and aggregate diagnostics, not page text, cookies, tokens or response bodies.

## Provider Source Scout

The provider scout covers six pathway classifications:

- `higher_education`
- `tvet`
- `seta_learnership`
- `internship`
- `apprenticeship`
- `employment`

No provider is pre-authorised by the example plan. The template at `data/providers/playwright-source-scout.example.json` intentionally contains an empty source list. Each real source must be explicitly configured with its exact HTTPS URL, exact allowed hostnames, official-source classification, pathway, founder approval identity, approval evidence reference and approval timestamp.

Run policy checks:

```sh
npm run playwright:policy:test
npm run playwright:policy:validate
```

Run an approved scout plan:

```sh
npm run playwright:source-scout -- --plan ./approved-provider-scout-plan.json --dry-run
npm run playwright:source-scout -- --plan ./approved-provider-scout-plan.json
```

The scout:
- accepts only HTTPS URLs on exact host allowlists;
- requires an unexpired approval evidence reference per source;
- enforces one browser context at a time and a maximum of 25 sources per run;
- permits only GET navigation to the allowlisted hosts;
- blocks images, media, fonts, cross-host requests, sensitive query parameters and unapproved redirects;
- does not log in, handle MFA/CAPTCHA, click application controls, fill forms, upload documents, download files, submit applications, contact providers or attempt payments;
- captures page title, meta description, headings and same-host application-related links only;
- does not assign an opportunity open/verified state, eligibility decision, integration status or provider acknowledgement.

A scout result is discovery evidence only. Human source review and the Kingsmen opportunity verification process must determine whether an opportunity is authoritative, current, eligible and open.

## Container build

Build the standalone scout image:

```sh
docker build -f apps/workers/Dockerfile.playwright-scout -t kingsmen-playwright-scout:local .
```

Run it with a mounted work directory containing a reviewed plan:

```sh
docker run --rm -v "$PWD/scout-work:/work" kingsmen-playwright-scout:local
```

The container has no Supabase, PayFast, candidate-session or provider credential. It is a stateless CLI worker and writes a restrictive-permission JSON report to the mounted work directory.

## Integration boundaries

| Kingsmen capability | Playwright role | Authority remains with |
|---|---|---|
| Public website and candidate UI | Anonymous browser QA | Kingsmen application |
| Candidate A/B access | Not proven by this anonymous suite | Supabase RLS and authenticated staging E2E |
| Opportunity discovery | Public-source scout | Source authority and opportunity verification |
| Provider integration | No connection is implied | Provider agreement, credentials and approved adapter |
| Application preparation/submission | Disabled | Candidate, founder and provider-authorised integration |
| Document Vault | UI QA only | Supabase Storage, file validation and reviewer process |
| PayFast | UI QA only | Verified server-side ITN settlement |
| Email | UI QA only | Approved email service and communications outbox |
| Jarvis | Receives evidence only through governed integration | N16 policy gate and founder approval |
| Deployment | CI builds and tests the app/container | Release approvals and hosting platform |

## What remains before a production operations worker

The following are intentionally not claimed complete:

1. Independent review of the N16 worker foundation and this integration.
2. Exact-head CI and branch-protection evidence.
3. Protected Supabase backup and isolated restore.
4. Migration-ledger/source provenance reconciliation and approved change control.
5. Authenticated staging Candidate A/B and reviewer tests.
6. Exact Netlify deployment SHA and authenticated runtime checks.
7. A provider-specific permission/terms review and explicit provider authorisation.
8. Approved secret storage and a least-privilege worker identity.
9. A founder-approved queue handler and an independently tested provider adapter.
10. Provider receipt reconciliation, idempotency and manual recovery tests.

Until those conditions are satisfied, browser QA can run in CI and the public-source scout can run only as an explicitly approved, operator-invoked read-only tool. It is not a live provider-submission service.
