# PERSONAL-JOBS-19 - Playwright Source Queue / Employer Career Page Scout / SA Source Health Report

## Purpose

PERSONAL-JOBS-19 adds the first controlled Playwright scout to the Personal Job Desk.

PJ18 can fetch normal public HTML. PJ19 handles the next real-world problem: many South African career pages are JavaScript-rendered or portal-backed. Kingsmen needs a browser scout that can open public pages, wait for rendered content, extract visible job links, and report source health.

## Created route

`/personal-job-desk/source-scout`

## Created API route

`/api/personal-jobs/source-scout/run`

## Created agent

`scripts/agents/personal-job-playwright-source-scout.mjs`

## Inputs

- `data/personal-job-desk/personal-candidate.local.json`
- `data/personal-job-desk/sa-job-sources.local.json`
- optional `data/personal-job-desk/source-scout-queue.local.json`

## Outputs

Local outputs are private and ignored by Git:

- `data/personal-job-desk/playwright-source-scout-results.local.json`
- `data/personal-job-desk/sa-source-health.local.json`
- `reports/personal-jobs/personal-jobs-19-source-scout-latest.json`

## Health statuses

PJ19 classifies sources as:

- `HEALTHY_STATIC`
- `HEALTHY_JS_RENDERED`
- `NO_JOB_LINKS_FOUND`
- `BLOCKED_BY_LOGIN`
- `BLOCKED_BY_CAPTCHA`
- `PORTAL_DOWN`
- `TIMEOUT`
- `MANUAL_REVIEW_REQUIRED`

## Safety boundary

PJ19 does not:

- Submit applications
- Send emails
- Send WhatsApp messages
- Contact employers
- Touch payments
- Use credentials
- Bypass login
- Bypass OTP
- Bypass CAPTCHA
- Claim Oracle deployment
- Claim production readiness

PJ19 is a scout only. Human approval remains required before any application action.