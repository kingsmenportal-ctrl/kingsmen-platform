-- N04 runtime hardening: explicit auth identity link + append-only profile access evidence.
-- Additive and idempotent. Apply through the approved migration process; this file is not self-applied.
ALTER TABLE public.candidate_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_accounts_auth_user_id
  ON public.candidate_accounts(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.candidate_profile_access_audit (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  actor_auth_user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_ref text,
  outcome text NOT NULL DEFAULT 'RECORDED',
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_profile_access_action_check CHECK (
    action IN ('PROFILE_VIEW', 'IDENTITY_VIEW', 'CORRECTION_REQUEST', 'CORRECTION_LIST_VIEW')
  ),
  CONSTRAINT candidate_profile_access_outcome_check CHECK (
    outcome IN ('RECORDED', 'DENIED', 'FAILED')
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_profile_access_candidate_time
  ON public.candidate_profile_access_audit(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_profile_access_actor_time
  ON public.candidate_profile_access_audit(actor_auth_user_id, created_at DESC);

ALTER TABLE public.candidate_profile_access_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all_candidate_profile_access_audit ON public.candidate_profile_access_audit;
CREATE POLICY service_role_all_candidate_profile_access_audit
  ON public.candidate_profile_access_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.prevent_candidate_profile_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'candidate profile audit events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS candidate_profile_audit_no_update ON public.candidate_profile_access_audit;
CREATE TRIGGER candidate_profile_audit_no_update
  BEFORE UPDATE OR DELETE ON public.candidate_profile_access_audit
  FOR EACH ROW EXECUTE FUNCTION public.prevent_candidate_profile_audit_mutation();

COMMENT ON TABLE public.candidate_profile_access_audit IS
  'Append-only privacy access evidence for candidate profile and identity operations. No raw profile values are stored.';