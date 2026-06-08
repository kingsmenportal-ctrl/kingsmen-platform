# PERSONAL-JOBS-17 - Real Job Discovery Agent / One-Profile Job Finder / Playwright Source Scout

## Purpose

PERSONAL-JOBS-17 corrects the Personal Job Desk direction.

The main goal is not manual job entry. The main goal is:

1. Candidate fills one profile once.
2. Candidate uploads CV/documents once.
3. Kingsmen generates job searches automatically.
4. Kingsmen checks real job sources.
5. Kingsmen creates discovered leads.
6. Kingsmen scores fit.
7. Kingsmen exports leads into the PJ02-compatible intake shape.
8. Candidate/founder reviews before any application is sent.

## Created route

`/personal-job-desk/job-finder`

## Created API route

`/api/personal-jobs/job-finder/run`

## Created agents

- `scripts/agents/personal-job-discovery-agent.mjs`
- `scripts/agents/playwright-job-source-scout.mjs`

## Source adapters

PJ17 includes safe source adapters for:

- RemoteOK public API
- Arbeitnow public job board API
- Greenhouse public boards, when a company board token is configured
- Lever public boards, when a company slug is configured
- RSS feeds, when configured
- Optional Playwright careers-page scout, when Playwright is installed and a specific authorised URL is passed

## Local private files

These remain local and must not be committed:

- `data/personal-job-desk/personal-candidate.local.json`
- `data/personal-job-desk/job-search-sources.local.json`
- `data/personal-job-desk/discovered-jobs.local.json`
- `data/personal-job-desk/job-discovery-runs.local.json`

## Safety boundary

PJ17 does not:

- Submit applications
- Send emails
- Send WhatsApp messages
- Contact employers
- Touch payments
- Use credentials
- Bypass login, OTP, or CAPTCHA
- Claim production readiness
- Claim Oracle deployment

PJ17 finds and prepares. Human approval remains required before applying.