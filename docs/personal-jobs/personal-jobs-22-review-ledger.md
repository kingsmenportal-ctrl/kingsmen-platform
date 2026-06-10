# PERSONAL-JOBS-22 - Human Review Selector / Proof Capture / Outcome Ledger Handoff

PJ22 consumes PJ21 application packs and creates a review ledger.

## Input

`data/personal-job-desk/application-packs.local.json`

## Output

`data/personal-job-desk/application-review-ledger.local.json`

## Route

`/personal-job-desk/review-ledger`

## API

`/api/personal-jobs/review-ledger`

## What PJ22 creates

- Review queue
- Candidate approval flag
- Founder/operator review flag
- Manual-submission readiness state
- Proof capture fields
- Outcome tracking fields
- Follow-up date field

## Safety

PJ22 does not submit applications, email employers, send WhatsApp messages, touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.

A record may only move into manual-submission readiness when candidate approval and founder/operator review are both recorded.