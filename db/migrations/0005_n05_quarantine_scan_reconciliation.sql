-- N05 Batch 3: persisted quarantine, malware scan lifecycle, retries and cleanup reconciliation.
-- This migration intentionally keeps all documents unreadable until a configured scanner returns CLEAN.
-- Applying this migration does not activate any scanner provider; N05_MALWARE_SCANNER_URL must be explicitly configured.

ALTER TABLE public.document_files
  ADD COLUMN IF NOT EXISTS malware_scan_status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS quarantine_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS malware_scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS malware_scanner_provider text,
  ADD COLUMN IF NOT EXISTS malware_scanner_version text,
  ADD COLUMN IF NOT EXISTS malware_scan_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS malware_scan_last_error text,
  ADD COLUMN IF NOT EXISTS malware_scan_next_attempt_at timestamptz;

ALTER TABLE public.document_files
  DROP CONSTRAINT IF EXISTS document_files_status_check;
ALTER TABLE public.document_files
  ADD CONSTRAINT document_files_status_check CHECK (
    document_status IN ('UPLOADED', 'QUARANTINED', 'SCANNING', 'PROCESSING', 'READY', 'REJECTED', 'ARCHIVED', 'DELETED')
  );
ALTER TABLE public.document_files
  DROP CONSTRAINT IF EXISTS document_files_malware_scan_status_check;
ALTER TABLE public.document_files
  ADD CONSTRAINT document_files_malware_scan_status_check CHECK (
    malware_scan_status IN ('PENDING', 'SCANNING', 'CLEAN', 'INFECTED', 'ERROR', 'NOT_REQUIRED')
  );
ALTER TABLE public.document_files
  DROP CONSTRAINT IF EXISTS document_files_malware_scan_attempts_check;
ALTER TABLE public.document_files
  ADD CONSTRAINT document_files_malware_scan_attempts_check CHECK (malware_scan_attempts >= 0);

-- Existing rows are not implicitly trusted. The application read route also fails closed unless CLEAN + READY.
UPDATE public.document_files
SET malware_scan_status = 'PENDING',
    document_status = CASE
      WHEN document_status IN ('UPLOADED', 'PROCESSING', 'READY') THEN 'QUARANTINED'
      ELSE document_status
    END,
    quarantine_started_at = COALESCE(quarantine_started_at, uploaded_at)
WHERE malware_scan_status IS DISTINCT FROM 'CLEAN'
  AND document_status IN ('UPLOADED', 'PROCESSING', 'READY');

CREATE TABLE IF NOT EXISTS public.document_scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_ref text UNIQUE NOT NULL,
  document_id uuid NOT NULL REFERENCES public.document_files(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  checksum_sha256 text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  mime_type text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  leased_at timestamptz,
  last_error_code text,
  last_error_message text,
  scanner_provider text,
  scanner_version text,
  scanner_result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  reconciled_at timestamptz,
  CONSTRAINT document_scan_jobs_status_check CHECK (
    status IN ('QUEUED', 'LEASED', 'RETRY_WAIT', 'CLEAN', 'INFECTED', 'DEAD_LETTER', 'CANCELLED')
  ),
  CONSTRAINT document_scan_jobs_result_check CHECK (
    scanner_result IS NULL OR scanner_result IN ('CLEAN', 'INFECTED', 'ERROR')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_scan_jobs_one_live_job
  ON public.document_scan_jobs(document_id)
  WHERE status IN ('QUEUED', 'LEASED', 'RETRY_WAIT');
CREATE INDEX IF NOT EXISTS idx_document_scan_jobs_claim
  ON public.document_scan_jobs(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_document_files_scan_reconcile
  ON public.document_files(malware_scan_status, quarantine_started_at)
  WHERE archived_at IS NULL;

-- Preserve audit history for queueing, scanning, rejection, retries and cleanup reconciliation.
ALTER TABLE public.document_storage_events
  DROP CONSTRAINT IF EXISTS document_storage_events_type_check;
ALTER TABLE public.document_storage_events
  ADD CONSTRAINT document_storage_events_type_check CHECK (
    event_type IN (
      'SIGNED_UPLOAD_CREATED', 'UPLOAD_COMPLETED', 'CHECKSUM_RECORDED', 'FILE_ACCESSED',
      'ARCHIVED', 'DELETED', 'RETENTION_CHECK', 'MALWARE_SCAN_QUEUED', 'MALWARE_SCAN_STARTED',
      'MALWARE_SCAN_CLEAN', 'MALWARE_SCAN_INFECTED', 'MALWARE_SCAN_FAILED',
      'QUARANTINE_CLEANUP_PENDING', 'QUARANTINE_CLEANUP_COMPLETED', 'SCAN_RECONCILIATION'
    )
  );

-- Restrict every N05 table's permissive historical policy to server-side service_role only.
DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'document_files', 'document_requests', 'document_analysis', 'document_verifications',
    'document_fraud_flags', 'document_storage_events', 'document_readiness_snapshots'
  ]
  LOOP
    policy_name := 'service_role_all_' || table_name;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I TO service_role FOR ALL USING (true) WITH CHECK (true)',
      policy_name, table_name
    );
  END LOOP;
END $$;

ALTER TABLE public.document_scan_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all_document_scan_jobs ON public.document_scan_jobs;
CREATE POLICY service_role_all_document_scan_jobs ON public.document_scan_jobs
  TO service_role FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.document_scan_jobs IS
  'Server-only durable malware scan queue. No document is releasable until scanner result CLEAN is persisted.';
COMMENT ON COLUMN public.document_files.malware_scan_status IS
  'PENDING/SCANNING/ERROR remain quarantined; only CLEAN permits the owner read route to issue a signed URL.';
