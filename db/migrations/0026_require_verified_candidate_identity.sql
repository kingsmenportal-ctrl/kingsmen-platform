-- 0026 - Require verified Auth identity before trusted candidate binding
-- Staging-first hardening: the provisioning RPC must reject unverified Auth users.
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
  v_email_confirmed_at timestamptz;
BEGIN
  IF p_candidate_id IS NULL OR p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Candidate identity binding requires both identifiers';
  END IF;

  SELECT u.email_confirmed_at
    INTO v_email_confirmed_at
    FROM auth.users u
    WHERE u.id = p_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth identity not found';
  END IF;

  IF v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Auth identity must have a verified email before candidate binding';
  END IF;

  SELECT ca.auth_user_id
    INTO v_existing_user_id
    FROM public.candidate_accounts ca
    WHERE ca.candidate_id = p_candidate_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate account not found';
  END IF;

  IF v_existing_user_id = p_auth_user_id THEN
    RETURN;
  END IF;

  IF v_existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Candidate account is already linked';
  END IF;

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
  'Trusted provisioning only: binds a verified Auth user ID to a candidate ID; requires confirmed email, never matches by email, and cannot reassign a linked candidate.';
