# PERSONAL-JOBS-11 - Local Job Search Import Desk

PERSONAL-JOBS-11 is the local import bridge between job search sources and the existing Kingsmen personal job campaign.

It does not search automatically. It accepts pasted job search content, copied job posts, URLs, search result text, WhatsApp leads, Facebook leads, LinkedIn snippets, Indeed snippets, company career text, or manual notes.

## Route

`/personal-job-desk/import-search`

## Reads

- `data/personal-job-desk/personal-candidate.local.json`
- `kingsmen.personalJobs02.externalLeads.v1`

## Writes

- `kingsmen.personalJobs11.searchImportBatches.v1`
- Optionally appends clean imported leads to `kingsmen.personalJobs02.externalLeads.v1`

## Provides

- Paste box for copied search results and URLs
- Source label and import mode
- Local parsing into structured job leads
- URL extraction
- Salary hint detection
- Deadline hint detection
- Location hint detection
- Work mode hint detection
- Duplicate-risk check against PJ02
- Confidence banding
- Save import batch
- Push clean leads into PJ02
- Export and copy JSON
- Links into PJ02, PJ03, and PJ10

## Boundary

This module is local-only.

It does not browse the internet.
It does not scrape websites.
It does not send applications.
It does not send email.
It does not send WhatsApp.
It does not contact employers.
It does not touch payments.
It does not start Docker.
It does not deploy to Oracle.
It does not claim production readiness.

Imported leads remain unverified until the user verifies the source.