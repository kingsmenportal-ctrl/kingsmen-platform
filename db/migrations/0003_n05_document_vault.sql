-- N05 - Document Vault
-- Documents are private candidate evidence, not public files.

CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  document_ref text UNIQUE NOT NULL,
  document_type text NOT NULL,
  display_name text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  storage_provider text NOT NULL DEFAULT 'LOCAL_OR_SUPABASE',
  storage_bucket text NOT NULL DEFAULT 'candidate-documents',
  storage_path text NOT NULL,
  protected_data boolean NOT NULL DEFAULT true,
  source_channel text NOT NULL DEFAULT 'PORTAL',
  document_status text NOT NULL DEFAULT 'UPLOADED',
  verification_status text NOT NULL DEFAULT 'PENDING',
  extraction_status text NOT NULL DEFAULT 'NOT_STARTED',
  source_confidence_band text NOT NULL DEFAULT 'C',
  evidence_ref text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT document_files_type_check CHECK (
    document_type IN (
      'CV',
      'ID_DOCUMENT',
      'MATRIC_CERTIFICATE',
      'ACADEMIC_RECORD',
      'PROOF_OF_ADDRESS',
      'BANK_LETTER',
      'PARENT_GUARDIAN_ID',
      'PAYSLIP',
      'AFFIDAVIT',
      'APPLICATION_PROOF',
      'NSFAS_DOCUMENT',
      'OTHER'
    )
  ),
  CONSTRAINT document_files_status_check CHECK (
    document_status IN ('UPLOADED', 'PROCESSING', 'READY', 'REJECTED', 'ARCHIVED', 'DELETED')
  ),
  CONSTRAINT document_files_verification_check CHECK (
    verification_status IN ('PENDING', 'VERIFIED', 'REVIEW_REQUIRED', 'REJECTED', 'EXPIRED')
  ),
  CONSTRAINT document_files_extraction_check CHECK (
    extraction_status IN ('NOT_STARTED', 'EXTRACTING', 'EXTRACTED', 'FAILED', 'REVIEW_REQUIRED')
  ),
  CONSTRAINT document_files_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT document_files_source_channel_check CHECK (
    source_channel IN ('PORTAL', 'EMAIL', 'OPERATOR', 'IMPORT', 'WHATSAPP_URGENT')
  )
);

CREATE TABLE IF NOT EXISTS document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_ref text UNIQUE NOT NULL,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  reason text NOT NULL,
  requirement_source text NOT NULL DEFAULT 'KINGSMEN',
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  priority text NOT NULL DEFAULT 'NORMAL',
  request_status text NOT NULL DEFAULT 'OPEN',
  due_at timestamptz,
  fulfilled_by_document_id uuid REFERENCES document_files(id) ON DELETE SET NULL,
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  CONSTRAINT document_requests_priority_check CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT document_requests_status_check CHECK (
    request_status IN ('OPEN', 'FULFILLED', 'WAIVED', 'CANCELLED', 'EXPIRED')
  ),
  CONSTRAINT document_requests_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS document_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
  analysis_ref text UNIQUE NOT NULL,
  analysis_type text NOT NULL,
  engine_name text NOT NULL DEFAULT 'rules_plus_ai_assist',
  analysis_status text NOT NULL DEFAULT 'PENDING',
  extracted_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_text_summary text NOT NULL DEFAULT '',
  confidence_band text NOT NULL DEFAULT 'LOW',
  candidate_review_required boolean NOT NULL DEFAULT true,
  operator_review_required boolean NOT NULL DEFAULT false,
  evidence_ref text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT document_analysis_type_check CHECK (
    analysis_type IN ('OCR_TEXT', 'CV_PROFILE_EXTRACTION', 'IDENTITY_EXTRACTION', 'ACADEMIC_EXTRACTION', 'ADDRESS_EXTRACTION', 'READINESS_CHECK')
  ),
  CONSTRAINT document_analysis_status_check CHECK (
    analysis_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED')
  ),
  CONSTRAINT document_analysis_confidence_check CHECK (
    confidence_band IN ('LOW', 'MEDIUM', 'HIGH', 'REVIEW_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS document_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
  verification_ref text UNIQUE NOT NULL,
  verification_type text NOT NULL,
  verification_status text NOT NULL DEFAULT 'PENDING',
  result_summary text NOT NULL DEFAULT '',
  checked_by text NOT NULL DEFAULT 'SYSTEM',
  confidence_band text NOT NULL DEFAULT 'C',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT document_verifications_type_check CHECK (
    verification_type IN ('FILE_INTEGRITY', 'TYPE_MATCH', 'IDENTITY_MATCH', 'EXPIRY_CHECK', 'ACADEMIC_MATCH', 'SOURCE_MATCH', 'MANUAL_REVIEW')
  ),
  CONSTRAINT document_verifications_status_check CHECK (
    verification_status IN ('PENDING', 'PASSED', 'FAILED', 'REVIEW_REQUIRED', 'WAIVED')
  ),
  CONSTRAINT document_verifications_confidence_check CHECK (
    confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS document_fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
  flag_ref text UNIQUE NOT NULL,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'LOW',
  status text NOT NULL DEFAULT 'OPEN',
  summary text NOT NULL,
  evidence_ref text,
  created_by text NOT NULL DEFAULT 'SYSTEM',
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  CONSTRAINT document_fraud_flags_type_check CHECK (
    flag_type IN ('DUPLICATE_FILE', 'MISMATCHED_IDENTITY', 'TAMPER_SIGNAL', 'UNREADABLE', 'EXPIRED', 'INCONSISTENT_RESULTS', 'SUSPICIOUS_METADATA', 'OTHER')
  ),
  CONSTRAINT document_fraud_flags_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  CONSTRAINT document_fraud_flags_status_check CHECK (
    status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE', 'ESCALATED')
  )
);

CREATE TABLE IF NOT EXISTS document_storage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES document_files(id) ON DELETE SET NULL,
  event_ref text UNIQUE NOT NULL,
  event_type text NOT NULL,
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  status text NOT NULL DEFAULT 'OK',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT document_storage_events_type_check CHECK (
    event_type IN ('SIGNED_UPLOAD_CREATED', 'UPLOAD_COMPLETED', 'CHECKSUM_RECORDED', 'FILE_ACCESSED', 'ARCHIVED', 'DELETED', 'RETENTION_CHECK')
  ),
  CONSTRAINT document_storage_events_status_check CHECK (
    status IN ('OK', 'WARNING', 'FAILED')
  )
);

CREATE TABLE IF NOT EXISTS document_readiness_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  snapshot_ref text UNIQUE NOT NULL,
  readiness_status text NOT NULL DEFAULT 'MISSING',
  missing_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  ready_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_required_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL,
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_readiness_status_check CHECK (
    readiness_status IN ('MISSING', 'PARTIAL', 'READY', 'REVIEW_REQUIRED')
  )
);

CREATE INDEX IF NOT EXISTS idx_document_files_candidate ON document_files(candidate_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_files_application ON document_files(application_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_files_type ON document_files(document_type);
CREATE INDEX IF NOT EXISTS idx_document_files_status ON document_files(document_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_document_requests_candidate ON document_requests(candidate_id, request_status);
CREATE INDEX IF NOT EXISTS idx_document_requests_application ON document_requests(application_id, request_status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_document ON document_analysis(document_id, analysis_status);
CREATE INDEX IF NOT EXISTS idx_document_verifications_document ON document_verifications(document_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_document_fraud_flags_document ON document_fraud_flags(document_id, status);
CREATE INDEX IF NOT EXISTS idx_document_storage_events_document ON document_storage_events(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_readiness_candidate ON document_readiness_snapshots(candidate_id, created_at DESC);

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_storage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_readiness_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_document_files ON document_files;
CREATE POLICY service_role_all_document_files ON document_files TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_requests ON document_requests;
CREATE POLICY service_role_all_document_requests ON document_requests TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_analysis ON document_analysis;
CREATE POLICY service_role_all_document_analysis ON document_analysis TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_verifications ON document_verifications;
CREATE POLICY service_role_all_document_verifications ON document_verifications TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_fraud_flags ON document_fraud_flags;
CREATE POLICY service_role_all_document_fraud_flags ON document_fraud_flags TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_storage_events ON document_storage_events;
CREATE POLICY service_role_all_document_storage_events ON document_storage_events TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_document_readiness_snapshots ON document_readiness_snapshots;
CREATE POLICY service_role_all_document_readiness_snapshots ON document_readiness_snapshots TO service_role
  FOR ALL USING (true) WITH CHECK (true);