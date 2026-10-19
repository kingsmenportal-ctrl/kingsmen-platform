# N06 Applications and Pathway Execution — Batch Closeout

**Disposition: implementation batch pushed / handoff complete / release gates open.**

This is a reversible feature increment intended to be corrected or extended during final Kingsmen integration. It is not a claim that the N06 database migration, connected staging runtime, CI, production build, or provider integrations have passed.

## Implemented
- Six pathway types represented in the schema and candidate UI.
- Published opportunity discovery, pathway filtering, candidate-scoped save/unsave.
- Application draft creation guarded by published status, verified source status, supported pathway and deadline.
- Evidence-aware readiness assessment against the opportunity's required document types and profile fields.
- Candidate-owned application listing.
- Explicit status transition graph with optimistic concurrency guard.
- Provider-originated submission/outcome statuses are rejected from the candidate endpoint; a candidate-supplied evidence string is not independent proof.
- Manual application action package with audit event and no false claim of provider submission.
- Append-only application event table, source validator, staging isolation probe, dashboard link and CI workflow.

## Follow-up implementation hardening
- Connected the candidate dashboard controls to the missing READY_FOR_REVIEW → READY_TO_SUBMIT → SUBMISSION_PENDING progression, with the existing readiness guard retained.
- Hardened the N06 migration by explicitly revoking table access from PUBLIC/anon/authenticated before granting service-role access, and pinned the append-only trigger function to an empty search path.
- Added conditional rollback when a status transition cannot be audited, with a distinct error when rollback cannot be confirmed.
- Extended the N06 source validator to guard the progression and rollback contract.

## Validation status
- Source files and package commands are committed.
- N06 source guards, shared validation, N05 source guards, and the Next.js production build all passed on commit abeccea18d3a0d76d9ded9b2d2ce6d1122bf1d9b.
- Migration 0060 is already recorded in staging; migration 0073 was applied at 2026-10-19 08:29 UTC. Post-migration SQL verified RLS enabled, service_role-only policies, no anon/authenticated table privileges, and event-table SELECT/INSERT-only service-role grants. The Supabase security advisor returned no lints.
- Authenticated live API contract and two-candidate isolation probe remain unexecuted; source/build/database proofs are not represented as a substitute for this runtime proof.
- Opportunity data is not seeded; an authorised source-review/ingestion process must publish and verify real opportunities.
- No live provider portal is automated or submitted by this batch.
- productionReady remains false.

## Release gates
1. Confirm all GitHub Actions source-guard and production-build checks are green.
2. Verify migration 0073's effective table grants and RLS policies in staging.
3. Run the two-candidate isolation probe using dedicated synthetic staging sessions.
4. Validate candidate-to-reviewer handoff with authenticated synthetic data.
5. Validate accessibility, retention, error recovery, and application lifecycle end-to-end.

## Fix-forward contract
Future work may alter schema, UI, readiness rules, provider ingestion, review queues, and evidence handling. Preserve the rule that internal readiness does not equal submission, and candidate assertions do not equal provider confirmation. Add fixes as follow-up commits with their own validation evidence.
