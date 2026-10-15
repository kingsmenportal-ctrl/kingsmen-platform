-- 0025 - Explicit, trusted candidate identity binding
-- This function is an administrative provisioning primitive, not a public signup path.
-- Existing accounts are never matched or linked by email.
CREATE OR REPLACE FUNCTION kingsmen_security.bind_candidate_auth_user(
  p_candidate_id uuid,
  p_auth_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, kingsmen_security
AS $$
DECLARE
  v_existing_user_id uuid;
BEGIN
  IF p_candidate_id IS NULL OR p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Candidate identity binding requires both identifiers';
  END IF;

  -- Confirm the exact Auth identity and candidate account exist before binding.
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_auth_user_id) THEN
    RAISE EXCEPTION 'Auth identity not found';
  END IF;

  SELECT ca.auth_user_id
    INTO v_existing_user_id
    FROM public.candidate_accounts ca
    WHERE ca.candidate_id = p_candidate_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate account not found';
  END IF;

  -- Idempotent for the same pair; never silently replace a previously linked identity.
  IF v_existing_user_id = p_auth_user_id THEN
    RETURN;
  END IF;

  IF v_existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Candidate account is already linked';
  END IF;

  -- The unique constraint on auth_user_id prevents one Auth user being bound twice.
  UPDATE public.candidate_accounts
    SET auth_user_id = p_auth_user_id
    WHERE candidate_id = p_candidate_id
      AND auth_user_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate identity binding could not be completed';
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Auth identity is already linked to a candidate account';
END;
$$;

REVOKE ALL ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) TO service_role;

COMMENT ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) IS
  'Trusted provisioning only: binds an explicitly verified Auth user ID to a candidate ID; never matches by email.';
