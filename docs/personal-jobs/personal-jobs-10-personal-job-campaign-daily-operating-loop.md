# PERSONAL-JOBS-10 - Personal Job Campaign Daily Operating Loop

PERSONAL-JOBS-10 is the daily command desk for the local personal job-search system.

It reads the already-built personal job desks and tells the user what to do today.

## Route

`/personal-job-desk/daily-loop`

## Reads

- `kingsmen.personalJobs02.externalLeads.v1`
- `kingsmen.personalJobs03.shortlist.v1`
- `kingsmen.personalJobs04.applyPacks.v1`
- `kingsmen.personalJobs05.submissions.v1`
- `kingsmen.personalJobs06.followUps.v1`
- `kingsmen.personalJobs07.outcomeLedger.v1`
- `kingsmen.personalJobs08.realUseGate.v1`
- `data/personal-job-desk/personal-candidate.local.json`

## Writes

- `kingsmen.personalJobs10.dailyOperatingLoop.v1`

## Provides

- Daily campaign targets
- Local pipeline counts
- Command sequence for the day
- Mark-done tracking
- Campaign health summary
- Exportable daily JSON report
- Links back to all personal job desks

## Boundary

This module is local-only.

It does not send applications.
It does not send email.
It does not send WhatsApp.
It does not contact employers.
It does not touch payments.
It does not sync calendars.
It does not start Docker.
It does not deploy to Oracle.
It does not claim production readiness.