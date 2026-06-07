# PERSONAL-JOBS-01 - Local Personal Job Desk

## Purpose

PERSONAL-JOBS-01 creates a local-only job campaign desk for the founder's own job search while Kingsmen continues being built.

## Route

- `/personal-job-desk`
- `apps/web/src/app/personal-job-desk/page.tsx`

## Local Private Profile

The first personal candidate profile is stored locally at:

- `data/personal-job-desk/personal-candidate.local.json`

This file is intentionally ignored by Git and must not be pushed to GitHub.

## Scope

This batch creates a local interactive job desk that can:

- display the local candidate profile
- show target roles and sectors
- create a campaign brief
- capture opportunities found outside Kingsmen
- track opportunity status in browser localStorage
- plan 15 tailored CV and motivation-letter versions
- keep proof points visible for truthful applications

## Boundaries

This batch does not:

- start Docker
- deploy to Oracle
- claim production readiness
- use secrets
- send email
- send WhatsApp
- process payments
- write candidate data to backend
- store personal data in Git-tracked files
