# PERSONAL-JOBS-25 - Candidate Follow-Up Inbox / Questions / Operator Response Queue

PJ25 consumes PJ24 application tracker items and creates a follow-up inbox.

## Input

`data/personal-job-desk/application-tracker.local.json`

## Output

`data/personal-job-desk/follow-up-inbox.local.json`

## Route

`/personal-job-desk/follow-up-inbox`

## API

`/api/personal-jobs/follow-up-inbox`

## What PJ25 creates

- Candidate question threads
- Question category classification
- Operator response drafts
- Manual-send approval flags
- Manual-send proof fields
- Response safety rules

## Safety

PJ25 does not submit applications automatically, email employers, send WhatsApp messages, send SMS, touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.