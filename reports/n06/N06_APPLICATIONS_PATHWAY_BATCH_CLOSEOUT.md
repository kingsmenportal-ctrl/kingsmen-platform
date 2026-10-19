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
- CI and TypeScript/Next.js build are not yet confirmed green.
- Migration 0060 is not applied.
- Live API contract and candidate isolation probe are not run.
- Opportunity data is not seeded; an authorised source-review/ingestion process must publish and verify real opportunities.
- No live provider portal is automated or submitted by this batch.
- productionReady remains false.

## Release gates
1. Obtain actionable CI logs and resolve any failing source/build checks.
2. Review migration 0060 against the actual staging schema; confirm document and profile field names.
3. Apply migration through the approved migration process.
4. Run source validator and production build.
5. Run isolation probe using two dedicated synthetic staging candidate sessions.
6. Add an authorised reviewer workflow for provider-confirmed submission/outcome status changes.
7. Validate accessibility, retention, error recovery, and application lifecycle end-to-end.

## Fix-forward contract
Future work may alter schema, UI, readiness rules, provider ingestion, review queues, and evidence handling. Preserve the rule that internal readiness does not equal submission, and candidate assertions do not equal provider confirmation. Add fixes as follow-up commits with their own validation evidence.
