# PERSONAL-JOBS-02 - Local Job Opportunity Intake / Track External Job Leads

## Purpose

PERSONAL-JOBS-02 adds a local-only job opportunity intake and tracking surface for the founder's personal job campaign.

It lets the founder capture external job leads found outside Kingsmen, including company, role, link, source, location, deadline, fit, confidence, CV slot, motivation-letter slot, status, next action, and proof notes.

## Route

- `/personal-job-desk/opportunities`

## Scope

Local browser-first opportunity tracking.

## What this creates

- A clickable local opportunity intake page.
- A lead capture form for jobs found on Indeed, LinkedIn, company career pages, WhatsApp groups, Facebook posts, referrals, emails, and other external sources.
- A localStorage-backed tracker so leads stay on the founder's laptop/browser.
- Duplicate warning based on company, role, and link.
- Search and status filtering.
- CV slot and motivation-letter slot mapping from 01 to 15.
- Application proof notes for when a job has been applied to externally.
- JSON export/copy for manual backup.

## Hard boundaries

This batch does not:

- send emails
- send WhatsApp messages
- process payments
- store candidate data in Git
- deploy to Oracle
- start Docker
- call external job APIs
- claim production readiness
- replace the full Kingsmen opportunity engine

## Privacy

The private personal profile remains local only at:

- `data/personal-job-desk/personal-candidate.local.json`

Opportunity leads are stored in browser localStorage unless the founder later exports them manually.
