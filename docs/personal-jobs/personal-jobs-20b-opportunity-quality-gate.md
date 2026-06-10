# PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion

PJ20B fixes PJ20 readiness by preventing search pages, DPSA documents, circulars, login/register pages, blocked sources, and low-fit international jobs from becoming apply-pack jobs.

## Input

`data/personal-job-desk/opportunity-command-queue.local.json`

## Output

`data/personal-job-desk/opportunity-quality-gate.local.json`

## Route

`/personal-job-desk/opportunity-quality-gate`

## API

`/api/personal-jobs/opportunity-quality-gate/build`

## Handoff rule

Apply-pack generation may only consume:

`lead.state === "READY_FOR_APPLY_PACK"`

## Safety

No auto-apply, no email, no WhatsApp, no employer contact, no payment touching, no login/CAPTCHA bypass.