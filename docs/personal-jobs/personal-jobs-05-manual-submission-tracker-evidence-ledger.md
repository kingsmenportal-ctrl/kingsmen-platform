# PERSONAL-JOBS-05 — Manual Application Submission Tracker / Evidence Ledger

## Purpose

PERSONAL-JOBS-05 gives the local personal job desk a manual application ledger. It records where the user applied, how the application was submitted, what proof exists, when follow-up is due, and what the next action is.

This is not a production submission engine. It does not send applications, emails, WhatsApps, payment requests, portal submissions, or employer contact.

## Route

`/personal-job-desk/submissions`

## Inputs

Reads prepared draft apply packs from:

`kingsmen.personalJobs04.applyPacks.v1`

## Outputs

Writes manual submission records to:

`kingsmen.personalJobs05.submissions.v1`

## Evidence doctrine

Each application row must carry enough evidence for the founder/user to know:

- where the opportunity came from;
- what was submitted;
- when it was submitted;
- what proof exists;
- what still needs follow-up;
- what risk or uncertainty remains.

## Safety boundary

This module is local-only and draft/evidence-only. Human review and manual action remain required before any external submission or contact.
