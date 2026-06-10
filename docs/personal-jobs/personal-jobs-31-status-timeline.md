# PERSONAL-JOBS-31 - Candidate Status Timeline / Evidence-Readable Dashboard

PJ31 consumes PJ30 status advancement audit mirror records and creates a candidate-readable evidence timeline.

## Input

`data/personal-job-desk/status-advancement-audit.local.json`

## Output

`data/personal-job-desk/status-timeline.local.json`

## Route

`/personal-job-desk/status-timeline`

## API

`/api/personal-jobs/status-timeline`

## What PJ31 creates

- Candidate status timeline
- Evidence-readable progress steps
- Candidate-safe summaries
- Proof visibility rules
- Dashboard read model

## Safety

PJ31 is read-only. It does not mutate application tracker records, proof board records, or audit mirror records. It does not send email, WhatsApp, SMS, employer messages, applications, or payments.