# PERSONAL-JOBS-27 - Application Readiness Governor / Priority Queue for Manual Execution

PJ27 consumes PJ26 response workflows and creates a manual readiness priority queue.

## Input

`data/personal-job-desk/response-library.local.json`

## Output

`data/personal-job-desk/readiness-priority-queue.local.json`

## Route

`/personal-job-desk/readiness-queue`

## API

`/api/personal-jobs/readiness-queue`

## What PJ27 creates

- Readiness queue items
- Priority bands and priority scores
- Manual action packets
- Readiness gates
- Operator assignment and decision fields

## Safety

PJ27 does not submit applications, send email, send WhatsApp, send SMS, contact employers, touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.