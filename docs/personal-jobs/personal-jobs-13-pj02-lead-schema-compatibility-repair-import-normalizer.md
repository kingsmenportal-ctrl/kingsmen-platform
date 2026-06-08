# PERSONAL-JOBS-13 - PJ02 Lead Schema Compatibility Repair / Import Normalizer

PERSONAL-JOBS-13 repairs imported PJ11 and PJ12 leads into the exact PJ02 opportunity ledger shape.

## Route

`/personal-job-desk/normalizer`

## Reads

- `kingsmen.personalJobs02.externalLeads.v1`

## Writes

- `kingsmen.personalJobs02.externalLeads.v1`
- `kingsmen.personalJobs13.normalizerBackups.v1`
- `kingsmen.personalJobs13.normalizerReports.v1`

## Exact PJ02 shape

Every lead is normalized to:

- `id`
- `createdAt`
- `updatedAt`
- `company`
- `roleTitle`
- `opportunityLink`
- `sourceType`
- `location`
- `workMode`
- `deadline`
- `salaryText`
- `requirementsText`
- `fitReason`
- `riskNotes`
- `confidence`
- `status`
- `nextAction`
- `cvSlot`
- `motivationLetterSlot`
- `proofNote`

## Boundary

This module is local-only.

It does not search the internet.
It does not open external pages.
It does not scrape.
It does not send applications.
It does not send email.
It does not send WhatsApp.
It does not contact employers.
It does not touch payments.
It does not sync calendars.
It does not start Docker.
It does not deploy to Oracle.
It does not claim production readiness.