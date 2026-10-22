-- Keep the candidate identity helper unavailable as a public PostgREST RPC.
-- ALTER FUNCTION SET SCHEMA preserves policy dependencies by function OID; existing
-- candidate-owned RLS and Storage policies continue to call the same implementation.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    CREATE SCHEMA private;
  END IF;
END
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.current_verified_candidate_id() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.current_verified_candidate_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_verified_candidate_id() TO authenticated;

COMMENT ON FUNCTION private.current_verified_candidate_id() IS
  'Returns the candidate ID linked to auth.uid() only when the identity link is VERIFIED and verified_at is set. Internal RLS helper; intentionally outside PostgREST exposed schemas.';
