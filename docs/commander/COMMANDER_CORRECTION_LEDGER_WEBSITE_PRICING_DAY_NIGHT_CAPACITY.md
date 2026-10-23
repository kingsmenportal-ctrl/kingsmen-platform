# Commander Correction Ledger — Missing Kingsmen Doctrine and Website-First Audit

**Status:** Commander correction / required audit work  
**Date:** 2026-10-17  
**Repository:** kingsmenportal-ctrl/kingsmen-platform  
**Priority:** P0 for accurate website/business rules; do not represent this file as proof that runtime implementation is complete.

## Why this record exists

The previous consolidated summary was incomplete and presented three entries from `apps/api/src/finance/pricing-catalog.ts` as though they were the user's full pricing. That was incorrect. Those three code entries are only the prices visible in that file; they are **not confirmed as the complete Kingsmen service/pricing catalogue**. The website, backend, database catalogue, historical Commander-approved decisions, refund rules, and service entitlements must be reconciled before pricing is changed or declared complete.

The Commander has also explicitly corrected the plan for omitting daily/night operations, the staged active-candidate cap/growth plan, and other modified requirements. This ledger makes those omissions visible so they cannot be silently treated as settled.

## Hard rules: never invent or silently replace doctrine

1. Do not label a partial code catalogue as the full pricing.
2. Do not guess package names, prices, quantities, inclusions, exclusions, discounts, subscription rules, payment schedules, refund eligibility, or refund amounts.
3. Do not infer exact operating hours, time-zone cutoffs, overnight batch windows, or response-time promises unless a Commander-approved source specifies them.
4. Do not invent later candidate-cap values or growth-phase thresholds. The locked starting limit is **500 active operational candidates**. Any increase needs a separately documented Commander-approved gate.
5. All national route categories remain in scope from day one. Capacity caps limit volume, not capability or national route coverage.
6. Distinguish doctrine recorded in source, code implemented, database migration applied, staging-tested behaviour, and production evidence. Never call source-only evidence a live test.
7. Do not move on to Control Plane/Jarvis completion work while the Commander-directed website-first audit and completion work remains unfinished.
8. The Commander retains final authority for policy/pricing/cap changes. Do not silently reinterpret or overwrite previous approved details.

## 1. Full pricing and service catalogue — reconciliation required

### Known partial code facts (not the full catalogue)

The currently inspected API file `apps/api/src/finance/pricing-catalog.ts` contains:
- `FREE_DESTINY_MAP_R0`: R0.00 — preview only.
- `CV_REVAMP_R49_99`: R49.99 — 15 personalised truthful CV versions and 15 matching motivation letters.
- `ACCOMMODATION_SUPPORT_R179`: R179.00 — up to 8 accommodation applications/routes.

These entries are recorded only as the contents of that file. **They must not be advertised as the full price list.** Do not treat these prices as confirmation of the user's full current offer, and do not delete or modify them without reconciling all canonical sources.

### Required catalogue audit

Inventory and compare, without prematurely normalising away differences:
- every Commander-approved package, product, service, add-on, bundle, tier, campaign, free route, and manual service;
- every price, currency, billing model, quantity/usage allowance, entitlement, limitation, eligibility rule, renewal/cancellation rule, and refund boundary;
- public website pricing/service pages and checkout labels;
- API price/catalogue definitions and entitlement logic;
- database service-plan rows, seeds, migrations, and currently applied staging catalogue;
- finance/order/invoice/payment/refund code and PayFast amount calculation;
- historical repository documents, incoming batches, issue/PR discussions, and Commander corrections that define the intended catalogue;
- accommodation, transport, funding/bursary, applications, CV/letters, document, support, and any other established service areas, without assuming every area is paid;
- wording that distinguishes free guidance from paid managed services, and service completion from provider decisions.

For each catalogue entry produce a reconciliation row with: canonical name/code, approved price and currency, source citation/path, source date/version, included quantity, exclusions, entitlement behaviour, checkout behaviour, refund/cancellation boundary, website display, API representation, database representation, conflicts, and evidence status.

If two sources conflict or the user's authoritative full pricing cannot be established from repo evidence, mark the entry **CONFLICT / COMMANDER CONFIRMATION REQUIRED**. Do not make up a price to fill the gap. The final website, API, database and checkout must derive from one approved canonical catalogue and fail closed for unknown plan codes.

## 2. Daytime operating model

Kingsmen is a national South African route, opportunity, candidate-support, evidence, communication and operations platform—not merely an admissions form or a CAO-only portal.

The daytime operating model must describe and implement the complete flow across:
- candidate registration, verified email/session, identity review, candidate-to-record linking and account activation;
- profile completion and correction requests;
- route/opportunity discovery, source freshness/confidence, eligibility/readiness, save/follow-up and deadlines;
- all national route categories: direct higher-education institutions and CAO, TVET, NSFAS/funding, SETA/QCTO, bursaries, learnerships, internships, apprenticeships, employers/jobs, accommodation, transport, and required manual alternatives;
- documents, private uploads, review status, missing-document requests and audit history;
- application workbench, official submission boundary, candidate-reported progress, provider-confirmed outcomes and evidence;
- Manual Application Package (MAP) and controlled Phoenix/other manual fallback where specified by doctrine;
- paid/free services, orders, invoices, payment callbacks, entitlement activation, finance exceptions and refund review;
- partner organisation verification, listing/source review, publication and updates;
- email-first communications, urgent-only WhatsApp, backup-only SMS, opt-outs, delivery evidence and support replies;
- founder/operator queues, prioritisation, escalations, incidents, approvals, audit, daily reports and capacity;
- candidate dignity and equal access to the national route universe even when workload priority changes.

Every workflow needs a defined owner, trigger, preconditions, state transitions, truth source, candidate-visible explanation, notification rule, evidence/audit record, retry/recovery path, failure state and acceptance test.

## 3. Night-time / after-hours operating model

Night is a first-class operating period, not a blank gap in the design. Implement and document a safe after-hours mode with explicit local timezone and policy-approved schedule once those exact hours are found in Commander-approved source material.

The overnight plan must inventory and assign safe work such as:
- ingesting and refreshing public opportunity/source information, checking source freshness and marking stale/uncertain data rather than inventing facts;
- queue reconciliation, retry eligibility checks, idempotent retries, dead-letter reporting and notification delivery-state reconciliation;
- scheduled candidate reminders and deadline-sensitive alerts under consent, opt-out, quiet-hour and channel rules;
- document/application preparation tasks that do not cross an unauthorised external submission boundary;
- matching/readiness recalculation and next-day prioritisation;
- payment/ITN reconciliation and exception surfacing (never fabricate success, initiate an unapproved refund, or treat a browser return as proof of payment);
- backup, integrity/restore monitoring, health checks, redacted reports and alert escalation;
- a morning founder brief summarising health, queues, finance, documents, matching, Playwright/MAP, incidents, capacity/cap and urgent candidates.

Safety rules:
- No overnight AI/automation self-approves identity, profile corrections, source-sensitive listings, refunds, provider outcomes, control-plane commands, policy exceptions, or other actions reserved for authorised human review.
- Playwright is a **scout** for portal observation/evidence, not an unrestricted submitter. CAPTCHA/OTP/access barriers trigger approved manual fallback, never bypass.
- n8n/workers remain thin and stateless; PostgreSQL remains the Truth Vault; Airtable is a mirror only.
- Notifications must distinguish queued, attempted, delivered, failed, and dead-lettered. Inserting a message row does not prove external delivery.
- Apply quiet-hour/consent/channel controls. Email remains primary, WhatsApp urgent-only, SMS backup-only.
- A scheduled job must have idempotency, bounded retries, lease/timeout policy, run history, correlation IDs, redaction, alerting and a safe pause/kill mechanism.
- Exact clock times, cutoffs, and service-level promises must be recovered from approved records or explicitly confirmed by the Commander; do not invent them.

## 4. Candidate capacity: starting cap and staged growth

Locked rule: **500 active operational candidates at initial release.** All national route categories are enabled from day one. Caps limit volume, not capability.

The system must enforce the cap in authoritative server/database logic, not merely display it in a UI or rely on an operator remembering it. Define the exact canonical meaning of “active operational candidate” from existing doctrine and use one consistent, concurrency-safe count. Concurrent registrations/activation must not overrun the cap. Keep a visible capacity state, audit all admissions/pauses/reactivations, and test race conditions.

Required capacity behaviour:
- distinguish public discovery/marketing traffic, registered accounts, identity-pending records, waitlisted/deferred records if authorised, and active operational candidates; do not count these categories interchangeably without doctrine;
- at capacity, use the approved waitlist/deferred/controlled-onboarding behaviour rather than silently accepting more active workload;
- explain capacity honestly to candidates without implying that a route or opportunity is unavailable nationally just because operational slots are full;
- preserve candidate data and route access according to approved policy when active service capacity is reached;
- expose current active count, limit, headroom, queue/waiting count where defined, utilisation, workload, urgent cases, and reasons for a capacity hold in founder reporting;
- record the reason, author, evidence, timestamp and before/after values for any cap override or growth transition;
- prohibit silent overrides and AI-only expansion.

### Growth stages

The initial operational cap is 500. Later numerical limits and phase thresholds are **not specified in this ledger** and must be recovered from existing Commander-approved records before implementation; do not invent 1,000/2,500/5,000 or any other value.

Create a source-backed growth-phase table containing:
- phase name and target cap (only if approved);
- entry criteria and evidence required;
- operational staffing/support capacity;
- candidate service quality and backlog/response metrics;
- database/API/storage/notification/payment capacity and load-test results;
- security, privacy, backup/restore, incident and recovery evidence;
- route-source freshness and manual-fallback capacity;
- founder approval, rollback threshold, expansion/hold decision and audit record.

Growth must be gate-based, reversible and evidence-led. A phase expands only after the previous phase's agreed quality, workload, security, support and reliability gates pass. The system must support all national route types from the initial phase; growth changes active volume and operating capacity, not the product's national scope.

## 5. Full candidate journey and route/application completion

For each route type, document the true start-to-end path and differences rather than forcing all routes into one fake universal submission flow:
1. discover route and verify official source, eligibility, deadline, cost and source freshness;
2. candidate registers, verifies email, establishes secure session, and completes separate authorised identity review;
3. build profile and documents; route profile corrections through human review;
4. assess fit/readiness, missing evidence, cost, location, transport/accommodation and funding implications;
5. candidate chooses/authorises the route and sees accurate next steps;
6. prepare, review and submit through the official supported channel, or create controlled MAP/manual fallback when required;
7. record the actual action, timestamp, evidence/reference and actor; distinguish candidate-reported submission from provider receipt/acceptance;
8. track follow-ups, requests for information, interviews/assessments, decisions and appeals only where the source/process supports them;
9. record provider-confirmed outcome with source/evidence; never invent acceptance, funding, placement or employment;
10. close the route with next steps, alternate routes and candidate-visible history.

Required six core pathways remain: higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. Accommodation and transport remain separate but connected service areas. Include bursaries/funding, NSFAS, CAO and direct institutional routes without reducing Kingsmen to any one provider.

MAP lifecycle stays controlled: `DRAFT → READY → DELIVERED → IN_PROGRESS → COMPLETED`, with `REJECTED`/`CANCELLED` where valid. Completion requires evidence reference, verifier and timestamp. Package completion is not provider acceptance. OTP/CAPTCHA/portal-down/manual-only/source-review barriers are recorded; do not bypass access controls.

## 6. N-series architecture and non-negotiable boundaries

Preserve the established N00–N20 module architecture and place work in its proper module instead of creating unnecessary layers:
- N00 doctrine/constitution;
- N01 monorepo/Oracle Lite runtime;
- N02 backend API/state machine;
- N03 PostgreSQL Truth Vault;
- N04 candidate core/portal;
- N05 document vault;
- N06 route universe/application workbench;
- N07 Airtable sync/mirror;
- N08 control plane;
- N09 communications;
- N10 finance/PayFast;
- N11 AI decision;
- N12 governance;
- N13 observability/reports/incidents;
- N14 integrations/workflow connectors;
- N15 opportunity engine/source intelligence;
- N16 orchestrator/execution runtime;
- N17 founder control plane/command ops;
- N18 public website/front door;
- N19 candidate mobile/PWA/public-to-portal experience;
- N20 final integration/system lock/production readiness.

Locked boundaries: PostgreSQL is truth; Airtable is mirror only; backend controls state; n8n is a thin worker; email primary; WhatsApp urgent-only; SMS backup-only; PayFast provider boundary; no fake statuses/deadlines/acceptance/payment/refund/AI governance; controlled MAP and Phoenix fallback; POPIA minimisation; founder final authority; no unnecessary layers.

## 7. Website-first completion audit and test requirements

Audit every public page, candidate page, partner path, finance page, document/application route, responsive/mobile state, navigation, empty/loading/error/permission state, accessibility, copy, pricing display, and all backend calls. Verify that the public website explains the full Kingsmen offer accurately and that each CTA leads to a real, safe workflow—not a placeholder or dead end.

Use Playwright for repeatable UI/E2E verification, not as a replacement for API/database/provider evidence. Include:
- registration, email verification/session refresh/expiry/recovery/sign-out;
- identity review/link and unauthorised access rejection;
- profile/correction review and persistence;
- all six core pathways plus funding, accommodation, transport and manual fallback;
- opportunity source verification, stale-source handling, saving and follow-up;
- document private storage and review;
- application state/evidence/provider-truth boundaries;
- every approved catalogue item, price/entitlement/checkout/refund case;
- partner verification/listing publication;
- founder queues and audited decisions;
- day/night scheduled work, quiet hours, retries, duplicate delivery and dead letters;
- 500-cap concurrency, full-cap behaviour, phase gate/rollback and audit;
- mobile viewport, keyboard/accessibility, console/network errors and degraded services.

A passing source validator is not a passing browser test. A passing browser test is not proof that staging database migrations, PayFast sandbox, external communications, backup/restore, or production deployment works. Report exact environment, commit, test names, pass/fail/skipped, artifacts, data state and blockers.

## 8. Current release truth and required order

The previously inspected PR #94 was open/unmerged and explicitly said it had not been proven by a green build, applied migrations, live Netlify deployment, or successful staging E2E run. Recheck current state before relying on that snapshot.

Website-first order:
1. recover all Commander-approved doctrine/pricing/phase/day-night decisions from repository history, issue/PR conversations, incoming batches and relevant project files;
2. publish a source-indexed requirements inventory and a conflict/unknown register;
3. reconcile the full pricing catalogue and service entitlements;
4. finish the public website and candidate journey against that inventory;
5. connect every workflow to persisted backend/database truth;
6. verify RLS/permissions, state transitions, audit/evidence and server-side capacity enforcement;
7. run Playwright E2E and separate API/database/provider staging checks;
8. complete launch-gate reports and founder review;
9. only then resume the next control-plane/Jarvis workstream as directed.

## 9. Acceptance criteria for closing this correction

Do not close this work until:
- the full price list has source-backed entries and conflicts are resolved without invented prices;
- day and night operating responsibilities, scheduled work, safety rules and approved times are documented and tested;
- the 500 active operational candidate cap is enforced under concurrency;
- all subsequent growth thresholds are source-backed and have explicit founder-approved gates;
- every national route category remains available in the product scope;
- the full candidate start-to-outcome journey has evidence-backed acceptance tests;
- website, API, database and finance catalogue agree;
- Playwright and staging reports are attached/referenced;
- the founder-facing report clearly separates built, tested, staging-proven and production-proven states.

## 10. Commander correction history

- 2026-10-17: Commander stated that the previous summary omitted substantial modified details, incorrectly presented an incomplete pricing list as full pricing, and missed daytime/night-time operations and the staged 500-candidate cap/growth plan. This correction must remain visible in future planning and must not be silently replaced by a shorter, incomplete summary.
