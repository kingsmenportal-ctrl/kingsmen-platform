# PERSONAL-JOBS-20 - Unified Opportunity Command Queue / Apply Readiness Selector

## Purpose

PERSONAL-JOBS-20 turns discovered leads into an action queue.

PJ17 finds general leads.
PJ18 expands South African source discovery.
PJ19 uses Playwright to scout rendered career pages and source health.

PJ20 combines those leads and decides what should happen next.

## Created route

`/personal-job-desk/opportunity-queue`

## Created API route

`/api/personal-jobs/opportunity-queue/build`

## Created agent

`scripts/agents/personal-job-opportunity-command-queue.mjs`

## Inputs

- `data/personal-job-desk/personal-candidate.local.json`
- `data/personal-job-desk/discovered-jobs.local.json`
- `data/personal-job-desk/sa-discovered-jobs.local.json`
- `data/personal-job-desk/playwright-source-scout-results.local.json`
- `data/personal-job-desk/sa-source-health.local.json`

## Outputs

Private local outputs:

- `data/personal-job-desk/opportunity-command-queue.local.json`
- `reports/personal-jobs/personal-jobs-20-opportunity-command-queue-latest.json`

## Readiness states

- `READY_FOR_APPLY_PACK`
- `REVIEWABLE_SA_ROUTE`
- `WATCHLIST`
- `NEEDS_MANUAL_SOURCE_REVIEW`
- `LOW_PRIORITY_REJECT_CANDIDATE`

## Safety boundary

PJ20 does not:

- Submit applications
- Send emails
- Send WhatsApp messages
- Contact employers
- Touch payments
- Use credentials
- Bypass login, OTP, or CAPTCHA
- Claim production readiness
- Claim Oracle deployment

PJ20 only selects which opportunities should move toward apply-pack preparation.