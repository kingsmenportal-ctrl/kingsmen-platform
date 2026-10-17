-- PROPOSED ONLY — DO NOT APPLY DIRECTLY TO STAGING OR PRODUCTION.
-- Date: 2026-10-17
-- Purpose: candidate identity resolver for Phase B review.
--
-- IMPORTANT PRECONDITIONS:
-- 1. Reconcile db/migrations/ numbering with the timestamped Supabase migration history.
-- 2. Complete and retain the required logical backup + isolated restore evidence.
-- 3. Review the existing public.candidate_accounts mapping and all callers of
--    kingsmen_security.current_authenticated_candidate_id(); do not silently replace it.
-- 4. Apply only through the repository's approved migration/deployment path after review.
-- 5. This file intentionally does not rewrite table policies: the existing saved
--    tables are keyed by auth.users UUID in user_id, while documents use candidate_id.
--    A separate, reviewed data migration is required before changing those contracts.

begin;

create schema if not exists private;

create or replace function private.own_candidate_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $function$
  select c.id
  from public.candidate_auth_identity_links as link
  join public.candidates as c
    on c.id = link.candidate_id
  where link.supabase_user_id = (select auth.uid())
    and link.link_status = 'VERIFIED'
    and link.verified_at is not null
    and c.is_active is true
  limit 1
$function$;

comment on function private.own_candidate_id() is
  'Returns the active candidate UUID for the current authenticated user only when an explicitly verified identity link exists. Returns NULL when no verified active link exists.';

revoke all on function private.own_candidate_id() from public;
revoke all on function private.own_candidate_id() from anon;
grant execute on function private.own_candidate_id() to authenticated;
grant execute on function private.own_candidate_id() to service_role;

commit;

-- REQUIRED REVIEW / TESTS BEFORE THIS PROPOSAL MAY BE PROMOTED:
-- * Verify private schema USAGE and function owner/security-definer grants.
-- * Confirm the function owner can read the two underlying tables without granting
--   direct authenticated access to candidate_auth_identity_links.
-- * Add a uniqueness assertion for the result even though the live schema currently
--   has UNIQUE(supabase_user_id) and UNIQUE(candidate_id).
-- * Candidate A and B: verified links resolve to their own candidate UUID only.
-- * Pending/revoked/no-link/inactive candidate -> NULL.
-- * No email/public_ref/client-supplied UUID fallback.
-- * Test via authenticated JWTs, not a SQL editor session whose auth.uid() is NULL.
-- * Review all permissive policies on candidates: permissive policies combine with OR.
-- * Do not switch candidate_saved_listings, candidate_saved_routes, or
--   candidate_route_applications from user_id=auth.uid() to candidate_id until a
--   compatibility/backfill plan exists and all API/web callers have been migrated.
-- * Do not alter document_files policy until this resolver is compared against the
--   existing kingsmen_security.current_authenticated_candidate_id() and
--   candidate_accounts mappings; require an explicit conflict-resolution policy.
-- * Rollback plan: drop only this function after dependent policy references are absent.
