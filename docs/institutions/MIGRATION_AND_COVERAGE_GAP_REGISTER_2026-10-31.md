# Institution migration reconciliation and coverage-gap register

Audit date: 2026-10-31. Read-only audit artifact; no staging writes authorized.

## Live staging findings
- 3 canonical route providers: `cao_official`, `labour_department_vacancies`, `nsfas_official`.
- 8 programme rows; zero marked OPEN.
- 2 candidates currently flagged active.
- `backup_restore_drills` has zero records.
- Latest ledger entry observed: `20261029193124 / candidate_self_service_profile_bootstrap_0095`.
- Migrations 0096–0098 and source imports 0099–0106 are not recorded in the staging ledger.
- CAO bridge structural objects exist in staging but migration provenance is unknown.
- Active-cap trigger/function/index for 0098 was absent in the prior read-only schema audit; the 500-active-candidate limit is not proven enforced.
- Duplicate migration names: `candidate_application_preparation_readiness_0078` at versions `20261019112452` and `20261019112511`; `seed_verified_labour_vacancy_deadlines_0093` at versions `20261029180632` and `20261029180642`.

## Migration reconciliation register
| Item | Finding | Required work | Gate |
|---|---|---|---|
| 0096 CAO bridge | Objects exist; provenance unknown | Compare SQL with live columns, constraints, RPC definitions, ownership, grants and SECURITY DEFINER search paths; produce drift report | Independent DB/security review |
| 0097 privileges | Not recorded in ledger | Compare table/function grants and RLS against least-privilege matrix; enforce RPC-only writes where intended | Security review |
| 0098 active cap | 2 active candidates; enforcement not proven | Verify concurrency-safe cap at 499/500/501 and concurrent activation/deactivation | Migration-owner review and tests |
| Duplicate 0078 | Same name at two versions | Compare exact SQL/checksums and execution effects; do not rewrite ledger speculatively | Approved provenance decision |
| Duplicate 0093 | Same name at two versions | Compare exact SQL, order and effects; determine authoritative migration | Approved provenance decision |
| 0099–0106 imports | Not recorded in ledger | Review dependencies, conflicts, source authorities and repeat-run behavior | Backup/restore, independent review and change approval |

## Coverage-gap register

### Existing live route-provider keys
- `cao_official` — Central Applications Office.
- `labour_department_vacancies` — Department of Employment and Labour vacancies.
- `nsfas_official` — National Student Financial Aid Scheme.

This is live staging coverage, not all seed records in Git. It does not prove current connector functionality. The exact national gap count is not yet established; do not infer it by subtracting three from national targets because seed migrations, aliases and overlapping categories require reconciliation.

### Official-source baselines to reconcile
- 26 public universities: https://www.education.gov.za/FurtherStudies/Universities.aspx
- 50 public TVET colleges: https://www.dhet.gov.za/SitePages/TVETlinks.aspx
- 9 Community Education and Training colleges (validate against current DHET source snapshot).
- 21 SETAs (validate against current official list).
- 9 provincial education departments.
- Public skills-development bodies, funding/application authorities, public agencies and employers/ SOEs from GCIS and National Treasury directories: https://www.gov.za/about-government/contact-directory/soe-s and https://www.treasury.gov.za/legislation/pfma/public%20entities/default.aspx
- Skills-development directory: https://www.gov.za/links/education-training-skills-development

For each class, report source snapshot date, expected count, canonical existing count, aliases merged, new keys, conflicts, missing official domains/profiles and unresolved identities. Do not count campuses, faculties or programmes as separate legal providers unless the model explicitly defines them as such.

## Idempotent import contract
1. Preflight schema, source-authority identities, unique keys, aliases and conflicts.
2. Preserve canonical `provider_key`; merge provenance and institution classes deterministically without overwriting stronger official identity/route/verification evidence.
3. Newly discovered entries remain fail-closed; directory membership never creates OPEN opportunities or connected routes.
4. Postflight reports inserted/merged/unchanged/rejected counts by source batch, class and province; repeated import must create no duplicates or lose evidence.
5. Keep institutions, opportunities, route connectivity, candidate-reported submissions, provider receipts and confirmed outcomes separate.
6. Validate RLS, grants and authenticated candidate A/B isolation.

## Candidate directory acceptance
- Directory listing is discovery metadata only.
- An opportunity may be marked OPEN only with current authoritative evidence, deadline/cutoff, eligibility and application instructions.
- Official web-page availability does not prove connector functionality.
- Candidate-reported submission, provider-confirmed receipt and provider-confirmed outcome are distinct states.

## Required order before staging writes
1. Encrypted backup in restricted storage and disposable restore drill with RPO/RTO, schema/row counts, checksums and founder signoff; no PII archives in Git.
2. Independent review of migration reconciliation and import SQL.
3. Formal change approval.
4. Controlled application of approved migrations/imports.
5. Postflight counts, provenance, grants/RLS, idempotence and candidate-directory tests.
6. Verify exact deployed commit and authenticated journey.

**Disposition: staging writes not approved.** The exact national coverage-gap count remains pending the per-class canonical reconciliation.