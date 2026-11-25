# Kingsmen One — Migration and Schema Reconciliation
**Date:** 17 November 2026  
**Source database:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**GitHub source:** `kingsmenportal-ctrl/kingsmen-platform`  
**Rebuild branch:** `rebuild/kingsmen-one-foundation-2026-11-17`  
**Audit mode:** Read-only. No migrations, schema changes, data writes, storage writes or deploys were performed.

## Executive conclusion
The existing backend should be recovered and selectively simplified, not replaced wholesale. The staging project is now `ACTIVE_HEALTHY`; its 230 public tables and 130 migration-ledger entries are available for inventory. The live database has a coherent set of useful candidate, opportunity, application, document, finance and operations capabilities, but the repository does not yet have one complete authoritative source history for the deployed schema.

The new rebuild must not apply a guessed baseline, replay migrations, or copy the database's historic fragmentation into a fresh design. First establish provenance and a compatibility map; then design the target schema and migration path.

## 1. Migration reconciliation

### Live database
- Live migration ledger: **130** entries.
- Latest entry: `20261029193124 candidate_self_service_profile_bootstrap_0095`.
- The two duplicated ledger names are:
  - `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`.
  - `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`.

### Source history
- Current `main`: 37 SQL migration files split across `db/migrations` (35), `database/migrations` (1) and `supabase/migrations` (1).
- Backend simplification PR #209 branch: 102 SQL files when the recovered-applied migration evidence folder is included.
- PR #209 contains 57 timestamp-prefixed recovered-applied SQL snapshots matching a live version prefix.
- The later PR #254 source tree contains 62 such recovered-applied snapshots.
- On PR #254's source tree, the 130 live ledger entries classify as:
  - **62 exact timestamp recovery-file matches**.
  - **36 filename-level candidates** whose content still needs to be checked against the applied migration.
  - **32 entries with no matching SQL source file found in that source tree**.
- Filename similarity is not proof of SQL equality. No file was declared byte-identical to the applied database migration because a source hash from the live applied migration was not available.

### Unmerged proposals
- PR #254 adds source files for migrations `0096`, `0097`, `0098`, plus two timestamped reconciliation migrations. They are not in the live ledger; they remain unmerged proposals.
- PR #292 adds migrations `0107`, `0108`, `0109`. They are not in the live ledger and PR #292 is stacked on other unmerged branches.
- Do not apply or merge these migrations as a batch. Reconcile dependencies, review the SQL, test from a clean local database and validate against a staging backup first.
- PR #209 is also open/unmerged. Its recovered-applied migration folder is valuable evidence but it is not automatically the new canonical migration history.

Full version-by-version details: `KINGSMEN_MIGRATION_LEDGER_RECONCILIATION_2026-11-17.csv`.

## 2. Public table census

The public schema contains **230 tables**. The table-by-table domain map is in `KINGSMEN_PUBLIC_SCHEMA_DOMAIN_CENSUS_2026-11-17.csv`.

| Domain | Tables |
|---|---:|
| AI/decision | 5 |
| Jobs/integrations/automation | 34 |
| Applications/CAO/progression | 29 |
| Founder/control/governance | 33 |
| Observability/release/security/backup | 26 |
| Identity/profile/consent | 20 |
| Communications/support | 15 |
| Finance/payments/entitlements | 16 |
| Documents/identity review | 13 |
| Public website/intake | 14 |
| Catalogue/providers/source verification | 25 |
| **Total** | **230** |

This is a naming/ownership inventory, not a decision to drop or merge every table in a domain. A number of tables are operational ledgers or support records that should remain separate even after the user-facing flows are simplified.

## 3. Key model overlaps and proposed target ownership

### Candidate identity and profile
- `candidates`: 2 rows.
- `candidate_accounts`: 0 rows.
- `candidate_auth_identity_links`: 0 rows.
- `candidate_master_profiles`: 0 rows.
- `candidate_profiles`: 0 rows.
- Supabase Auth user data was not inspected at the individual-record level.

Target policy:
- Supabase Auth is the only login/password authority.
- One verified Auth user ↔ one candidate identity link.
- `candidate_master_profiles` is the self-service reusable profile payload and pathway preference surface.
- `candidate_profiles` represents a separate reviewed/assessed profile model; preserve its evidence and review semantics during mapping rather than treating it as an identical duplicate.
- The empty legacy `candidate_accounts` table should be reviewed for retirement only after dependencies are mapped; never introduce a second credential authority.

### Applications and CAO
- Legacy `applications`: 2 rows; it uses route-style fields such as `route_type`, `route_name` and `current_state`.
- `candidate_applications`: 0 rows; it carries an opportunity FK, pathway, readiness and status.
- `candidate_route_applications`: 0 rows.
- `candidate_master_application_targets`: 0 rows.
- `candidate_application_events`: 0 rows.
- `candidate_application_draft_answers` is not present in the current live schema; its creation is in unmerged PR #292 migration 0109.
- `cao_choice_items` is the intended child choice model.

Target policy:
- Use one Kingsmen parent application record across the six pathways, with `candidate_applications` as the current target parent model pending full source review.
- Keep CAO choices as ordered child rows.
- Use append-only application events for the lifecycle.
- Treat `applications` and `candidate_route_applications` as legacy/compatibility sources until their records and code dependencies are mapped.
- Do not migrate the two legacy application records automatically or guess status equivalents.

### Opportunity catalogue and provider registry
- `route_providers`: 120 rows; 3 VERIFIED, 115 NEEDS_REVIEW, 2 BLOCKED.
- `route_programmes`: 14 rows; 8 VERIFIED, 6 NEEDS_REVIEW.
- `route_categories`: 10 rows.
- `candidate_opportunities`: 4 rows; 2 UNVERIFIED, 2 STALE.
- `opportunity_providers`: 0 rows.
- `opportunity_programmes`: 0 rows.
- `external_source_observations`: 0 rows.
- `candidate_opportunity_matches`: 0 rows.

Target policy:
- `opportunity_providers`, `opportunity_programmes` and official-source observations are the newer evidence-centric catalogue design, but they currently have no populated records.
- `route_providers` and `route_programmes` are potentially reusable seed material, not evidence that 120 providers or 14 programmes are currently safe to recommend. Preserve original source confidence and status, validate official authority and freshness, then crosswalk verified records.
- Do not present any of the four `candidate_opportunities` records as currently open without fresh official evidence.
- A catalogue entry, candidate match and an application are distinct entities.

### Finance and commercial catalogue
- `finance_plan_catalog`: 8 rows (six paid plans, CV Revamp and Free Destiny Map).
- `service_packages`: 7 rows; it contains legacy `entitlement_snapshot` JSON.
- `public_website_package_cards`: 7 rows; display-oriented pricing/benefit projection.
- Current prices in the finance and website projections are aligned at the major ZAR amounts. The service_packages legacy code/naming differs for Guildmasters and its entitlement structure is not canonical.

Target policy:
- `finance_plan_catalog` should be the canonical plan/benefit catalogue, with prices in integer cents.
- Derive website cards from the canonical plan catalogue rather than independently editing a second set of benefits.
- Retire `service_packages` only after references and historical order compatibility are understood. Do not use its legacy entitlement_snapshot as the live entitlement authority.
- Keep orders, payment attempts, verified PayFast ITNs, refunds and usage ledgers distinct.

### Documents and storage
- `candidate_private_documents`, `candidate_identity_review_evidence`, reviewer tables and storage events exist as separate models.
- Private buckets found:
  - `kingsmen-candidate-documents`: 10 MiB; PDF/JPEG/PNG; used by the deployed candidate document function.
  - `identity-review-evidence`: 8 MiB; PDF/JPEG/PNG; used by the identity evidence upload function.
  - `candidate-documents`: 10 MiB; PDF/DOCX/TXT; legacy candidate-document bucket.
- The deployed `candidate-private-documents` function is ACTIVE at version 17 and uses the Kingsmen candidate bucket. The identity evidence upload function is ACTIVE at version 4 and uses the identity evidence bucket.

Target policy:
- Preserve document metadata, SHA-256 integrity, owner binding, reviewer decisions and private-link audit.
- Check storage object counts/paths and all function references before retiring the legacy bucket. Do not delete or move storage objects as part of a schema simplification.

## 4. Security findings requiring designed treatment

- 17 public tables have RLS enabled but no policies. These comprise 13 founder/control-plane records and 4 identity/document-review records. They appear consistent with server-only/backend-only access, but must be verified against every Edge Function and Next.js server route. RLS enabled with no policies is default-deny for ordinary client roles; do not add broad client policies to silence the advisor.
- Six authenticated-executable SECURITY DEFINER functions were flagged:
  - `get_candidate_cao_choices`
  - `list_candidate_cao_parents`
  - `prepare_candidate_application_from_master_target`
  - `prepare_candidate_manual_portal_submission`
  - `record_candidate_application_outcome`
  - `save_candidate_cao_choices`
- The live privilege query found no anonymous EXECUTE privilege on those six. Source inspection of the definitions showed explicit authenticated identity/ownership/consent or reviewer-role checks. These still require negative and positive authenticated tests; do not revoke them blindly.
- Supabase Auth leaked-password protection is disabled (WARN). Enable only after configuration review and a test of sign-up/password flows.
- Performance advisor showed 16 multiple-permissive-policy warnings and 285 unused-index informational findings. Do not bulk-drop indexes; assess query plans and production workload after a representative period.
- No health advisor lints were reported.

## 5. Live Edge Functions and source parity

- 21 Edge Functions report ACTIVE.
- 20 have JWT verification enabled.
- `payfast-sandbox` has JWT verification disabled for the provider-notification boundary. Its inspected source includes signature, merchant, IP, amount, payment state and duplicate/replay controls. Keep it sandbox-only until independent ITN runtime tests are complete.
- Current `main` contains only two directories under `supabase/functions`; PR #316 adds candidate profile, application preparation, opportunity save, private documents, identity review and payment function sources. This is a source/deployment parity gap to close before any function redeploy.
- Do not replace deployed functions with a partial source folder. First export/source-compare every deployed function version and keep an approved parity manifest.

## 6. Main branch controls and change discipline

- The repository's `main-branch-protection` ruleset was read directly: active, targets `refs/heads/main`, requires one approving review, requires strict `validate` and `test-and-build` contexts, disables force-push and branch deletion, and has no bypass actors.
- The legacy branch-protection endpoint reported disabled; the active repository ruleset is the operative control.
- Keep PR #209, #254, #292 and #316 unmerged until their dependencies and SQL/code have been reviewed. No force merges.
- The rebuild branch remains separate from `main`. These audit files are documentation only.

## 7. Recommended next implementation order

1. Create a migration provenance register containing every live version, recovered SQL file, source commit, SHA-256 and review state.
2. Export a verified schema/data/storage backup through a supported Supabase backup path before any DDL. The connected tools do not provide a full database dump/restore artifact; this remains an operational recovery task.
3. Map and test all 17 default-deny backend-only tables and six SECURITY DEFINER RPCs.
4. Map dependencies and row ownership for the profile, application, catalogue, finance and document table families.
5. Build the reduced canonical schema in a local isolated PostgreSQL/Supabase environment, not the staging database.
6. Test migrations from an empty database and a staging schema clone; produce an idempotent, reversible data migration plan.
7. Only after backup/restore and test evidence, propose the first reviewed staging migration.

**Current state:** audit documents and CSV inventories are ready; the rebuild branch has not changed the live database; no DDL, DML, storage modifications, merge or deployment was performed.
