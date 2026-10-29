# Migration 0078 provenance recovery — 29 October 2026

## Result

Two distinct historical source bodies for the duplicated staging migration label `candidate_application_preparation_readiness_0078` have been recovered from the actual commit history of PR #120. The archive now stores each body separately outside the runnable migration directories.

| Staging ledger version | Historical source | Blob SHA | Lines | Key difference |
| --- | --- | --- | ---: | --- |
| `20261019112452` | [Pre-fix commit 8e02371](https://github.com/kingsmenportal-ctrl/kingsmen-platform/commit/8e02371653e3aed59f8ee3b3c5a7d276168c5d18) | `6f3512d330b99206bad7859318dcaf9fdb461c59` | 98 | Creates preparation tables and tracker composite key; does not add the preparation-item composite owner key. |
| `20261019112511` | [Corrective commit f723fbe](https://github.com/kingsmenportal-ctrl/kingsmen-platform/commit/f723fbe7ac9eb3e3afe15e640d61da433bf1bdb4) | `9fdabdde36c981ae305e57df589c168471b7d974` | 104 | Adds unique index on `public.candidate_application_preparation_items(id, candidate_id)`. |

The corrective commit's author timestamp is `2026-10-19T11:25:04Z`; the staging ledger versions are labelled `11:24:52` and `11:25:11`. This ordering supports mapping the pre-fix body to the earlier version and the correction to the later version.

## Live postcondition

A read-only Supabase staging query confirmed the following indexes exist and are unique, valid and ready:

- `candidate_application_tracker_id_candidate_uidx` on `candidate_application_tracker(id, candidate_id)`
- `candidate_application_preparation_items_id_candidate_uidx` on `candidate_application_preparation_items(id, candidate_id)`

## Qualification

The Supabase migration ledger stores versions and names, but not the SQL body/checksum captured at original execution. The source bodies and timeline are now recovered; byte-for-byte proof of the exact SQL submitted at those historic timestamps remains unavailable. Do not report the Git blob SHA as an execution-time checksum.

## Automated regression coverage

- `scripts/staging/test-backend-migration-provenance-0078.mjs` distinguishes the 98-line and 104-line bodies, their differing index semantics and ledger mappings.
- `scripts/staging/backend-live-catalog-audit.sql` has been extended for migration duplicates, views, extensions, sequences, grants/default ACLs, role memberships, Storage buckets/policies and event triggers.
- `scripts/staging/test-backend-live-catalog-audit.mjs` checks that the catalog audit remains SELECT-only and covers the required object/privilege categories.
- Both checks are wired into `backend:simplification:check` in `package.json`.

These code changes are on PR #209 branch `feat/backend-simplification-baseline-2026-10-29`; CI validation is required before treating the new tests as passing.
