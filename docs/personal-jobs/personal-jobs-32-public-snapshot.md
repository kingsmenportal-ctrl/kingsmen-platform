# PERSONAL-JOBS-32 - Candidate-Safe Public Job Desk Snapshot / Exportable Progress Report

PJ32 consumes PJ31 status timeline items and creates a candidate-safe public snapshot plus exportable progress report.

## Input

`data/personal-job-desk/status-timeline.local.json`

## Output

`data/personal-job-desk/public-snapshot.local.json`

## Route

`/personal-job-desk/public-snapshot`

## API

`/api/personal-jobs/public-snapshot`

## What PJ32 creates

- Candidate-safe snapshot items
- Redacted evidence summaries
- Exportable markdown progress report
- Public-safe progress dashboard
- Candidate-safe visibility rules

## Safety

PJ32 is read-only. It does not expose sensitive proof, mutate trackers, submit applications, contact employers, send email, send WhatsApp, send SMS, touch payments, or claim production readiness.