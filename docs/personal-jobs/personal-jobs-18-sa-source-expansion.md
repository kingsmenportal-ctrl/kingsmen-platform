# PERSONAL-JOBS-18 - South African Job Source Expansion / Real Local Lead Adapters

## Purpose

PERSONAL-JOBS-18 expands the Personal Job Desk from generic international discovery into South African source discovery.

PJ17 proved that Kingsmen can run a real discovery agent. PJ18 makes the next correction: Kingsmen must find local South African opportunities from local source groups, not only international remote boards.

## Created route

`/personal-job-desk/sa-sources`

## Created API route

`/api/personal-jobs/sa-sources/run`

## Created agent

`scripts/agents/personal-job-sa-source-runner.mjs`

## Source groups

PJ18 supports these South African source groups:

- Public sector sources
- Retail career pages
- Company career pages
- Learnership and internship source pages
- Job board search landings
- Manual-safe review links

## Local private files

These remain local and must not be committed:

- `data/personal-job-desk/sa-job-sources.local.json`
- `data/personal-job-desk/sa-discovered-jobs.local.json`
- `data/personal-job-desk/sa-source-runs.local.json`
- `reports/personal-jobs/personal-jobs-18-sa-source-runner-latest.json`

## Safety boundary

PJ18 does not:

- Submit applications
- Send emails
- Send WhatsApp messages
- Contact employers
- Touch payments
- Use credentials
- Bypass login, OTP, or CAPTCHA
- Claim production readiness
- Claim Oracle deployment

PJ18 finds and prepares South African leads. Human approval remains required before applying.