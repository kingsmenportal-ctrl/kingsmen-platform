-- 0024 - Authenticated candidate read access for applications and document metadata
-- Writes to applications and document metadata remain backend-owned.

DROP POLICY IF EXISTS applications_authenticated_own_account_read ON public.applications;
CREATE POLICY applications_authenticated_own_account_read
  ON public.applications
  FOR SELECT TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id());

DROP POLICY IF EXISTS document_files_authenticated_own_account_read ON public.document_files;
CREATE POLICY document_files_authenticated_own_account_read
  ON public.document_files
  FOR SELECT TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id());
