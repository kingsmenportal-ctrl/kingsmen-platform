# PERSONAL-JOBS-06 — Follow-Up Calendar / Interview Prep / Response Tracker

PERSONAL-JOBS-06 is the local-only follow-up desk for the personal job-search system.

It reads the manual submission evidence ledger created by PERSONAL-JOBS-05 and helps track what must happen after an application is manually prepared or submitted.

## Route

`/personal-job-desk/follow-up`

## It provides

- Follow-up date tracking
- Recruiter response tracking
- Interview invitation status tracking
- Interview date capture
- Interview preparation notes
- Offer, rejection, and closed-no-response status tracking
- Exportable local follow-up ledger

## Boundary

This module is local-only.

It does not send applications.
It does not send messages.
It does not touch payments.
It does not sync to external calendars.
It does not claim production readiness.
It does not claim Oracle deployment.

The candidate remains responsible for truthful manual action, proof capture, and safe follow-up behaviour.

## Storage

Reads:

`kingsmen.personalJobs05.submissions.v1`

Writes:

`kingsmen.personalJobs06.followUps.v1`

Private local profile:

`data/personal-job-desk/personal-candidate.local.json`

The local private profile must remain ignored by Git.

## Doctrine fit

PERSONAL-JOBS-06 supports candidate velocity without pretending to automate what is not safely wired yet. It moves the personal job system from captured opportunities, shortlisted targets, apply packs, and submission proof into interviews, replies, next actions, and outcomes.