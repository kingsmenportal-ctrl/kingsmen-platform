# PERSONAL-JOBS-30 - Status Advancement Writer / Audit Mirror

PJ30 consumes PJ29 proof review board items and creates a status advancement audit mirror.

## Input

`data/personal-job-desk/proof-review-board.local.json`

## Output

`data/personal-job-desk/status-advancement-audit.local.json`

## Route

`/personal-job-desk/status-advancement`

## API

`/api/personal-jobs/status-advancement`

## What PJ30 creates

- Status advancement audit records
- Proof-backed target status mirror
- Candidate-facing status message drafts
- Manual-send proof fields
- Audit mirror controls

## Safety

PJ30 does not mutate PJ24 application tracker automatically, does not mutate PJ29 proof board automatically, does not send email, WhatsApp, SMS, employer messages, applications, or payments. It writes an audit mirror only.