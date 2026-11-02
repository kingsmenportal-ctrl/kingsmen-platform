# Live staging schema and migration-ledger audit — 2026-11-02

## Scope and safety boundary

Read-only inspection of Supabase staging project `euhubhhnumtibbyufghm`. No SQL writes, migration application, restore, seed import, provider connection, or production action was performed. This is an evidence snapshot, not change-control approval.

## Observed migration ledger

- Supabase migration API returned **130 migration records**.
- Direct read of `supabase_migrations.schema_migrations` returned **130 rows, 130 distinct version values, 0 duplicate version values**.
- The ledger schema contains `version`, `statements`, `name`, `created_by`, `idempotency_key`, and `rollback`.
- Two migration *names* occur twice under different version values:
  - `candidate_application_preparation_readiness_0078`: `20261019112452`, `20261019112511`.
  - `seed_verified_labour_vacancy_deadlines_0093`: `20261029180632`, `20261029180642`.
- These are not duplicate version keys, but they are migration-provenance ambiguities that require repository-to-ledger reconciliation. Do not delete, rename, mark-repaired, or reapply either entry until the exact repository files, statement arrays, checksums/commit ancestry, and live schema effects have been compared and independently reviewed.

## Observed catalogue baseline

| Table | Live row count |
|---|---:|
| `public.opportunity_providers` | 0 |
| `public.opportunity_programmes` | 0 |
| `public.opportunity_source_authorities` | 38 |
| `public.source_authorities` | 38 |
| `public.organisations` | 0 |

The live `opportunity_providers` table currently exposes only `id`, `provider_ref`, `provider_name`, `provider_type`, `sector`, `province`, `official_url`, `accreditation_status`, `source_confidence`, `safe_to_recommend`, `evidence_refs`, and timestamps. No dedicated alias, campus/branch relationship, or normalized source-assertion table was found in the sampled set of table names. Do not assume the proposed canonical identity contract is already implemented in the database.

## Immediate required reconciliation work

1. Export the full ordered migration ledger, including each `statements` and `rollback` array, with restricted access and integrity hash.
2. Compare every ledger row with the exact migration files in the intended release commit. Report: file-only migrations, ledger-only migrations, version/name mismatches, statement/hash mismatches, repeated semantic migrations, and migration files with no ledger record.
3. For the two repeated names above, determine whether the second record is an intentional corrective migration, a duplicated migration body, or a provenance error. Produce a reviewed reconciliation decision; never rewrite historical evidence in place.
4. Inspect the schema definitions, constraints, indexes, RLS policies, grants, triggers and dependent functions for the live catalogue tables and all candidate identity-related tables. The absence of a table in the sampled names list is not proof of absence from every schema.
5. Only after independent review, create a forward-only corrective migration with explicit preconditions, safe rollback/restore plan, and test evidence. Do not apply it before backup/restore and approval gates pass.

## Protected backup/restore drill — NOT COMPLETED

Required evidence before any staging migration/import:
- Record provider backup/PITR capability and retention; identify the protected recovery point and exact target environment.
- Obtain written change-control approval, named operator/reviewer, impact window, and restore acceptance criteria.
- Restore to an isolated non-production target, not over staging or production.
- Verify restored database identity, schema/migration ledger, critical row counts, RLS/policies/grants, storage references, and application smoke tests.
- Record start/end times, recovery-point timestamp, observed recovery time, redacted logs, discrepancies, reviewer sign-off, and cleanup.
- Abort if restore permissions, target isolation, or evidence capture cannot be proved.

No claim of a successful backup or restore is made by this report.

## Import reconciliation — NOT COMPLETED

The institution seed PR is authored but not applied. Before import, provide per-source manifests with source URL, authority, publication/effective date, retrieval timestamp, source hash/snapshot, parser version, raw row count, normalized row count, exact duplicates, likely duplicates, unresolved identity rows, rejected rows, and reason codes. Preserve legal statuses separately (registered, provisional, lapsed, cancelled, unresolved). Do not merge on fuzzy name alone.

Programme rows must remain distinct from time-sensitive opportunities. An opportunity may be published as open only with individually reviewed source evidence, official application destination, applicable deadline/window, eligibility criteria, and a freshness check. Provider integration is separately authorized per provider and must not be inferred from an official URL.

## Security/release gates — OPEN

- Protected backup/restore drill and signed change-control approval.
- Independent review of migration provenance and canonical identity/evidence schema.
- CI checks on the exact proposed release commit.
- Authenticated Candidate A/B tests proving own-record access and cross-candidate denial.
- Reviewer-role tests proving least privilege and denied candidate/client writes.
- Evidence of RLS, grants, storage access, and API behavior in staging.
- Founder approval after review, followed by a controlled production promotion and exact deployed-SHA verification.

## Status

**Audit:** read-only observations captured.  
**Database changes:** none.  
**Import status:** not applied.  
**Backup/restore:** not proven.  
**CI:** not proven green for this branch head at audit time.  
**Authenticated isolation/reviewer tests:** not run/proven by this audit.  
**Production promotion:** blocked pending all gates above.


## Follow-up repository-to-ledger exact-body comparison — 2026-11-02

The two repeated-name pairs were compared directly against the staging ledger's stored `statements[1]` text and the candidate repository files. All four tested comparisons were byte-for-byte exact matches:

| Ledger version | Ledger name | Repository file | Ledger/file body length | Result |
|---|---|---|---:|---|
| `20261019112452` | `candidate_application_preparation_readiness_0078` | `release-evidence/recovered-applied-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql` | 6,648 | Exact match |
| `20261019112511` | `candidate_application_preparation_readiness_0078` | `release-evidence/recovered-applied-migrations/20261019112511_candidate_application_preparation_readiness_0078_corrected.sql` | 6,983 | Exact match |
| `20261029180632` | `seed_verified_labour_vacancy_deadlines_0093` | `db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql` | 6,455 | Exact match |
| `20261029180642` | `seed_verified_labour_vacancy_deadlines_0093` | `db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql` | 6,455 | Exact match |

### Reconciliation interpretation

- The two `0078` records are not duplicate bodies: each ledger version matches its own distinct repository file. The second file is the corrected variant and adds a composite unique index needed by the later private document-vault relationship.
- The two `0093` records have the same 6,455-character body, and that same body exactly matches one repository file. The evidence therefore establishes that the same migration body was recorded under two distinct ledger version values. It does not establish the operator intent, whether the second record represents an intentional idempotent re-run, or whether there were any unintended side effects. Keep both ledger records immutable pending independent review.
- Both repeated-name pairs have `created_by=ndabenhlemvelo@gmail.com`, null `idempotency_key`, one stored statement each, and null rollback arrays.

### Repository migration-file inventory

The branch tree at commit `738b12c3442b9bb42b133b30228bdabc8479756c` contains 102 SQL migration-candidate files in four locations: 43 under `db/migrations`, 57 under `release-evidence/recovered-applied-migrations`, one under `database/migrations`, and one under `supabase/migrations`. The separate read-only diagnostic SQL under `scripts/audits` is not counted as a migration.

There are 58 timestamp-prefixed files in the repository inventory (57 recovered-applied files plus one Supabase migration). One timestamp-prefixed file, `supabase/migrations/20261016151400_payfast_finance_tx.sql`, has no live ledger row with that exact version. Conversely, 73 live ledger versions have no file with the same 14-digit timestamp prefix. These are filename-level observations only: older numbered files and differently named recovered files may still map to those ledger rows. They are not yet a valid count of ledger-only or file-only migrations.

**Full reconciliation remains incomplete.** The remaining ledger rows and candidate files still require body-level matching, semantic/name reconciliation, and confirmation of the applicable release commit. Do not infer that a missing timestamp prefix means a missing migration or that a numbered file was applied based on its filename alone.

## Branch-protection evidence workflow — 2026-11-02

The workflow run `41379703456` for commit `738b12c3442b9bb42b133b30228bdabc8479756c` completed with conclusion `failure`. The run's jobs and artifacts endpoints returned empty collections through the available GitHub connection, so the failing step could not be established from the accessible run evidence. The workflow's verifier reads `/branches/main/protection`; direct read attempts through both connected GitHub integrations returned HTTP 403, `Resource not accessible by integration`. The verifier is therefore not evidence that branch protection is active. Main-branch protection remains unverified, and CI must not be described as green.

## Expanded live table-name discovery

A broader `information_schema.tables` query found related existing tables including `candidate_application_evidence`, `candidate_identity_review_evidence`, `evidence_ledger`, `opportunity_deadlines`, `opportunity_eligibility_rules`, `opportunity_verification_reviews`, `route_programmes`, and `route_providers`, as well as the N15 catalogue tables. This discovery is not a complete policy/constraint audit. Existing tables are not assumed to satisfy the canonical model without column, constraint, index, trigger, grant, RLS and application-code review.


## Live catalogue schema, access-control and security-advisor snapshot — 2026-11-02

The following read-only inspection was performed against the active staging project after the migration-file comparison. It inspected selected catalogue, organisation, application-evidence and identity-review tables for columns, constraints, RLS flags, policies and effective table privileges. This is a targeted schema audit, not a complete review of every public table or every function.

### Current model footprint

The following distinct structures already exist and must be reconciled rather than blindly replaced:

- `opportunity_providers`: stable `provider_ref`, provider type/name, sector, province, official URL, accreditation status, confidence, recommendation flag and evidence refs. It does not contain normalized campus or alias relationships.
- `route_providers` and `route_programmes`: a separate provider/route catalogue with source authority links, verification/public-safety flags, route type, qualification, delivery/method, source confidence, availability and eligibility summary.
- `organisations` and `organisation_listings`: employer/provider organisation identity, verification review and dated listing records with publication evidence and a separate application destination.
- `opportunity_programmes`, `opportunity_deadlines`, `opportunity_eligibility_rules`, `opportunity_source_authorities`, and `opportunity_verification_reviews`: separate programme, deadline, eligibility, source and reviewer structures.
- `candidate_opportunities` and `candidate_opportunity_matches`: candidate-facing opportunity and match records.
- `source_authorities` and `evidence_ledger` / `candidate_application_evidence`: existing source/evidence structures.

The all-schema table-name search for names containing campus, alias, institution, source assertion, or provider domain returned no matches. This establishes that no separately named relational table was found by those patterns; it does not prove that equivalent information is absent from JSON, arrays or differently named structures.

The live provider/programme catalogue tables remain empty in the latest observed counts: `opportunity_providers=0`, `opportunity_programmes=0`, and `organisations=0`. Both source-authority registries returned 38 rows. The earlier `route_providers=3` and `route_programmes=8` counts should be treated as a separate legacy catalogue baseline, not as equivalent canonical imports.

### RLS, policies and table privileges

RLS was enabled on every selected table inspected; `FORCE ROW LEVEL SECURITY` was false on those tables. Effective ACL checks showed that anon/authenticated roles still hold table-level privileges on several N15 and evidence tables even where the only row policy is service-role-only. Examples include `opportunity_providers`, `opportunity_programmes`, `opportunity_source_authorities`, `opportunity_deadlines`, `opportunity_eligibility_rules`, `opportunity_verification_reviews`, `candidate_application_evidence`, and `evidence_ledger`.

For the reviewed service-only catalogue tables, the active RLS policies restrict client row operations to the service role. The grants therefore do not by themselves prove data disclosure or unauthorised writes; RLS still applies to client roles. However, the excess table-level grants are unnecessary privilege and create avoidable risk if a policy is later broadened or removed. A separate reviewed forward-only hardening migration should revoke unused anon/authenticated privileges while preserving explicitly approved public-read routes and the application's intended RPC paths.

The identity-review request/evidence tables inspected have RLS enabled, no client-facing policies, and no effective anon/authenticated table privileges in the checked ACL. These appear to be backend-only access boundaries and should remain so unless a reviewed server-side access design requires otherwise.

### Supabase security advisor findings

Security advisor snapshot observed at `2026-11-02T03:00:22.954Z`:

1. **17 tables** flagged as `rls_enabled_no_policy` (INFO): `candidate_identity_review_audit`, `candidate_identity_review_evidence`, `candidate_identity_review_requests`, `candidate_private_document_reviews`, `founder_command_catalog`, `founder_command_requests`, `founder_command_results`, `founder_daily_briefs`, `founder_decision_log`, `founder_escalation_threads`, `founder_mobile_cards`, `founder_operator_profiles`, `founder_ops_audit_events`, `founder_report_sections`, `founder_reports`, `founder_runtime_config`, and `founder_watchlist_items`. No-policy RLS is fail-closed for roles without RLS bypass; confirm intended service-role-only grants and do not add client policies as a linter-only response.
2. **Six SECURITY DEFINER functions** are executable by `authenticated` and not by `anon`: `get_candidate_cao_choices(uuid)`, `list_candidate_cao_parents()`, `prepare_candidate_application_from_master_target(text)`, `prepare_candidate_manual_portal_submission(uuid)`, `record_candidate_application_outcome(uuid,text,text,text,text,text)`, and `save_candidate_cao_choices(uuid,jsonb)`. Their live definitions were inspected. Each contains authentication/ownership or reviewer-role checks and uses a pinned search path; the five candidate workflow functions bind activity to the authenticated candidate and/or verified identity link, consent and approved match. The outcome function requires an active application reviewer, a verified same-application provider outcome notice, and verified submission evidence. These appear to be intentionally callable application RPCs, but require independent security review and authenticated positive/negative tests before release.
3. **Leaked-password protection is disabled** in Supabase Auth. This remains an open security hardening item and must be enabled and verified through approved project settings.

### Required next schema/security work

- Complete function-by-function review of the six authenticated SECURITY DEFINER RPCs, including their helper functions and execution ACLs.
- Run authenticated Candidate A/B tests against every candidate-scoped RPC and table; prove own-record success and cross-candidate denial.
- Run reviewer-role positive and negative tests, including non-reviewer denial for outcome recording and no ability to mutate candidate-owned records outside reviewed workflows.
- Revoke unnecessary anon/authenticated table grants from service-only catalogue/evidence tables through a reviewed migration; preserve the explicitly approved verified public-read policies on route tables and published listings.
- Keep the 17 no-policy tables backend-only; verify service-role access and ensure no authenticated client code relies on direct reads.
- Enable leaked-password protection after approved configuration change and capture resulting Auth settings evidence.
- Reconcile the overlapping provider, route, organisation, programme and evidence structures into the canonical institution/alias/campus/source-assertion design before drafting schema migrations. Do not write a new parallel institution table set until the existing foreign keys, callers, policies and data contracts have been mapped.

No schema changes, grants, policies, function ACLs, Auth settings, or seed records were modified by this inspection.
