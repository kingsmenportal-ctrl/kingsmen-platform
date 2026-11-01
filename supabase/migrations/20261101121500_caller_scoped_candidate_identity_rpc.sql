-- Canonical caller identity source for API and RLS.
-- candidate_auth_identity_links is the authoritative verified binding. Refuse
-- to install these helpers unless both sides of the one-to-one relationship
-- are protected by database UNIQUE constraints.
DO $identity_constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.candidate_auth_identity_links'::regclass
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname ORDER BY k.ordinality)
        FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
      ) = ARRAY['candidate_id']::name[]
  ) THEN
    RAISE EXCEPTION 'CANDIDATE_IDENTITY_ONE_CANDIDATE_UNIQUE_CONSTRAINT_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.candidate_auth_identity_links'::regclass
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname ORDER BY k.ordinality)
        FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
      ) = ARRAY['supabase_user_id']::name[]
  ) THEN
    RAISE EXCEPTION 'CANDIDATE_IDENTITY_ONE_USER_UNIQUE_CONSTRAINT_REQUIRED';
  END IF;
END;
$identity_constraints$;

-- This helper is used by candidate RLS policies and existing authenticated
-- candidate RPCs. Keep its authority identical to the API's identity resolver.
CREATE OR REPLACE FUNCTION kingsmen_security.current_authenticated_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT link.candidate_id
  FROM public.candidate_auth_identity_links AS link
  WHERE link.supabase_user_id = (SELECT auth.uid())
    AND link.link_status = 'VERIFIED'
    AND link.verified_at IS NOT NULL
    AND link.verified_at <= now()
    AND NULLIF(BTRIM(link.verified_by), '') IS NOT NULL
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION kingsmen_security.current_authenticated_candidate_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION kingsmen_security.current_authenticated_candidate_id() FROM anon;
GRANT EXECUTE ON FUNCTION kingsmen_security.current_authenticated_candidate_id() TO authenticated;

-- The older candidate_id RLS helper used a candidate_public_ref app_metadata
-- claim. Delegate it to the same database-verified identity link instead so
-- overlapping policies cannot authorise a second, inconsistent candidate.
CREATE OR REPLACE FUNCTION kingsmen_security.current_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT kingsmen_security.current_authenticated_candidate_id()
$function$;

REVOKE ALL ON FUNCTION kingsmen_security.current_candidate_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION kingsmen_security.current_candidate_id() FROM anon;
GRANT EXECUTE ON FUNCTION kingsmen_security.current_candidate_id() TO authenticated, service_role;

-- Public RPC for API callers. It accepts no identity parameter and reveals only
-- the verified link derived from auth.uid(). The base table remains backend-only.
CREATE OR REPLACE FUNCTION public.resolve_my_candidate_identity()
RETURNS TABLE (candidate_id uuid, link_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT link.candidate_id, link.link_status
  FROM public.candidate_auth_identity_links AS link
  WHERE link.supabase_user_id = (SELECT auth.uid())
    AND link.link_status = 'VERIFIED'
    AND link.verified_at IS NOT NULL
    AND link.verified_at <= now()
    AND NULLIF(BTRIM(link.verified_by), '') IS NOT NULL
    AND (
      SELECT count(*)
      FROM public.candidate_auth_identity_links AS all_links
      WHERE all_links.supabase_user_id = (SELECT auth.uid())
    ) = 1
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION public.resolve_my_candidate_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_my_candidate_identity() FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_my_candidate_identity() TO authenticated;
