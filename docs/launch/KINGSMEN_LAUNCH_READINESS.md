# Kingsmen Launch Readiness

## Live staging evidence snapshot — 2026-10-23

This snapshot records directly queried staging facts, not a claim of production readiness.

| Gate | Live observation | Disposition |
|---|---|---|
| Official source catalog | 14 new official South African source-authority anchors are present in staging. Each requires separate programme-level verification. | Source discovery expanded; not proof of open opportunities. |
| Verified opportunity availability | 0 route-programme rows currently satisfy the query for VERIFIED + OPEN/FUTURE + A/B confidence + updated in the last 90 days. | Do not display any as currently open from this result. |
| Private document bucket | `kingsmen-candidate-documents` exists, is private, has a 10 MiB limit and allows PDF/JPEG/PNG. | Configuration verified; real upload/signature/expiry/cross-candidate HTTP journey still pending. |
| Candidate identity workflow | Staging counts returned 0 identity-review requests and 0 active reviewers. | Authenticated two-account lifecycle and approval/rejection/correction cannot be claimed verified. |
| Private document lifecycle | Staging count returned 0 private document records. | Real signed access, expiry, audit-on-read and cross-candidate denial remain unproven by live candidate data. |
| Communications | N09 backend-only migration `20261022202953` is applied; outbox and consent ledgers are service-role-only. | Client access is constrained; provider delivery, consent capture, retries and dead-letter recovery still require runtime evidence. |
| Security advisor | 3 INFO findings report RLS enabled with no policies on backend-only identity/document-review tables; 1 WARN reports leaked-password protection disabled. | No-policy INFOs deny client access by default; the password-protection warning remains open for Auth configuration. |
| CI at branch head `fdaa02abfc067d0c29c665bff76eeed0ba26778e` | Kingsmen Source Guard, Kingsmen One smoke tests and Kingsmen Release Evidence all completed successfully. | Repository-level gates pass; these checks do not replace authenticated E2E or provider tests. |
| Published frontend | Netlify project metadata returned an empty `currentDeploy` object with no verifiable published deploy ID/commit. | Deployment verification remains blocked; do not infer that the branch head is published. |
| Release governance | PR #134 remains open and the working branch is not the protected main release. | Keep the release gate closed; do not bypass required reviews or branch controls. |

### Minimum remaining live proofs

1. Run the authenticated staging E2E runner using two explicitly authorised candidate sessions and an authorised reviewer; capture only redacted reports.
2. Execute a real private document upload with valid and invalid MIME/signature/size cases; verify signed URL expiry, audit persistence, and candidate A/B denial.
3. Run transaction/idempotency/restart-recovery tests against PostgreSQL using isolated synthetic fixtures and verify durable audit rows.
4. Execute consent-gated provider staging delivery with bounce/opt-out, retry and dead-letter evidence; no live bulk sends.
5. Exercise health alerts, worker lease/recovery, incident severity and founder escalation against staging.
6. Identify the actual published Netlify deploy and match its commit SHA to the reviewed release commit.
7. Clear the Auth leaked-password-protection warning through supported project configuration, then rerun security advisors.


This document is the real finish-line map for launching Kingsmen. A module can be present in the repo and still be blocked from public launch until runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has source-level proof for backend API, PostgreSQL/Supabase Truth Vault persistence, safe web-to-backend boundary, PayFast sandbox boundary, RLS/security, backup/restore, branch protection, secrets wiring, communications, observability + incident handling, legal + privacy + consent + refund policy, the staging runtime proof pack, and final assembly evidence capture. The RLS/security source-level boundary is built, but staging role-isolation proof remains a separate required gate. It is still not safe to open to public candidates or take money because real staging evidence and final founder review are still pending.

## Verified staging evidence snapshot (2026-10-22)

- A live read-only catalog query inspected 225 public base tables: RLS is enabled on all 225 and disabled on none.
- Exactly three RLS-enabled backend-only review/audit tables have no client policies; live grant checks confirm `anon` and `authenticated` cannot SELECT them while `service_role` can. Do not add client policies just to silence the informational advisor notices.
- The identity helper is in the non-exposed `private` schema; the public-schema helper is absent. The identity-review submission Edge Function is ACTIVE v3 with JWT verification enabled.
- These checks do **not** prove policy correctness for all tables, authenticated candidate A/B isolation, private object isolation, reviewer decisions, or a published frontend commit. There are zero active platform reviewers, identity-review requests, verified identity links, and private documents in staging.
- Machine-readable evidence: `reports/security/rls-security-staging-snapshot-2026-10-22.json`. This is explicitly a partial catalog/privilege snapshot, not the full release proof.

## Cross-module staging evidence — 2026-10-22

The current machine-readable review is `reports/validation/cross-module-staging-audit-2026-10-22.json`. It is a partial staging audit, not a production approval.

- **N03 Truth Vault:** a staging-only PostgreSQL probe inserted an expiring idempotency row; a duplicate insert returned no row and did not overwrite the original response; an independent subsequent read confirmed the original record; a redacted `STAGING_PERSISTENCE_PROBE` audit event was persisted and re-read. This proves the database-level unique-key/read/write path only—not the application command path, process restart recovery, or backup/restore.
- **Candidate workflow deployment correction:** `candidate-application-preparation` is ACTIVE v9 and `candidate-workspace-readiness` ACTIVE v4, both with JWT verification. The server tracker pathway map and readiness validator now support higher education, TVET, SETA, internships, apprenticeships and employment without mapping entrepreneurship to employment. Both endpoints use a strict HTTPS allowlist for Kingsmen Netlify deploy previews; the prior stale hard-coded preview hostname was removed. This is a staging function deployment, not proof of authenticated journey completion.
- **N04/N05:** identity review is ACTIVE v3 and private documents ACTIVE v7 with JWT verification. There are no verified identity links, active reviewers, review requests, or private documents, so authenticated candidate/reviewer and real binary storage journeys remain untested.
- **N06/N15:** 14 official South African source authority anchors were added to the idempotent seed and staging catalog. Staging now has 21 authorities, all requiring programme-level verification. There are still only 2 route-programme anchors and 0 eligible recent OPEN/FUTURE listings; the source anchors do not assert current programme availability.
- **Applications/outcomes:** staging has zero candidate application trackers, preparation items, submission jobs, or outcomes; provider acknowledgement and independently confirmed outcomes remain unproven.
- **N09/N14:** notification outbox, delivery attempts, consent records, integration outbox and dead-letter queues have zero rows. Real provider delivery, consent enforcement, retries and replay are not verified.
- **N12/N13/N16:** RLS is enabled on all 225 inspected public tables. Three intentionally backend-only tables have no client policies and no client SELECT grant. Health snapshots, service checks, incidents and worker heartbeats are currently zero; operational recovery has not been exercised.
- **N17/N18/N19 and release:** Netlify metadata still provides no current deploy ID or published commit. PR #134 remains open/draft. Public release stays blocked.

For the current code commit `2aab5ed76e31a57cf67db53592fbca67b44293ae`, Kingsmen One smoke tests, Source Guard and Release Evidence all passed (runs `39842755887`, `39842755908`, `39842755925`). Those checks are repository/build/health evidence, not authenticated user-flow evidence.

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** Source guard and apply script exist, but GitHub protection must still be applied and verified.
2. **Prove Truth Vault persistence on staging.** A live staging run must prove command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ paths.
3. **Prove RLS/security in staging.** Apply the hardening migration to staging and test candidate, operator, founder, anonymous, and backend service isolation.
4. **Prove safe web-to-backend boundary in staging.** The deployed web app must prove `KINGSMEN_BACKEND_BASE_URL` calls API health and command intake without local shell, local file writes, or direct database access.
5. **Payment collection gate (PayFast deferred).** PayFast account setup is deferred and must not block building or testing unpaid candidate journeys. Until an account exists and sandbox success/cancel/return/failure/duplicate/invalid-signature/replay/amount-mismatch/refund-review evidence passes in staging, keep checkout/payment collection and payment-dependent entitlements disabled. Never simulate a successful payment or mark an order paid without a verified provider event.
6. **Prove backup and restore.** No production personal data until a real staging restore drill proves backup archive checksum, target/source separation, counts-only verification, RPO/RTO, and redaction.
7. **Wire secrets outside git.** Launch requires masked runtime health evidence proving required environment variables are configured outside Git without printing values.
8. **Prove communications provider boundary.** Candidate notifications require provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, and redacted evidence proof.
9. **Prove observability and incident handling.** Public users require staging health, logs, queue/DLQ, alerts, redaction, and SEV runbook evidence.
10. **Publish privacy, consent, terms, and refund policy.** Launch requires published/versioned surfaces, founder/legal review, consent capture proof, refund/payment display proof, and data-subject request proof.
11. **Capture the staging runtime proof pack.** Final assembly must not open until the staging runtime proof pack contains reviewed redacted runtime evidence for all P0 gates.
12. **Capture final assembly evidence bundle.** The final assembly collector must summarize every required staging report with SHA-256/status/review/redaction fields and founder review must remain required.

## Source proof command stack

Run these commands for source-level proof only:

```bash
npm run api:validate:truth-vault
npm run web:validate:backend-boundary
npm run payments:prove:sandbox
npm run payments:validate:sandbox
npm run security:prove:rls
npm run security:validate:rls
npm run backup:prove:restore
npm run backup:validate:restore
npm run secrets:prove:wiring
npm run secrets:validate:wiring
npm run communications:prove
npm run communications:validate
npm run observability:prove
npm run observability:validate
npm run legal:prove
npm run legal:validate
npm run staging:prove:pack
npm run staging:validate:pack
npm run final:prove:evidence
npm run final:validate:evidence
npm run repo:prove:branch-protection
npm run repo:validate:branch-protection
npm run kingsmen:launch:audit
```

## API runtime command

```bash
cd apps/api
npm install
npm run build
npm start
```

Root helpers:

```bash
npm run api:build
npm run api:start
npm run api:validate:truth-vault
```

PostgreSQL Truth Vault mode:

```bash
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=[set-outside-git]
KINGSMEN_DATABASE_SSL=true
npm run api:start
```

## Web backend boundary command

Required web env:

```bash
KINGSMEN_BACKEND_BASE_URL=http://127.0.0.1:8080
KINGSMEN_BACKEND_TIMEOUT_MS=15000
```

Validation:

```bash
npm run web:validate:backend-boundary
```

## Payment proof command

```bash
npm run payments:prove:sandbox
npm run payments:validate:sandbox
```

This does not authorize live payments. Run real PayFast sandbox checkout against a staging notify URL before paid pilot.

## RLS/security proof command

```bash
npm run security:prove:rls
npm run security:validate:rls
```

This does not authorize public candidate traffic. Apply the RLS hardening migration to staging and capture live SQL role-isolation proof.

## Backup/restore proof command

```bash
npm run backup:prove:restore
npm run backup:validate:restore
```

Real staging drill:

```powershell
$env:KINGSMEN_DATABASE_URL = "[source-database-url-set-outside-git]"
$env:KINGSMEN_BACKUP_ROOT = "D:\KingsmenBackups"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1

$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "[restore-drill-database-url-set-outside-git]"
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\KingsmenBackups\...\kingsmen-truth-vault-....dump"
```

## Branch protection command

```bash
npm run repo:prove:branch-protection
npm run repo:validate:branch-protection
```

Apply GitHub branch protection with admin permissions:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1
```

## Secrets wiring proof command

```bash
npm run secrets:prove:wiring
npm run secrets:validate:wiring
```

Masked runtime health check:

```powershell
.\scripts\security\Test-KingsmenSecretWiring.ps1
```

Reports may show only configured/not-configured/masked status and must never print values, URLs, token prefixes, private keys, service-role keys, or provider secrets.

## Communications proof command

```bash
npm run communications:prove
npm run communications:validate
```

Provider staging proof still required: email send/receive, bounce handling, opt-out path, WhatsApp urgent-only approval evidence, SMS fallback-only evidence, and redacted evidence report.

## observability + incident proof command

```bash
npm run observability:prove
npm run observability:validate
npm run observability:staging
```

Staging observability proof still required: API health proof, database health proof, queue/DLQ proof, structured log sample with correlationId, alert proof, SEV1/SEV2/SEV3 incident drill, founder escalation, and no PII or secrets in logs proof.

## legal + privacy + consent + refund proof command

```bash
npm run legal:prove
npm run legal:validate
```

Publication and review proof still required: published Terms of Service, Privacy Notice, Consent Notice, Refund and Payment Policy, Data Subject Request Path, founder/legal review record with policy versions, consent capture smoke proof, refund/payment display proof, and no personal data collection before privacy notice proof.

## Staging runtime proof pack command

```bash
npm run staging:prove:pack
npm run staging:validate:pack
```

See `docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md`.

The staging runtime proof pack requires these redacted runtime reports:

```txt
reports/staging/truth-vault-persistence-staging-latest.json
reports/staging/web-backend-boundary-staging-latest.json
reports/staging/rls-sql-isolation-staging-latest.json
reports/staging/payfast-provider-sandbox-staging-latest.json
reports/staging/backup-restore-drill-staging-latest.json
reports/security/secrets-wiring-runtime-health-latest.json
reports/staging/communications-provider-staging-latest.json
reports/staging/observability-incident-staging-latest.json
reports/staging/legal-privacy-publication-staging-latest.json
reports/repo/main-branch-protection-apply-latest.json
```

The staging pack is source-built, but runtime evidence remains pending until those files exist and are reviewed.

## Final assembly evidence capture command

```bash
npm run final:prove:evidence
npm run final:validate:evidence
```

Collector for Windows/Oracle staging:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1
```

Strict collector that exits non-zero if any required staging report is missing, failed, unreviewed, or unredacted:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1 -RequireAll
```

See `docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md`.

The output is:

```txt
reports/final-assembly/final-assembly-evidence-bundle-latest.json
```

The bundle must contain only report paths, status flags, review flags, redaction flags, timestamps, counts, and SHA-256 hashes. It must not copy raw staging report bodies.

## Launch command

Run this for a report without failing the shell:

```bash
npm run kingsmen:launch:audit
```

Run this as a boot-blocker before release:

```bash
npm run kingsmen:launch:gate
```

The gate must remain blocked until the P0 launch blockers are fixed and evidenced.

## Launch phases

1. **Repo lock:** protect main, require validators, stop accidental package/release mistakes.
2. **Staging runtime:** run API + web + PostgreSQL/Supabase + internal command flow + staging runtime proof pack.
3. **Final assembly:** collect final assembly evidence bundle, founder-review every report, and keep public launch blocked until all P0 evidence passes.
4. **Founder private beta:** process a small number of real test candidates manually with evidence.
5. **Paid pilot:** only after PayFast, refunds, support, backup/restore, communications proof, legal/privacy proof, incident response, observability proof, staging pack, and final assembly evidence bundle pass.
6. **Public launch:** only after every required launch gate opens.


## Cross-module truth guard added — 2026-10-23

Migration `20261023220000_cross_module_application_outcome_truth_guards.sql` is committed and applied to staging. The matching database migration mirror is `db/migrations/0086_cross_module_application_outcome_truth_guards.sql`.

- `candidate_applications` cannot enter `SUBMITTED_CONFIRMED` or later provider-progress states unless a verified provider submission receipt/reference exists for the same candidate and application, with reviewer identity and verification timestamp.
- `candidate_outcomes` inserts must match the application’s candidate and opportunity and point to a verified `PROVIDER_OUTCOME_NOTICE` for that same candidate/application. Candidate reports, predictions and submission receipts cannot be used as confirmed outcome evidence.
- Trigger installation was queried directly in staging and both guards are present.
- Kingsmen One smoke tests and Source Guard passed on the migration/test commit sequence. Release Evidence workflow completed its build/validation/smoke job successfully; this is still not authenticated candidate E2E.
- This guard is intentionally fail-closed. If any existing application/outcome writer does not persist the required verified evidence before updating status, that writer must be integrated with the evidence workflow before it can advance state. Do not weaken the guard to make a test pass.

This reduces false-confirmation risk but does not replace the two-candidate isolation tests, reviewer-authorised evidence verification, provider staging delivery, document binary E2E, full PostgreSQL restart/recovery proof, or published Netlify commit verification.

- **Database negative-path proof (2026-10-23):** staging exercised the new guards with isolated synthetic candidate/opportunity/application fixtures. Attempting to advance an application to `SUBMITTED_CONFIRMED` without verified submission evidence was rejected by the database guard; attempting to insert an outcome without linked evidence was rejected. All synthetic fixtures were removed; a follow-up query confirmed zero test fixtures remained. This is a negative-path database proof, not a complete authenticated candidate journey.


## Follow-up security correction — 2026-10-23

The first application/outcome truth-guard migration exposed its SECURITY DEFINER trigger functions to direct client RPC by default. A follow-up migration, `20261023153000_revoke_client_execute_application_outcome_guard_functions.sql`, has now been applied to staging and committed alongside database mirror `db/migrations/0087_revoke_client_execute_application_outcome_guard_functions.sql`.

Live privilege query confirms both trigger functions are no longer executable by `anon` or `authenticated`; `service_role` retains execute permission. PostgreSQL triggers still invoke the functions as required. Supabase security advisor no longer reports the two new SECURITY DEFINER function warnings. The remaining findings are three INFO notices for intentionally backend-only RLS tables with no client policies and the pre-existing leaked-password-protection WARN.

A regression smoke test asserts that each function has explicit revocations for PUBLIC, anon and authenticated. This latest test change still needs its exact-head GitHub Actions run to complete before it can be called CI-verified.


## Database guard behavior probe — 2026-10-23

A staging-only synthetic fixture probe ran inside a PostgreSQL subtransaction and deliberately rolled back every write. It exercised these assertions against the live triggers:

- Attempting to advance an application to `SUBMITTED_CONFIRMED` without verified provider-submission evidence was rejected.
- Adding synthetic verified submission-receipt evidence allowed the application state transition.
- Attempting to create a confirmed outcome using a submission receipt instead of a provider-outcome notice was rejected.
- A confirmed outcome referencing synthetic verified `PROVIDER_OUTCOME_NOTICE` evidence for the same candidate/application/opportunity was accepted within the test transaction.
- The fixture transaction was intentionally rolled back because the outcome ledger is append-only; no test outcome was retained.

This validates the database trigger behavior in staging only. It does not prove a real provider supplied the evidence, a real reviewer is authorized, or a candidate browser journey works. On commit `06c2f866918c07529c965d466d9235936f8d4f82`, Kingsmen One smoke tests, Source Guard and Release Evidence all passed; the branch-protection evidence workflow still fails because repository protection could not be verified. PR #134 remains open/draft.


## Application-linked private-document evidence — 2026-10-23

- Added nullable `candidate_private_documents.application_id` with a composite foreign key to `candidate_applications(id, candidate_id)`; a document cannot be attached to another candidate's application.
- The authenticated `candidate-private-documents` upload action accepts an optional application ID only after resolving the signed-in user's verified candidate identity and checking application ownership. Existing profile-only documents remain valid and unlinked.
- Staging migration applied: verified document reviews now atomically create a `CANDIDATE_DOCUMENT` row in `candidate_application_evidence` for the exact linked application, using the server-computed SHA-256, reviewer identity, review note and timestamps. The transaction fails closed if the finalized hash or owner/application linkage is missing or conflicts.
- Candidate-document evidence is intentionally **not** accepted as a provider submission receipt or provider outcome. The existing submission/outcome truth guards remain in force.
- Deployed `candidate-private-documents` ACTIVE v8 with JWT verification enabled. Live catalog checks confirm the application ID column, composite owner foreign key, evidence-link trigger/function, and existing submission truth guard are present.
- Repository smoke test, Source Guard and Release Evidence workflows are running against the code batch; their completion must be checked at exact head. The smoke workflow has already passed for the preceding test commit.
- Still unproven: a real authenticated candidate upload, actual reviewer decision with a registered active reviewer, candidate A/B denial, and resulting application evidence row. Staging currently has no active reviewer and no private document records, so no synthetic identity or reviewer was fabricated.


## Document-to-application integration — staging verification update (2026-10-23)

- Applied migration `20261023170000_application_linked_private_document_evidence` to staging. The private-document row now supports an explicit `application_id`, with a composite foreign key enforcing that the application belongs to the same candidate.
- A final `VERIFIED` document-review record creates `CANDIDATE_DOCUMENT` application evidence transactionally only when the document is finalized, has a SHA-256 hash, and is uploaded. Evidence includes the reviewer's authenticated-user identifier, review timestamp, note, hash, and private-document reference. This evidence is explicitly not accepted as provider submission or provider outcome proof.
- Updated `candidate-private-documents` Edge Function deployed to staging as ACTIVE version 11, with `verify_jwt=true`. Deployed source hash: `ca8177177adad0a497a0167bd62c32e289b2cbef0a50776e4c53153ec155f356`. The deployed version was retrieved after deployment and confirmed active.
- Current live staging counts: 0 candidate applications, 0 private document records, 0 verified application-evidence rows, and 0 active evidence reviewers. Consequently, the real two-candidate authenticated journey, actual reviewer decision, and candidate-visible post-review state have NOT been executed. Do not mark these end-to-end gates passed.
- Current strict route eligibility query returned 0 eligible routes. No fake opening or deadline was seeded.
- Communications staging currently has 0 communication records and 0 sent/delivered/failed attempts. Provider delivery, webhook reconciliation, retries and dead-letter recovery remain unverified.
- GitHub branch-protection endpoint still returns HTTP 403 `Resource not accessible by integration`; this is lack of independent evidence, not proof protection is disabled. Do not bypass protection.
- Netlify project metadata does not expose a concrete current published deploy/commit (empty `currentDeploy` object), so publication matching the reviewed commit remains unverified.
- Supabase security advisor still reports leaked-password protection disabled. No supported Auth configuration mutation is available through the connected staging toolset; enable it in Supabase Auth settings and re-query the advisor.
- PayFast remains deferred pending account availability.

### What was actually tested

- GitHub smoke tests, Source Guard and Release Evidence reported success on the most recent observed workflow set (runs 39963154529, 39963154615, 39963154396). Treat this as repository CI evidence; it does not substitute for authenticated browser/API E2E.
- Database migration is present in staging migration history.
- Edge Function version 11 is active with JWT verification enabled and the deployed source was re-read to confirm candidate-owned application validation is present.
- A negative authorization probe invoked the reviewer RPC with a synthetic, non-existent reviewer identity and was rejected with `insufficient_privilege`; no reviewer or candidate fixture was created.
- Database observations above are live staging queries.


## Verified live employment routes — 2026-10-23

The official Department of Employment and Labour vacancy listing was checked on 2026-10-23. Six individual vacancy references listed as Open with a 30 October 2026 closing date were added idempotently to staging under a verified, public-safe government provider:
- HR4/4/8/194 — Client Service Officer: Public Employment Services
- HR 4/4/8/190 — BCEA Inspector (X4 Posts)
- HR4/4/9/29 — Administration Officer: Employer Service
- HR4/26/10/02HO — Senior State Accountant: Financial Reporting
- HR4/4/8/192 — BCEA Inspector
- HR4/4/8/193 — Assistant Director: Labour Activation Programme

Official source: https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx?PageFirstRow=31&Paged=TRUE&PagedPrev=TRUE&View=%7BF01EEABA-46DC-4830-90E3-2E7A96B86015%7D&p_Created=20250711+15%3A39%3A14&p_ID=2370

The staging query now returns 6 eligible routes using VERIFIED route status, OPEN/FUTURE availability, A/B confidence, official source URL, freshness under 90 days, and a verified/public-safe A/B provider. The seed deliberately excludes the Personnel Officer listing because the official vacancy results also showed a withdrawal erratum for that reference. The six rows preserve reference number and closing date in metadata and explicitly require candidates to inspect each official advert for qualifications and submission instructions. This is a verified availability snapshot, not a guarantee that any candidate is eligible or will receive an outcome. Recheck freshness and closing dates before use after 30 October 2026.


## Staging verification refresh — 2026-10-23 (latest)

- Re-deployed `candidate-private-documents` from the branch source as **Edge Function version 12**, `ACTIVE`, with `verify_jwt=true`. Re-read the deployed source after deployment: candidate-owned application validation, the `application_id` persistence, binary signature checks, and candidate-scoped document lookup are present.
- Confirmed the application-evidence trigger is installed on `candidate_private_document_reviews`; the trigger runs only for `VERIFIED` decisions. Its migration is present in staging history. The database trigger links a finalized/hash-verified document to `CANDIDATE_DOCUMENT` evidence on the same candidate-owned application, and this evidence is not treated as a provider submission receipt or outcome notice.
- Re-ran the reviewer authorization negative probe against the staging RPC with a random, unregistered reviewer UUID. The call was denied with the expected insufficient-privilege path; no reviewer, document, or candidate fixture was created.
- Current staging counts: **0 private document records, 0 application-linked private documents, 0 application-evidence rows, and 0 active evidence reviewers**. Therefore no real candidate upload, authorized reviewer decision, signed-link expiry, candidate-visible evidence/status, or two-candidate isolation journey can honestly be marked passed.
- Re-checked live-route eligibility using the actual schema fields (`route_status='VERIFIED'`, `availability_status='OPEN'`, A/B route confidence, official URL, freshness under 90 days, and a verified/public-safe A/B provider). Result: **6 eligible live employment routes**, the six Department of Employment and Labour references listed above. An earlier query using non-schema values `route_status='OPEN'` and `availability_status='FUTURE'` returned zero; that was a query mismatch, not evidence that the six records disappeared.
- GitHub CI for PR-head commit `a3305048ad18ca3d1ae9626305928a24289bbecb`: Kingsmen Release Evidence, Kingsmen One smoke tests, and Kingsmen Source Guard all completed successfully (runs 39965467132, 39965467274, 39965467336). These are repository checks, not authenticated runtime E2E.
- Release blockers unchanged: leaked-password protection is still disabled; no communications provider delivery/retry/bounce/opt-out/dead-letter run has been evidenced; Netlify's project metadata still returns an empty published-deploy object; and GitHub's branch-protection endpoint still returns HTTP 403 to the connected integration. Do not infer the protection state from that 403 and do not bypass it. PayFast remains deferred.
- The connected tools do not provide a supported Auth configuration mutation, Netlify publish action, or real authenticated session minting/interactive login flow for two candidates plus an already-authorized reviewer. Those gates require the real staging accounts/reviewer and the relevant project settings/permissions; they have not been simulated or marked complete.

## Follow-up staging evidence — 2026-10-23 (latest observation)

- Re-ran the strict route eligibility predicate against the live staging schema using its actual columns (route_status, availability_status, source_confidence_band, source_url, provider verification/public-safe flags, and 90-day freshness). Result: **6 eligible route records**, not zero.
- All six records are Department of Employment and Labour vacancy-list entries; official list evidence observed on 2026-10-23 reports status Open and closing date 2026-10-30. References: HR4/4/9/29, HR4/4/8/193, HR4/4/8/192, HR 4/4/8/190, HR4/4/8/194, HR4/26/10/02HO. Candidate-facing content must still direct candidates to the individual advert to verify role-specific eligibility and submission instructions. This is listing-level source verification, not a promise of eligibility or application success.
- The separate legacy candidate_opportunities table still has **0** records satisfying its own published + VERIFIED + unexpired + recently checked + source/application URL predicate. Do not conflate this with the six eligible Route Universe records; opportunity-engine ingestion remains an integration gap.
- candidate-private-documents remains ACTIVE v11, verify_jwt=true, and includes the candidate-owned application_id check in its deployed source. Exact-head GitHub CI on branch commit 16c02af781ad38093528400d8869aaf643a474ce: smoke tests, Source Guard, and Release Evidence all succeeded (runs 39965118392, 39965118385, 39965118332).
- Real candidate A/B authenticated journey remains blocked by **0 candidate applications, 0 private documents, and 0 active evidence reviewers**. No fake accounts, reviewer grants, or user documents were created. Database linkage logic is staged, but reviewer-decision and cross-candidate HTTP/browser proof are still NOT passed.
- Other open gates remain: communications-provider send/webhook/retry/dead-letter runtime verification; leaked-password protection (Supabase Auth setting); Netlify publication tied to this branch commit; branch-protection evidence (GitHub API returns 403 to the connected integration); and PayFast (deferred until account access exists).


## Document-to-application integration deployment — 2026-10-23

- Deployed `candidate-private-documents` to Supabase staging as **ACTIVE v13**, with `verify_jwt=true`.
- Retrieved the deployed function source after deployment and confirmed it contains the candidate-owned `application_id` lookup and persists that application ID with the private document record. The source matches the reviewed branch function file; deployment is verified at the Edge Function level.
- The already-applied migration `20261023170000_application_linked_private_document_evidence` adds a composite foreign key tying a document's application to the same candidate, and an after-review trigger that creates `CANDIDATE_DOCUMENT` evidence only after an authorized reviewer records `VERIFIED` for a finalized, hash-verified document.
- The evidence trigger does not treat a candidate document as a provider submission receipt or provider outcome notice. Existing application status truth guards continue to require provider-grade evidence for provider-confirmed progression.
- Exact PR-head commit `8f65ff60ab0287a085e1cebc276a0a4122cf31ce` has successful Kingsmen One smoke tests (run 39967618911), Release Evidence (39967618890), and Source Guard (39967619079).
- Live staging still reports **0 private documents** and **0 active evidence reviewers**. Therefore this proves deployed function code and schema wiring, not the authenticated two-candidate upload/review/download journey.
- Release gates still open: real two-candidate authenticated HTTP E2E; reviewer decision with actual authorized identity; signed URL expiry; provider delivery/retry/bounce/opt-out/dead-letter runtime; Auth leaked-password protection; eligible live opportunity validation; published Netlify commit; and independently readable branch protection.
- GitHub branch-protection API continues to return HTTP 403 to the connected read-only integration. This is an access limitation, not proof that branch protection is absent. Netlify project metadata still has no published deploy ID/SHA, so no deployment of the reviewed PR head is claimed.


## Opportunity-query correction — 2026-10-23

A follow-up schema-aware query corrected the earlier “zero eligible routes” report. The previous check used `route_status='OPEN'` and `availability_status='FUTURE'`, but this staging schema represents a verified route as `route_status='VERIFIED'` and a currently accepting listing as `availability_status='OPEN'`. That earlier zero was a query-contract error, not a valid count of eligible listings.

The corrected staging query returned **6** route rows meeting: route VERIFIED, availability OPEN, confidence A/B, official source URL present, updated in the last 90 days, and provider VERIFIED/public-safe/confidence A/B. The six listings are Department of Employment and Labour vacancies with reference numbers HR4/4/8/194, HR 4/4/8/190, HR4/4/9/29, HR4/26/10/02HO, HR4/4/8/192, and HR4/4/8/193. Their staging metadata records a 2026-10-30 closing date and a 2026-10-23 source check. The official Department listing independently showed these six titles as Open with 30 October 2026 closing dates when checked on 2026-10-23.

Official listing and advert checks:
- Department of Employment and Labour vacancy list: https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx
- Client Service Officer: Public Employment Services (HR4/4/8/194): https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx?PageFirstRow=31&Paged=TRUE&PagedPrev=TRUE&View=%7BF01EEABA-46DC-4830-90E3-2E7A96B86015%7D&p_Created=20250711+15%3A39%3A14&p_ID=2370
- BCEA Inspector (X4 Posts) (HR 4/4/8/190): https://www.labour.gov.za/bcea-inspector-%28x4-posts%29-%284%29
- Administration Officer: Employer Service (HR4/4/9/29): https://www.labour.gov.za/administration-officer-employer-service
- Senior State Accountant: Financial Reporting (HR4/26/10/02HO): https://www.labour.gov.za/senior-state-accountant-financial-reporting-%283%29
- BCEA Inspector (HR4/4/8/192): https://www.labour.gov.za/bcea-inspector-%2813%29

This corrects only the six current staging rows; it does not mean all 14 source authorities have live programmes, nor does it verify candidate-specific eligibility. The vacancy list must be refreshed and each advert rechecked after the closing date. Applications remain candidate-controlled unless the provider confirms receipt; these listings are not outcome evidence.
