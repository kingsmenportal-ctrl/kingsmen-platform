# PERSONAL-JOBS-07 — Outcome Ledger / Offer Decision / Job Search Command Dashboard

PERSONAL-JOBS-07 is the local command dashboard for the personal job-search system.

It summarises the full local campaign from PERSONAL-JOBS-02 through PERSONAL-JOBS-06 and adds an outcome ledger for interviews, offers, rejections, closed routes, and final decisions.

## Route

`/personal-job-desk/outcomes`

## Reads

- `kingsmen.personalJobs02.externalLeads.v1`
- `kingsmen.personalJobs03.shortlist.v1`
- `kingsmen.personalJobs04.applyPacks.v1`
- `kingsmen.personalJobs05.submissions.v1`
- `kingsmen.personalJobs06.followUps.v1`

## Writes

- `kingsmen.personalJobs07.outcomeLedger.v1`

## Provides

- Campaign summary dashboard
- Daily command list
- Outcome ledger
- Offer decision support
- Offer risk notes
- Proof reference capture
- Hired / rejected / closed tracking
- Exportable local JSON

## Boundary

This module is local-only.

It does not send applications.
It does not send messages.
It does not touch payments.
It does not sync external calendars.
It does not contact employers.
It does not claim production readiness.
It does not claim Oracle deployment.

The user remains responsible for truthful manual decisions, proof capture, and safe employment choices.