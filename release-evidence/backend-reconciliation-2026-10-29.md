# Backend reconciliation checkpoint — 2026-10-29

## Scope and evidence boundary

Environment queried: Supabase staging project `euhubhhnumtibbyufghm`. All database queries in this checkpoint were read-only. No staging DDL was applied. This is an evidence checkpoint, not a release approval.

## CI for commit `96b02445e38a13e1c969c553d55a8ba097629495`

| Workflow | Run ID | Result |
|---|---:|---|
| Jarvis Live Runtime | 40913404590 | success |
| Kingsmen Source Guard | 40913404645 | success |
| Kingsmen Release Evidence | 40913404650 | success |

Release Evidence completed the repository test suite, backend API build, Next.js build, contract validations and local API health smoke tests. Source Guard passed its migration integrity *source-tree* gate, authenticated-E2E runner source contract, RLS source proof and other repository validators. These results do not establish live authenticated candidate/reviewer behavior, live schema parity, or deployed Netlify commit identity.

## Live catalog snapshot

Read-only catalog query at 2026-10-29:
- Applied migration ledger rows: **122**
- Public base tables: **230**
- Public views: **1**
- Functions in public/private/kingsmen_security: **52**
- Non-internal triggers on public tables: **20**
- Public constraints: **1,034**
- Public indexes: **733**
- Public RLS policies: **287**
- Public tables with RLS disabled: **0**
- Invalid/not-ready public indexes: **0**
- Duplicate migration ledger label: `candidate_application_preparation_readiness_0078` appears twice (versions `20261019112452` and `20261019112511`).

The counts are a dated snapshot and should be regenerated before any release decision.

## Migration provenance

The archive `release-evidence/recovered-applied-migrations/README.md` says its bodies were reconstructed from historical PR patches. Their Git blob SHAs identify the archived reconstructions, not the original bytes executed against staging. They are archival only and must not be replayed.

At this 29 October checkpoint, the first and second 0078 bodies had not yet both been reconciled. Subsequent PR #120 history recovery documented in `release-evidence/0078-migration-provenance-recovery-2026-10-29.md` and refreshed on 30 October separately maps the 98-line pre-fix body to `20261019112452` and the 104-line corrected body to `20261019112511`. The original execution-time SQL checksums remain unavailable. The 122-entry count in this document is a dated 29 October snapshot; the current staging ledger now has 130 entries. Full version-by-version provenance and semantic catalog reconciliation remain open; migration source-tree validation alone does not resolve those gaps.

## Confirmed targeted RLS/index cleanup preconditions

Live `pg_policies` queries confirm both the six unconditional legacy service-role policies and their guarded replacements exist on:
- `applications`
- `candidate_profiles`
- `candidates`
- `evidence_ledger`
- `route_sources`
- `workflow_runs`

The guarded replacements and duplicate-index parity are checked in forward-only migration `db/migrations/0087_consolidate_redundant_rls_policies_and_index.sql`. The duplicate index warning is live and names `candidate_identity_review_one_open_request_per_user` and `candidate_identity_review_one_open_request_per_user_idx`. Migration 0087 has **not** been applied; do not apply it until independent review, full definition comparison, backup/restore confirmation and approved staging change control.

## Live security/performance advisor findings

Security advisor snapshot:
- 17 tables have RLS enabled but no policies. Current names include private identity-review tables and founder-operation tables. This may be deliberate backend-only denial, but each table needs an explicit access-intent classification; do not add permissive policies just to silence the linter.
- Three `SECURITY DEFINER` RPCs are executable by `authenticated`: `prepare_candidate_application_from_master_target(text)`, `prepare_candidate_manual_portal_submission(uuid)`, and `record_candidate_application_outcome(uuid,text,text,text,text,text)`. Their bodies contain candidate identity or active-reviewer checks, but the RPC grants and role checks must be included in security tests.
- Supabase Auth leaked-password protection is disabled and requires a dashboard/configuration action; it has not been changed here.

Performance advisor snapshot:
- Three foreign-key relationships lack covering indexes, including two on `candidate_identity_review_evidence` and one on `candidate_master_application_targets`.
- One exact duplicate-index pair is reported as above.
- The advisor reports many unused indexes. Do not remove indexes solely from a staging snapshot with limited/unknown workload; validate usage on representative workload and inspect constraints/dependencies first.

## Authenticated E2E and release gates

Not proven by the evidence currently available:
1. Two authorized candidate sessions can register/save/reload/update profiles and maintain strict A/B isolation.
2. Candidate identity review evidence submission, least-privilege reviewer decision, verified Auth UUID link and immutable audit trail work end to end.
3. Private Document Vault upload/read/signed URL expiry and reviewer access are verified against actual private objects.
4. Unified application parent/child choices, tracker persistence, idempotency, evidence-gated status transitions and provider receipt/outcome flow pass with authenticated sessions.
5. PayFast sandbox checkout, ITN signature/amount/reference validation, idempotent settlement and failed-settlement recovery pass against live sandbox events.
6. Outbox worker execution/retry/dead-letter/recovery and actual email delivery evidence pass.
7. Founder runtime/brief APIs are tested with founder, ordinary-user and anonymous identities against persisted data.
8. A specific reviewed SHA is deployed on Netlify and the deployed authenticated journey is verified.
9. Independent human review and immutable RC1 approval exist.

The authenticated E2E runner intentionally requires `KINGSMEN_STAGING_BASE_URL`, an explicit plan, and separately supplied authorized candidate A/B/reviewer tokens; it refuses mutation tests without explicit authorization. No such session credentials or successful live E2E report were available in this audit. No test identities or evidence rows were fabricated.

## Required next execution order

1. Recover authoritative original migration SQL/checksums from execution artifacts or backups; document confidence per ledger row. Resolve the second 0078 body before declaring migration reconciliation complete.
2. Run the read-only catalog export in `scripts/staging/backend-live-catalog-audit.sql`; diff normalized live definitions against all runnable source migrations and historical source patches. Classify every delta and every backend-only no-policy table.
3. Independently review 0087 and all security advisor findings. Add indexes only after reviewing FK columns and existing composite index prefixes. Enable leaked-password protection through authorized Supabase Auth configuration.
4. Configure authorized candidate A/B/reviewer staging sessions and a non-destructive-first E2E plan; run the authenticated test suite and fix every failure. Run mutation tests only with approved disposable fixtures and explicit mutation authorization.
5. Re-run all CI on the resulting immutable SHA, capture backup/restore proof, obtain independent review, deploy that exact SHA, and verify the deployed app's authenticated journey before RC1.

**Release decision: BLOCKED.** The latest three CI workflows passed, but that is not equivalent to backend completion or production readiness.


## Current ledger refresh — 30 October 2026

The live Supabase migration ledger now has 130 entries and ends at migration 0095. This 29 October document's 122-entry counts are historical snapshots only. The duplicate 0093 label appears at versions `20261029180632` and `20261029180642`; preserve both ledger rows and reconcile the two original SQL submissions. PR #216's archive now has 62 ledger-to-file mapping rows, including five older PR #64 source snapshots. This mapping count does not establish exact SQL bytes at original execution. See the 30 October addendum in `backend-migration-provenance-gap-2026-10-29.md` for the current distinction and outstanding evidence.
