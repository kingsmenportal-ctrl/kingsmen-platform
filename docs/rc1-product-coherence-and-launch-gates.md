# Kingsmen RC1 — product coherence, quality and controlled-launch gates

Status date: 30 October 2026  
Scope: public website, candidate portal, application services, packages/checkout, reviewer experience, founder control plane and Jarvis operations.

## Release rule

RC1 is a **candidate release**, not a marketing label. It is frozen only after the code SHA is reviewed, all blocking checks pass against that same SHA, migration and backup evidence is attached, and a named founder approval is recorded. Do not promote an unreviewed branch or call CI a deployed end-to-end test.

## One coherent product

All surfaces must share the same identity and vocabulary: **Kingsmen One**. The public site explains the service; candidate login leads to one candidate account and one reusable profile; all six opportunity pathways use the same verified source catalogue; a saved opportunity becomes a child/target of the unified Kingsmen application workbench; the tracker distinguishes candidate-reported progress from provider-confirmed outcomes; plans change allowed service volume, not access to opportunity discovery; the reviewer console is role-protected; founder operations use audited founder permissions.

### Required surface map

| Surface | Canonical responsibility | Acceptance |
|---|---|---|
| Public website | Explain Kingsmen, six pathways, privacy/trust, pricing, sign-in entry | Every CTA resolves to a real route; no duplicate product promises |
| Candidate portal | Auth, profile, consent, completeness, documents, preferences | Save/reload/update persists; session re-auth does not erase saved state |
| Opportunity catalogue | Official source evidence, pathway, eligibility, open/closed status, deadline freshness | Only source-supported open opportunities can be shown as open |
| Application workbench | Saved targets and one parent application with pathway-specific child data | Parent/child IDs, status and audit history persist after reload |
| Application tracker | Preparation and submission evidence | Candidate-reported submission never masquerades as provider confirmation |
| Packages and payment | Six approved plans, canonical catalogue, checkout and PayFast sandbox | Price/plan entitlement comes from canonical backend; invalid/duplicate ITNs cannot mark an order paid |
| Reviewer experience | Identity-review queue, evidence access and decision | Least privilege, two-candidate isolation, reviewer action audit |
| Founder experience/Jarvis | Health, incidents, release state, capacity and approvals | Founder-only authorization, persisted evidence and auditable actions |
| Netlify | One deployed product with route/commit parity | Published deploy ID and SHA match reviewed RC1 SHA |

## Mobile, responsive and accessibility quality

The initial automated browser smoke suite covers the public landing page and known candidate/reviewer routes at 360×800, 768×1024 and 1440×1000. It checks HTTP status, blank pages, HTML language, main landmark, horizontal overflow, unnamed visible controls, missing image alt attributes, browser runtime exceptions and captures full-page screenshots.

The suite is an **automated smoke gate**, not a full WCAG certification or visual-diff approval. It does not replace:
- WCAG 2.2 AA manual review and keyboard-only journeys;
- screen-reader checks with at least one desktop and one mobile combination;
- focus visibility/order, zoom to 200/400%, contrast, touch target, error/validation announcement and reduced-motion checks;
- screenshot baselines reviewed by a human and a real pixel-diff threshold;
- real device coverage for a small Android handset, tablet and desktop browser.

Use the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/wcag/) as the conformance target. Automated tools cannot alone establish accessibility conformance.

### Visual regression baseline policy

Do not silently generate/approve baselines in CI. Capture screenshots from the reviewed RC1 build at the named viewport matrix, review them, then commit the approved baseline images. Future builds compare against these references with documented pixel-diff thresholds. Intentional design changes require a reviewed baseline update.

## RC1 freeze checklist — all gates required

1. **Product integration:** shared navigation, typography, spacing, color/contrast, responsive components, consistent names and working links across public, candidate, packages, reviewer and founder surfaces.
2. **Build/test:** clean install; production frontend and API builds; full unit/contract/integration suites; browser smoke; approved visual regression; no untriaged console errors.
3. **Accessibility:** WCAG 2.2 AA audit; keyboard-only; visible focus; screen-reader spot checks; mobile zoom/reflow; labelled controls, error messaging and touch target review.
4. **Security:** current Supabase advisor; Auth password protections; RLS/grant and SECURITY DEFINER positive/negative role tests; Candidate A/B isolation; reviewer least privilege; secrets and bundle scan; POPIA consent/retention/audit/fail-closed checks.
5. **Recovery:** database export/backup, Storage object backup, restore into a separate approved environment, checksum/count parity, private document retrieval and restored auth/config smoke test.
6. **Authenticated journey:** Candidate A/B and reviewer sessions; profile save/reload/update; identity review and evidence; document upload/retrieval/reviewer access/expiry; opportunity save; parent application/CAO choices/tracker; denied cross-candidate access.
7. **Opportunity integrity:** official source ingest, source timestamps and evidence freshness, six pathways, open/closed/deadline/eligibility logic, stale/missing-source fail-closed behaviour.
8. **Payments:** PayFast sandbox checkout, ITN signature/merchant/amount/reference/status verification, idempotency, failure recovery and no false paid state.
9. **Deploy:** approved commit SHA, Netlify deploy ID, production build, public and authenticated route smoke against the exact deployment, environment configuration and rollback procedure.
10. **Founder sign-off:** one immutable RC manifest, named approver, evidence links, known limitations, incident contacts and explicit launch decision.

Any critical security, data-loss, wrong-payment, cross-candidate leakage, false opportunity status, or broken authentication issue blocks launch.

## Capacity and growth plan

Capacity is measured using **active candidates**, not registered accounts. Before a load test, define an active candidate consistently (a unique, non-deleted account that has authenticated or used a candidate service during a stated rolling window; record the chosen window and report it). The product's initial operating limit remains 500 active candidates.

| Stage | Required evidence before proceeding |
|---:|---|
| 500 | Load/soak and burst tests at the launch cap; database pool/CPU/IO, API latency, error rate, queue lag, Storage, Auth, Netlify and provider quotas; backup/restore; graceful cap enforcement |
| 1,000 | Repeat benchmark after bottleneck remediation; prove capacity alarms and queue backpressure |
| 5,000 | Concurrency, hot-tenant and source-ingestion tests; verify isolation and recovery under contention |
| 10,000 | Long-running soak, failure injection, retry/dead-letter recovery, connection-pool and cost envelope |
| 25,000 | Full target benchmark, disaster recovery, provider quota review, observability and scale/cost approval |

Do not test larger stages against live candidate data. Use synthetic load accounts and isolated data with explicit cleanup. A stage advances only after the preceding stage meets pre-agreed SLOs and cost ceilings.

### Proposed initial SLOs (must be approved before testing)

- Candidate-facing API p95 ≤ 500 ms for ordinary reads, excluding external provider calls.
- Application API error rate < 1% during steady-state load.
- No cross-candidate reads/writes or unauthorised reviewer actions.
- No lost acknowledged profile/application updates.
- Queue lag and source freshness remain within documented service-specific budgets.
- Recovery objectives (RPO/RTO), uptime target and per-stage budget are explicitly signed off before launch.

These are proposed acceptance targets, not measured current performance.

## Current blockers inherited into RC1

- PR #209 and #216 remain unmerged and lack independent review; dependency order remains #209 then #216.
- Migration 0096 is not applied; its independent review/change control remains outstanding.
- No evidenced database plus Storage-object backup and isolated restore drill.
- No authorised Candidate A/B/reviewer sessions; the live identity-link table is empty.
- Candidate-facing N15 source/programme/deadline tables are empty.
- PayFast sandbox end-to-end settlement proof is not yet complete.
- Netlify published deploy ID/SHA and exact deployed route parity are not proven.
- No approved screenshot baselines, complete WCAG 2.2 AA assessment or 500-active-candidate load report exists.

## Required evidence record

For each gate, record: exact commit SHA, environment, timestamp, command/test, result, artifact/log link, reviewer/approver, exceptions and retest status. Separate implemented, automated-tested, deployed and authenticated-E2E-verified status. RC1 is not approved while any mandatory gate above remains open.
