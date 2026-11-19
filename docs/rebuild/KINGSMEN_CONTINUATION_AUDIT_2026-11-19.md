# Kingsmen One — Continuation Audit and Next Build Gate

**Date:** 19 November 2026  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Rebuild branch:** `rebuild/kingsmen-one-foundation-2026-11-17`  
**Live project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Scope:** Read-only live database inspection plus source provenance checks. This report records aggregate counts only; no candidate-level personal data was read.

## 1. Live baseline rechecked on 19 November

- Supabase reports `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1`.
- Live migration ledger: **130 entries**; latest `20261029193124 candidate_self_service_profile_bootstrap_0095`.
- Public tables: **230**; RLS is enabled on all 230.
- Two duplicate migration names remain:
  - `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`.
  - `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`.

### Core product-state counts

| Table / metric | Live count |
|---|---:|
| `candidates` | 2 |
| `candidate_auth_identity_links` | 0 |
| `candidate_profiles` | 0 |
| `candidate_master_profiles` | 0 |
| Legacy `applications` | 2 |
| `candidate_applications` | 0 |
| `candidate_application_events` | 0 |
| `candidate_route_applications` | 0 |
| `cao_choice_items` | 0 |
| `route_providers` | 120 |
| `route_programmes` | 14 |
| `opportunity_providers` | 0 |
| `opportunity_programmes` | 0 |
| `finance_plan_catalog` | 8 |
| `finance_orders` | 0 |
| `notification_outbox` | 0 |

**Meaning:** there is useful backend structure and starter catalogue data, but the live candidate identity → reusable profile → unified application path has not yet been demonstrated. The two legacy applications are not automatically convertible to the target parent application records; do not migrate them by guessing status mappings.

## 2. Migration source-provenance result

The currently tracked canonical repository source is fragmented across three roots on `main`:

- `db/migrations`: 35 SQL files (numbered groups through 0086 with gaps).
- `database/migrations`: 1 SQL file.
- `supabase/migrations`: 1 SQL file.
- Total current `main` migration source files: **37**, versus **130** applied migration-ledger entries.

Recovered-applied SQL snapshots exist in unmerged source branches:

- PR #254 head `18f71066ac8ff9fb88711c303a3df38833d873c5`: 62 SQL snapshots plus README.
- PR #209 head `35871bdfb2484dd951eb956477a543866193a432`: 57 SQL snapshots plus README.

For the PR #254 recovery set, all 62 SQL snapshot filenames use a timestamp that matches a live ledger version. This is a **filename/version mapping**, not proof that their SQL bytes equal the historical SQL applied to Supabase. No live applied-SQL hash is available in the ledger.

The committed reconciliation CSV represents all 130 live entries and classifies the source evidence as:

| Source classification | Entries | Interpretation |
|---|---:|---|
| `EXACT_TIMESTAMP_RECOVERY_FILE` | 62 | A recovery snapshot maps to the live migration timestamp; SQL-content parity is not asserted |
| `FILENAME_MATCH_REQUIRES_CONTENT_REVIEW` | 36 | Candidate source exists but needs semantic/content comparison |
| `NO_MATCHING_SQL_SOURCE_FOUND` | 32 | No matching source was identified in the recorded source inventory |

The CSV is complete as a **record of the audit**, but the provenance work itself is not complete until the 36 candidate files are reviewed and the 32 missing sources are investigated. Do not replay the 62 recovery snapshots against staging or a new database.

### Repository guard added

- Validator: `scripts/validators/validate-kingsmen-migration-ledger-reconciliation.mjs`
- Workflow: `.github/workflows/kingsmen-migration-ledger-manifest.yml`
- Purpose: check that the committed CSV contains 130 unique versions, its recorded source-class totals remain explicit, and the two duplicate migration names remain documented.
- Limitation: this guard validates the **static audit manifest only**. It does not connect to Supabase, execute SQL, compare live state, or prove content parity.
- Commit adding the validator: `72003845a15f2bec18041e0d06a5e49ee199433e`.
- Commit adding its workflow: `8df7eb1035fe38efcc4ae619bcf6ba01953fc1fc`.
- The connector did not expose a check result for that commit at audit time. Do not mark the validator CI run as passed until a run result is independently visible.

## 3. Deployed Edge Function source parity rechecked

I retrieved each deployed function from Supabase and compared its file content directly against the corresponding path on the rebuild branch as it stood at commit `3c359970c777734be5aa361870aa3c8497ff8c1d`.

**Result: 21/21 deployed function entrypoints match; all 22 deployed files match the rebuild-branch files byte-for-byte.** The additional file is `candidate-private-documents/document-signature.mjs`.

| Function | Live version | JWT gateway check | Source comparison |
|---|---:|---|---|
| `candidate-application-outcome-review` | 3 | true | Exact |
| `candidate-application-outcomes` | 3 | true | Exact |
| `candidate-application-preparation` | 17 | true | Exact |
| `candidate-identity-review-decision` | 4 | true | Exact |
| `candidate-identity-review-evidence-decision` | 2 | true | Exact |
| `candidate-identity-review-evidence-read` | 2 | true | Exact |
| `candidate-identity-review-evidence-upload` | 4 | true | Exact |
| `candidate-identity-review-followup` | 2 | true | Exact |
| `candidate-identity-review-queue` | 3 | true | Exact |
| `candidate-identity-review-request` | 4 | true | Exact |
| `candidate-identity-review-status` | 2 | true | Exact |
| `candidate-master-profile` | 4 | true | Exact |
| `candidate-private-documents` | 17 | true | Exact |
| `candidate-profile-review` | 3 | true | Exact |
| `candidate-save-verified-opportunity` | 4 | true | Exact |
| `candidate-workspace-readiness` | 5 | true | Exact |
| `n07-airtable-enqueue` | 3 | true | Exact |
| `n08-founder-control-plane-health` | 4 | true | Exact |
| `n15-candidate-opportunities` | 3 | true | Exact |
| `n15-source-ingestion` | 3 | true | Exact |
| `payfast-sandbox` | 10 | false | Exact |

The PayFast function has JWT gateway verification disabled as a webhook boundary; it must continue doing its own server-side request, signature, merchant, amount, replay and idempotency validation. Exact source parity is not live functional proof. No function was redeployed or changed.

## 4. Current security findings

Supabase's live security advisor reports:

- **17 RLS-enabled tables without any policies.** These are identity-review and founder/control tables. RLS with no matching policy is fail-closed for client roles; classify each as deliberately service-only or a missing policy. Do not add broad policies merely to silence the advisory.
- **6 `SECURITY DEFINER` functions callable by authenticated users**, with no anonymous execute privilege found for those six:
  - `get_candidate_cao_choices(uuid)`
  - `list_candidate_cao_parents()`
  - `prepare_candidate_application_from_master_target(text)`
  - `prepare_candidate_manual_portal_submission(uuid)`
  - `record_candidate_application_outcome(uuid, text, text, text, text, text)`
  - `save_candidate_cao_choices(uuid, jsonb)`

These six are application-facing privileged RPCs; some are expected to be callable by an authenticated candidate. Before changing grants, complete function-by-function owner/role/evidence checks and positive/negative tests. A blanket revoke would risk breaking intended candidate operations.

## 5. Decisions for the next implementation slice

1. **Do not mutate staging schema yet.** Capture a verifiable backup/export and prove restore before running migrations or changing grants.
2. **Do not merge PR #254, #292 or #316 wholesale.** They are reuse sources with dependencies and unproven runtime paths; transplant only reviewed, tested slices.
3. **Next product slice:** candidate identity bootstrap and profile persistence → verified opportunity save → parent application draft → application event/history → founder queue → candidate-visible truthful status.
4. Use `candidate-master-profile`, `candidate-save-verified-opportunity`, `candidate-application-preparation`, `candidate-private-documents` and the current candidate UI as reuse candidates; the source is recoverable and matches deployment at the inspected branch commit.
5. Build the integration test environment without creating a billable Supabase branch unless the user explicitly approves the cost. Test two isolated candidates, consent, identity ownership, fresh-source gates, application idempotency, CAO child-choice permissions and application status truth.
6. Treat the first candidate flow as unreleased until it passes authenticated browser tests and a controlled staging runtime check. A healthy database, exact source parity, or a green build alone is not sufficient.

## Change record

- This is an audit and source-reuse record. It does not claim that the application engine is complete.
- No candidate, application, finance, opportunity, storage or Supabase schema data was changed in this continuation.
- No Edge Functions were redeployed.
- No production deployment is claimed.
