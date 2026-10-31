# Staging reconciliation: CAO bridge and 500-candidate cap

**State as of 2026-10-31:** read-only live inspection. No staging writes were made.

## Confirmed live evidence

- Migration ledger ends at `20261029193124 / candidate_self_service_profile_bootstrap_0095`.
- No ledger rows exist for the institutional import migrations 0096–0108 in this branch's expected sequence; the 0096–0098 provenance must be reconciled against actual objects before treating the historical migrations as applied.
- `public.cao_choice_items` exists and RLS is enabled, but its live table grants include broad privileges for both `anon` and `authenticated`. The only observed policy is service-role scoped. That mismatch is a least-privilege defect even if RLS currently denies client rows.
- `public.candidates` exists; `is_active` is boolean; current read-only count is 2 total and 2 active.
- No active-candidate-cap trigger/function was found in the live public trigger scan.
- The duplicate ledger names remain: `candidate_application_preparation_readiness_0078` (two versions) and `seed_verified_labour_vacancy_deadlines_0093` (two versions). Do not delete or rewrite ledger rows to make names look unique.

## Corrective migration 0108

The proposed corrective migration revokes anon/authenticated grants from the CAO bridge, grants only backend CRUD to service_role, and adds a transaction-advisory-lock protected trigger that refuses active candidate 501 while allowing deactivation. Preflight rejects schema drift and pre-existing cap overflow; postflight checks grants, trigger presence, and active count. It does not assert that an unverified CAO application is submitted, and does not create fake migration history.

## Release gate — intentionally blocked

Do not apply this migration or institution seed imports to staging until all are true:

1. Protected encrypted backup is produced and its integrity recorded.
2. Restore is performed into an isolated environment and validated; drill evidence is recorded in `backup_restore_drills`.
3. An independent reviewer reviews and approves the corrective migration and import PRs.
4. Formal change approval records the exact migration SHA and target project.
5. The preflight is rerun against the current staging schema immediately before the approved change window.

After approval, apply through the approved migration mechanism, then verify that anon/authenticated have zero CAO table grants, active candidate 501 is rejected in a rollback-safe test, deactivation remains possible, and normal backend candidate creation remains functional. Never insert synthetic migration ledger rows.


## CI wiring

Candidate Experience CI, Release Evidence, and Source Guard are configured to run on this corrective branch. CI verifies the source-contract validator and builds; it does not replace live migration runtime tests or the mandatory independent approval gates.
