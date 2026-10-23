# N14 connector boundary regression suite — evidence record

Date: 2026-10-23

## Scope
Added `scripts/staging/test-n14-connector-boundaries.mjs`, a regression suite that transpiles and exercises the repository's actual N14 connector module. It covers:
- the 19-entry workflow registry and W24 -> W17 contract;
- the eight-node worker contract and exactly-one backend result post;
- Airtable's mirror-only boundary;
- Playwright CAPTCHA/OTP fallback and required probe evidence;
- PayFast's prohibition on deciding refunds;
- urgent-only WhatsApp;
- webhook verification fail-closed behaviour;
- integration dead-letter requirements for cause, reason, fix path and evidence.

## Run
```bash
node scripts/staging/test-n14-connector-boundaries.mjs
```

The test requires the repository's TypeScript dependency to be installed. It does not call external providers or need secrets.

## Evidence boundary
- Test source was committed on `test/n14-connector-boundaries-2026-10-23`.
- The test has **not been executed here**; no pass is claimed.
- This is a local module boundary test, not a staging integration or end-to-end candidate journey test.
- No provider credentials were added, no Airtable target was created, and no deployment was performed.
- Production readiness remains false until runtime, security, and end-to-end gates have real evidence.
