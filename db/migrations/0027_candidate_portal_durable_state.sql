-- 0027 - Authenticated durable Apply-Now state
-- State is scoped to the verified Auth subject. Documents remain in the private bucket.
CREATE TABLE IF NOT EXISTS public.candidate_portal_state (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_portal_state_object CHECK (jsonb_typeof(state) = 'object')
);

ALTER TABLE public.candidate_portal_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_portal_state FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_portal_state_select_own ON public.candidate_portal_state;
CREATE POLICY candidate_portal_state_select_own ON public.candidate_portal_state
  FOR SELECT TO authenticated USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS candidate_portal_state_insert_own ON public.candidate_portal_state;
CREATE POLICY candidate_portal_state_insert_own ON public.candidate_portal_state
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS candidate_portal_state_update_own ON public.candidate_portal_state;
CREATE POLICY candidate_portal_state_update_own ON public.candidate_portal_state
  FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

REVOKE ALL ON public.candidate_portal_state FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.candidate_portal_state TO authenticated;

CREATE OR REPLACE FUNCTION public.set_candidate_portal_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidate_portal_state_updated_at ON public.candidate_portal_state;
CREATE TRIGGER candidate_portal_state_updated_at
  BEFORE UPDATE ON public.candidate_portal_state
  FOR EACH ROW EXECUTE FUNCTION public.set_candidate_portal_state_updated_at();

COMMENT ON TABLE public.candidate_portal_state IS
  'Private candidate Apply-Now state. RLS restricts each row to the matching verified Supabase Auth user; document bytes belong in private Storage.';
