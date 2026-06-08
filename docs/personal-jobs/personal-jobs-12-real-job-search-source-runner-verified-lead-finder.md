# PERSONAL-JOBS-12 - Real Job Search Source Runner / Verified Lead Finder

PERSONAL-JOBS-12 is the local source-runner layer for the personal job campaign.

It helps the user run controlled job-search missions against known public source pages, open those pages in the browser, inspect opportunities manually, and capture verified leads into PJ02.

## Route

`/personal-job-desk/source-runner`

## Reads

- `data/personal-job-desk/personal-candidate.local.json`
- `kingsmen.personalJobs02.externalLeads.v1`

## Writes

- `kingsmen.personalJobs12.sourceRunnerSessions.v1`
- `kingsmen.personalJobs02.externalLeads.v1`

## Provides

- Source selection
- Keyword and location mission builder
- Real source-opening buttons
- Mission JSON export/copy
- Manual verified lead capture
- Push to PJ02
- Links to PJ11 import desk, PJ02 leads, PJ03 shortlist, and PJ10 daily loop

## Source boundary

This module opens public source pages under user control.

It does not auto-submit applications.
It does not send email.
It does not send WhatsApp.
It does not contact employers.
It does not touch payments.
It does not use secrets.
It does not run background bots.
It does not extract website content automatically.
It does not deploy to Oracle.
It does not claim production readiness.

All captured leads must still be reviewed by the user before scoring and applying.