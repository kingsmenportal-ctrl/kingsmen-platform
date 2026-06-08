# PERSONAL-JOBS-14 - Personal Job Desk Navigation / Real Use Gate Expansion

## Purpose

PERSONAL-JOBS-14 connects the local personal job system into one realistic, clickable user surface.

It is a navigation repair and real-use gate expansion. It does not add hidden automation, does not send applications, does not contact employers, does not touch payments, does not scrape websites, and does not claim Oracle or production readiness.

## Routes connected

- PJ01: `/personal-job-desk`
- PJ02: `/personal-job-desk/opportunities`
- PJ03: `/personal-job-desk/shortlist`
- PJ04: `/personal-job-desk/apply-pack`
- PJ06: `/personal-job-desk/follow-up`
- PJ07: `/personal-job-desk/outcomes`
- PJ08: `/personal-job-desk/real-use-gate`
- PJ10: `/personal-job-desk/daily-loop`
- PJ11: `/personal-job-desk/import-search`
- PJ12: `/personal-job-desk/source-runner`
- PJ13: `/personal-job-desk/normalizer`
- PJ14: `/personal-job-desk/navigation`

## Real-use daily order

1. Collect real job leads through PJ11 or PJ12.
2. Normalize imported leads through PJ13.
3. Add outside opportunities manually through PJ02.
4. Score and shortlist through PJ03.
5. Build CV and motivation packs through PJ04.
6. Apply manually using official employer or platform instructions.
7. Track follow-ups and interviews through PJ06.
8. Record outcomes through PJ07.
9. Repeat through PJ10 until employment is secured.

## Locked boundary

This module is local UI only. It reads browser localStorage counts and writes a local visit marker for PJ14. It does not perform internet search, website scraping, email sending, WhatsApp sending, employer contact, application submission, payment processing, external calendar writing, Docker startup, Oracle deployment, or production release.
