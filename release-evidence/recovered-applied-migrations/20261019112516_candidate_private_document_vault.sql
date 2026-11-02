-- Private candidate document vault: metadata, ownership, and review-state boundary.
-- Storage remains private; upload/read access is issued only by authenticated server routes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kingsmen-candidate-documents',
  'kingsmen-candidate-documents',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png']::text[];

CREATE TABLE IF NOT EXISTS public.candidate_private_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  preparation_item_id uuid,
  storage_bucket text NOT NULL DEFAULT 'kingsmen-candidate-documents'
    CHECK (storage_bucket = 'kingsmen-candidate-documents'),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL CHECK (length(trim(original_filename)) BETWEEN 1 AND 180),
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf','image/jpeg','image/png')),
  size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  sha256_hex text CHECK (sha256_hex IS NULL OR sha256_hex ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'UPLOAD_PENDING'
    CHECK (status IN ('UPLOAD_PENDING','UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW','VERIFIED','REJECTED','UPLOAD_FAILED')),
  uploaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_private_documents_preparation_owner_fk
    FOREIGN KEY (preparation_item_id, candidate_id)
    REFERENCES public.candidate_application_preparation_items(id, candidate_id) ON DELETE SET NULL (preparation_item_id)
);
CREATE INDEX IF NOT EXISTS candidate_private_documents_owner_time_idx
  ON public.candidate_private_documents(candidate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.candidate_private_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.candidate_private_documents(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('CANDIDATE','REVIEWER','SYSTEM')),
  event_type text NOT NULL CHECK (event_type IN ('UPLOAD_REQUESTED','UPLOAD_CONFIRMED','UPLOAD_FAILED','READ_LINK_ISSUED','REVIEW_STATUS_CHANGED')),
  from_status text,
  to_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(metadata::text) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS candidate_private_document_events_owner_time_idx
  ON public.candidate_private_document_events(candidate_id, created_at DESC);

ALTER TABLE public.candidate_private_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_private_document_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_private_documents_read_own ON public.candidate_private_documents;
CREATE POLICY candidate_private_documents_read_own ON public.candidate_private_documents
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_private_document_events_read_own ON public.candidate_private_document_events;
CREATE POLICY candidate_private_document_events_read_own ON public.candidate_private_document_events
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));
GRANT SELECT ON public.candidate_private_documents, public.candidate_private_document_events TO authenticated;
REVOKE ALL ON public.candidate_private_documents, public.candidate_private_document_events FROM anon;

-- Defence in depth for direct authenticated storage access. Signed URLs remain time-limited.
DROP POLICY IF EXISTS kingsmen_candidate_documents_read_own ON storage.objects;
CREATE POLICY kingsmen_candidate_documents_read_own ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'kingsmen-candidate-documents'
    AND (storage.foldername(name))[1] = (SELECT public.current_verified_candidate_id())::text
  );
DROP POLICY IF EXISTS kingsmen_candidate_documents_insert_own ON storage.objects;
CREATE POLICY kingsmen_candidate_documents_insert_own ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'kingsmen-candidate-documents'
    AND (storage.foldername(name))[1] = (SELECT public.current_verified_candidate_id())::text
  );
DROP POLICY IF EXISTS kingsmen_candidate_documents_update_own ON storage.objects;
CREATE POLICY kingsmen_candidate_documents_update_own ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'kingsmen-candidate-documents'
    AND (storage.foldername(name))[1] = (SELECT public.current_verified_candidate_id())::text
  ) WITH CHECK (
    bucket_id = 'kingsmen-candidate-documents'
    AND (storage.foldername(name))[1] = (SELECT public.current_verified_candidate_id())::text
  );
