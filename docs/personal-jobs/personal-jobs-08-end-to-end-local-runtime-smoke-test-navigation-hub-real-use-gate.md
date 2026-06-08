# PERSONAL-JOBS-08 - End-to-End Local Runtime Smoke Test / Navigation Hub / Real Use Gate

PERSONAL-JOBS-08 is the local real-use gate for the personal job-search system.

It creates one navigation hub for the full local campaign chain and gives the user a browser-side smoke checklist before using the system for real applications.

## Route

`/personal-job-desk/real-use-gate`

## Links

- `/personal-job-desk`
- `/personal-job-desk/opportunities`
- `/personal-job-desk/shortlist`
- `/personal-job-desk/apply-pack`
- `/personal-job-desk/submissions`
- `/personal-job-desk/follow-up`
- `/personal-job-desk/outcomes`

## Reads

- `data/personal-job-desk/personal-candidate.local.json`
- `kingsmen.personalJobs02.externalLeads.v1`
- `kingsmen.personalJobs03.shortlist.v1`
- `kingsmen.personalJobs04.applyPacks.v1`
- `kingsmen.personalJobs05.submissions.v1`
- `kingsmen.personalJobs06.followUps.v1`
- `kingsmen.personalJobs07.outcomeLedger.v1`

## Writes

- `kingsmen.personalJobs08.realUseGate.v1`

## Provides

- Full local navigation hub
- LocalStorage data presence check
- Browser smoke gate
- Exportable real-use gate JSON
- Local campaign command list
- Real-use boundary notice

## Boundary

This module is local-only.

It does not send applications.
It does not send email.
It does not send WhatsApp.
It does not touch payments.
It does not sync external calendars.
It does not contact employers.
It does not start Docker.
It does not claim Oracle deployment.
It does not claim production readiness.

The user must still manually verify every real job opportunity, submit truthfully, capture proof, and make final employment decisions safely.