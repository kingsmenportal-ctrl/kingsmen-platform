# Proposed security migration — verified Auth-to-candidate binding

**Status: PROPOSAL ONLY — NOT IN AN ACTIVE MIGRATION DIRECTORY, NOT APPLIED**

**Target:** Supabase staging project `euhubhhnumtibbyufghm`  
**Observed:** 2026-11-19

## Finding

The live helper currently returns the candidate ID from `public.candidate_accounts` where `auth_user_id = auth.uid()`. It does not require a matching `public.candidate_auth_identity_links` row with a verified status. Staging currently has zero `candidate_accounts` rows, so the proposed fix must use the canonical identity-link table directly rather than joining the legacy accounts table. The helper is used by RLS policies for `candidate_master_profiles` and `candidate_master_application_targets`, and by two `SECURITY DEFINER` application-preparation RPCs.

The live counts at review time were 0 `candidate_accounts` rows and 0 `candidate_auth_identity_links` rows. This is a latent access-control defect, not evidence that current candidate rows are exposed. The fix must be tested before new account rows are provisioned.

## Proposed forward-only change

This is the proposed function replacement; it is deliberately stored in documentation, not `db/migrations/` or `supabase/migrations/`. Do not move it into an executable migration or apply it until the migration-source, backup/restore, reviewer and disposable-database gates are satisfied.

```sql
BEGIN;

CREATE OR REPLACE FUNCTION kingsmen_security.current_authenticated_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT link.candidate_id
  FROM public.candidate_auth_identity_links AS link
  JOIN public.candidates AS candidate
    ON candidate.id = link.candidate_id
  WHERE link.supabase_user_id = auth.uid()
    AND link.link_status = 'VERIFIED'
    AND link.verified_at IS NOT NULL
    AND link.verified_at <= pg_catalog.now()
    AND link.verified_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}
$function$;

COMMIT;
```

This replacement intentionally leaves the helper's function signature, execution context and existing ACL unchanged. It does not add direct table grants, create or auto-verify a link, or match candidates by email.

## Required tests in a disposable database

1. No account row: the helper returns `NULL`.
2. Matching account plus `PENDING` link: returns `NULL`.
3. Matching account plus `REVOKED` link: returns `NULL`, even if historical verification fields remain.
4. Matching account plus a `VERIFIED` link with non-null `verified_at` and non-empty `verified_by`: returns exactly that candidate ID.
5. Account/link candidate mismatch or user mismatch: returns `NULL`.
6. Candidate A cannot select, insert or update Candidate B's master profile or application target, and cannot prepare Candidate B's parent application or manual portal submission.
7. The application-preparation RPCs fail closed for pending/revoked links and do not create applications or submission jobs.
8. Existing reviewer/service-role workflows remain functional; function ACLs and search path remain unchanged.
9. Run the above in a disposable database with synthetic IDs inside a rollback transaction, then repeat the isolation checks through the authenticated application API. Do not create test identities or fixture rows in the live staging database for this test.

## Why it is not applied now

The 130-entry live migration ledger still has 26 entries without direct source filename matches; the duplicated `0093` bodies are not independently proven identical. There is no recorded backup/restore drill. The intended change must be assigned an approved forward-only migration identifier only after the source reconciliation and reviewer sign-off. Never modify the live ledger to manufacture historical provenance.

  LIMIT 1
$function$;

COMMIT;
```

This replacement intentionally leaves the helper's function signature, execution context and existing ACL unchanged. It does not add direct table grants, create or auto-verify a link, or match candidates by email.

## Required tests in a disposable database

1. No account row: the helper returns `NULL`.
2. Matching account plus `PENDING` link: returns `NULL`.
3. Matching account plus `REVOKED` link: returns `NULL`, even if historical verification fields remain.
4. Matching account plus a `VERIFIED` link with non-null `verified_at` and non-empty `verified_by`: returns exactly that candidate ID.
5. Account/link candidate mismatch or user mismatch: returns `NULL`.
6. Candidate A cannot select, insert or update Candidate B's master profile or application target, and cannot prepare Candidate B's parent application or manual portal submission.
7. The application-preparation RPCs fail closed for pending/revoked links and do not create applications or submission jobs.
8. Existing reviewer/service-role workflows remain functional; function ACLs and search path remain unchanged.
9. Run the above in a disposable database with synthetic IDs inside a rollback transaction, then repeat the isolation checks through the authenticated application API. Do not create test identities or fixture rows in the live staging database for this test.

## Why it is not applied now

The 130-entry live migration ledger still has 26 entries without direct source filename matches; the duplicated `0093` bodies are not independently proven identical. There is no recorded backup/restore drill. The intended change must be assigned an approved forward-only migration identifier only after the source reconciliation and reviewer sign-off. Never modify the live ledger to manufacture historical provenance.
