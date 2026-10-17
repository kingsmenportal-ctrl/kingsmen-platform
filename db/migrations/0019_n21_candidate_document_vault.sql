-- 0019 - Private candidate document vault metadata
-- Object bytes belong in a private storage bucket; this table stores metadata only.
CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  display_name text NOT NULL,
  storage_provider text NOT NULL,
  storage_object_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 26214400),
  sha256_hex text,
  document_status text NOT NULL DEFAULT 'UPLOADED'
    CHECK (document_status IN ('UPLOADED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'ARCHIVED')),
  uploaded_by_auth_user_id uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  review_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_documents_type_check
    CHECK (document_type IN ('IDENTITY', 'ACADEMIC', 'CV', 'PROOF_OF_ADDRESS', 'FINANCIAL', 'CONSENT', 'OTHER')),
  CONSTRAINT candidate_documents_display_name_check
    CHECK (length(trim(display_name)) BETWEEN 1 AND 180),
  CONSTRAINT candidate_documents_content_type_check
    CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  CONSTRAINT candidate_documents_sha256_check
    CHECK (sha256_hex IS NULL OR sha256_hex ~ '^[a-fA-F0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_status
  ON public.candidate_documents(candidate_id, document_status, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_uploaded_by
  ON public.candidate_documents(uploaded_by_auth_user_id, uploaded_at DESC);

ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_documents_backend_all ON public.candidate_documents;
CREATE POLICY candidate_documents_backend_all ON public.candidate_documents
  FOR ALL
  USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

COMMENT ON TABLE public.candidate_documents IS
  'Private document metadata only. Storage objects must be private and addressed by opaque server-generated keys; never store public URLs or document bytes here.';
COMMENT ON COLUMN public.candidate_documents.storage_object_key IS
  'Opaque key created by a trusted backend storage adapter; not a client-selected path or a public URL.';
