# PERSONAL-JOBS-15 - Personal Job Desk Runtime Click Test / Local UI Smoke Gate

PERSONAL-JOBS-15 proves the personal job desk is not only file-valid, but locally reachable in the running Next.js app.

## Route

`/personal-job-desk/runtime-click-test`

## Runtime targets

- `/personal-job-desk`
- `/personal-job-desk/opportunities`
- `/personal-job-desk/shortlist`
- `/personal-job-desk/apply-pack`
- `/personal-job-desk/submissions`
- `/personal-job-desk/follow-up`
- `/personal-job-desk/outcomes`
- `/personal-job-desk/real-use-gate`
- `/personal-job-desk/daily-loop`
- `/personal-job-desk/import-search`
- `/personal-job-desk/source-runner`
- `/personal-job-desk/normalizer`
- `/personal-job-desk/navigation`
- `/personal-job-desk/runtime-click-test`

## What it proves

- The local Next.js server is running.
- Personal job routes respond with HTTP 200.
- The navigation and real-use gate include PJ11, PJ12, PJ13, and PJ15.
- The user can manually click through all local personal job desk surfaces.
- PJ14 route/key compatibility is repaired for `/personal-job-desk/outcomes` and the current localStorage keys.

## Boundary

This module is local-only.

It does not search the internet.
It does not scrape websites.
It does not send applications.
It does not send email.
It does not send WhatsApp.
It does not contact employers.
It does not touch payments.
It does not sync calendars.
It does not start Docker.
It does not deploy to Oracle.
It does not claim production readiness.