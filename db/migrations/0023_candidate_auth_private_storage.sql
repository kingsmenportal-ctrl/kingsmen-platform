-- 0023 - Candidate identity binding and private document storage
-- Staging-first. Existing candidate accounts remain unlinked until an authenticated
-- provisioning flow explicitly binds auth_user_id; no email-based auto-linking is allowed.

ALTER TABLE public.candidate_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS candidate_accounts_auth_user_id_idx
  ON public.candidate_accounts (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION kingsmen_security.current_authenticated_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT ca.candidate_id
  FROM public.candidate_accounts AS ca
  WHERE ca.auth_user_id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION kingsmen_security.current_authenticated_candidate_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION kingsmen_security.current_authenticated_candidate_id() TO authenticated;

DROP POLICY IF EXISTS candidates_authenticated_own_account_read ON public.candidates;
CREATE POLICY candidates_authenticated_own_account_read
  ON public.candidates
  FOR SELECT TO authenticated
  USING (id = kingsmen_security.current_authenticated_candidate_id());

DROP POLICY IF EXISTS candidate_profiles_authenticated_own_account_read ON public.candidate_profiles;
CREATE POLICY candidate_profiles_authenticated_own_account_read
  ON public.candidate_profiles
  FOR SELECT TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id());

DROP POLICY IF EXISTS candidate_profiles_authenticated_own_account_update ON public.candidate_profiles;
CREATE POLICY candidate_profiles_authenticated_own_account_update
  ON public.candidate_profiles
  FOR UPDATE TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id())
  WITH CHECK (candidate_id = kingsmen_security.current_authenticated_candidate_id());

-- Grant only editable profile columns; review status, confidence and evidence stay backend-owned.
REVOKE UPDATE ON public.candidate_profiles FROM authenticated;
GRANT UPDATE (province, city, highest_grade, qualification_summary, work_summary)
  ON public.candidate_profiles TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760,
  ARRAY['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS candidate_documents_select_own ON storage.objects;
CREATE POLICY candidate_documents_select_own
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS candidate_documents_insert_own ON storage.objects;
CREATE POLICY candidate_documents_insert_own
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS candidate_documents_delete_own ON storage.objects;
CREATE POLICY candidate_documents_delete_own
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- No public access, anonymous access, or candidate update/upsert policy is granted.
