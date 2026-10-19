-- N03 - PostgreSQL Truth Vault
-- PostgreSQL is truth. Airtable is mirror only. n8n is thin worker only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS system_runtime_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  display_name text NOT NULL,
  current_state text NOT NULL DEFAULT 'NEW',
  active_package_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidates_state_check CHECK (
    current_state IN (
      'NEW',
      'INTAKE_PENDING',
      'EVALUATION_PENDING',
      'DOCUMENT_PENDING',
      'EXECUTION_PENDING',
      'COMPLETED',
      'FAILED'
    )
  )
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  id_number_hash text,
  date_of_birth date,
  province text,
  city text,
  highest_grade text,
  qualification_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  work_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_confidence text NOT NULL DEFAULT 'LOW',
  source_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by_operator boolean NOT NULL DEFAULT false,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_profiles_confidence_check CHECK (
    profile_confidence IN ('LOW', 'MEDIUM', 'HIGH', 'REVIEW_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  route_type text NOT NULL,
  route_name text NOT NULL,
  institution_or_provider text,
  current_state text NOT NULL DEFAULT 'NEW',
  source_confidence_band text NOT NULL DEFAULT 'C',
  portal_health text NOT NULL DEFAULT 'UNKNOWN',
  map_fallback_required boolean NOT NULL DEFAULT false,
  priority_score integer NOT NULL DEFAULT 0,
  last_evidence_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_route_type_check CHECK (
    route_type IN (
      'UNIVERSITY',
      'TVET',
      'SETA',
      'LEARNERSHIP',
      'BURSARY',
      'ACCOMMODATION',
      'EMPLOYER',
      'PRIVATE_COLLEGE',
      'NSFAS',
      'CAO'
    )
  ),
  CONSTRAINT applications_state_check CHECK (
    current_state IN (
      'NEW',
      'INTAKE_PENDING',
      'EVALUATION_PENDING',
      'DOCUMENT_PENDING',
      'EXECUTION_PENDING',
      'COMPLETED',
      'FAILED'
    )
  ),
  CONSTRAINT applications_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT applications_portal_health_check CHECK (
    portal_health IN (
      'OPEN',
      'OTP_REQUIRED',
      'CAPTCHA_BLOCKED',
      'DOWN',
      'MANUAL_ONLY',
      'UNKNOWN'
    )
  )
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  command_id text,
  correlation_id text NOT NULL,
  status text NOT NULL DEFAULT 'CLAIMED',
  response_body jsonb,
  locked_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  CONSTRAINT idempotency_status_check CHECK (
    status IN ('CLAIMED', 'COMPLETED', 'FAILED', 'EXPIRED')
  )
);

CREATE TABLE IF NOT EXISTS command_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id text UNIQUE NOT NULL,
  command_type text NOT NULL,
  idempotency_key text NOT NULL,
  correlation_id text NOT NULL,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  source text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  policy_decision jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACCEPTED',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT command_log_status_check CHECK (
    status IN ('ACCEPTED', 'REJECTED', 'COMPLETED', 'FAILED', 'APPROVAL_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id text UNIQUE NOT NULL,
  workflow_code text NOT NULL,
  idempotency_key text NOT NULL,
  correlation_id text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  previous_state text NOT NULL,
  final_state text NOT NULL,
  status text NOT NULL,
  evidence_ref text,
  error_code text,
  message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT workflow_runs_status_check CHECK (
    status IN ('SUCCESS', 'FAILED', 'DEFERRED', 'MANUAL_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS evidence_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_ref text UNIQUE NOT NULL,
  evidence_type text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  command_id text,
  workflow_run_id text,
  source_name text NOT NULL,
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  summary text NOT NULL,
  protected_data boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO',
  correlation_id text NOT NULL,
  actor_id text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  evidence_ref text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_severity_check CHECK (
    severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')
  )
);

CREATE TABLE IF NOT EXISTS source_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE NOT NULL,
  source_name text NOT NULL,
  source_type text NOT NULL,
  base_url text,
  default_confidence_band text NOT NULL DEFAULT 'C',
  verification_required boolean NOT NULL DEFAULT true,
  last_verified_at timestamptz,
  verification_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_authorities_band_check CHECK (
    default_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS route_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_authority_id uuid REFERENCES source_authorities(id) ON DELETE SET NULL,
  route_type text NOT NULL,
  route_name text NOT NULL,
  provider_name text,
  url text NOT NULL,
  confidence_band text NOT NULL DEFAULT 'C',
  status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  checked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT route_sources_band_check CHECK (
    confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT route_sources_status_check CHECK (
    status IN ('VERIFIED', 'NEEDS_REVIEW', 'STALE', 'BLOCKED', 'RISK')
  )
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_code text NOT NULL,
  workflow_run_id text,
  correlation_id text NOT NULL,
  status text NOT NULL DEFAULT 'RUNNING',
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT worker_heartbeats_status_check CHECK (
    status IN ('RUNNING', 'OK', 'WARNING', 'FAILED', 'STOPPED')
  )
);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  correlation_id text NOT NULL,
  idempotency_key text,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  error_code text NOT NULL,
  error_message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  retry_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT dlq_status_check CHECK (
    status IN ('OPEN', 'RETRYING', 'RESOLVED', 'IGNORED')
  )
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_ref text UNIQUE NOT NULL,
  command_id text,
  correlation_id text NOT NULL,
  requested_by text NOT NULL,
  approval_type text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  decided_by text,
  decided_at timestamptz,
  decision_notes text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT approval_status_check CHECK (
    status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
  )
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(current_state);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_state ON applications(current_state);
CREATE INDEX IF NOT EXISTS idx_applications_route_type ON applications(route_type);
CREATE INDEX IF NOT EXISTS idx_command_log_idempotency ON command_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_command_log_correlation ON command_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_correlation ON workflow_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_candidate ON evidence_ledger(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_application ON evidence_ledger(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_route_sources_route_type ON route_sources(route_type);
CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_worker ON worker_heartbeats(worker_code, heartbeat_at DESC);
CREATE INDEX IF NOT EXISTS idx_dlq_status ON dead_letter_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_requests(status, created_at DESC);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_runtime_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_candidates ON candidates;
CREATE POLICY service_role_all_candidates ON candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_profiles ON candidate_profiles;
CREATE POLICY service_role_all_candidate_profiles ON candidate_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_applications ON applications;
CREATE POLICY service_role_all_applications ON applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_idempotency_keys ON idempotency_keys;
CREATE POLICY service_role_all_idempotency_keys ON idempotency_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_command_log ON command_log;
CREATE POLICY service_role_all_command_log ON command_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_workflow_runs ON workflow_runs;
CREATE POLICY service_role_all_workflow_runs ON workflow_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_evidence_ledger ON evidence_ledger;
CREATE POLICY service_role_all_evidence_ledger ON evidence_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_audit_events ON audit_events;
CREATE POLICY service_role_all_audit_events ON audit_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_source_authorities ON source_authorities;
CREATE POLICY service_role_all_source_authorities ON source_authorities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_sources ON route_sources;
CREATE POLICY service_role_all_route_sources ON route_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_worker_heartbeats ON worker_heartbeats;
CREATE POLICY service_role_all_worker_heartbeats ON worker_heartbeats
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_dead_letter_queue ON dead_letter_queue;
CREATE POLICY service_role_all_dead_letter_queue ON dead_letter_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_approval_requests ON approval_requests;
CREATE POLICY service_role_all_approval_requests ON approval_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_system_runtime_config ON system_runtime_config;
CREATE POLICY service_role_all_system_runtime_config ON system_runtime_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO system_runtime_config (key, value, description)
VALUES
  ('KINGSMEN_CAP_ACTIVE_CANDIDATES', '{"value": 500}'::jsonb, 'Starting active candidate cap. Cap limits volume, not capability.'),
  ('EMAIL_PRIMARY_ENABLED', '{"value": true}'::jsonb, 'Email is the primary communication nervous system.'),
  ('WHATSAPP_URGENT_ONLY', '{"value": true}'::jsonb, 'WhatsApp remains urgent-only.'),
  ('AIRTABLE_MODE', '{"value": "mirror"}'::jsonb, 'Airtable is mirror only.'),
  ('N8N_MODE', '{"value": "thin_worker"}'::jsonb, 'n8n is thin worker only.'),
  ('PLAYWRIGHT_MODE', '{"value": "scout_probe"}'::jsonb, 'Playwright is scout/probe only.'),
  ('MAP_FALLBACK_ENABLED', '{"value": true}'::jsonb, 'Blocked portals route to manual MAP fallback.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();