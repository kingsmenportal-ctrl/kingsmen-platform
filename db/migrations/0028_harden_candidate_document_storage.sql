-- 0028 - Enforce private candidate document bucket configuration
-- Correct pre-existing bucket configuration as well as newly provisioned environments.
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
WHERE id = 'candidate-documents';

DROP POLICY IF EXISTS candidate_documents_select_own ON storage.objects;
CREATE POLICY candidate_documents_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS candidate_documents_insert_own ON storage.objects;
CREATE POLICY candidate_documents_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS candidate_documents_delete_own ON storage.objects;
CREATE POLICY candidate_documents_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS candidate_documents_update_own ON storage.objects;
DROP POLICY IF EXISTS candidate_documents_update_own ON storage.objects;

COMMENT ON TABLE storage.objects IS
  'Storage object access is policy-controlled; candidate-documents must remain private and folder-scoped by authenticated user ID.';
