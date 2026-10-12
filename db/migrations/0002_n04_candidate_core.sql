-- N04 - Candidate Core & Portal
-- Candidate should not retype data already in CVs/documents.
-- Smart intake is evidence-backed, confidence-banded, and candidate-confirmed.

CREATE TABLE IF NOT EXISTS candidate_accounts (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text,
  auth_status text NOT NULL DEFAULT 'PENDING',
  email_verified boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  account_recovery_required boolean NOT NULL DEFAULT false,
  device_trust_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_accounts_auth_status_check CHECK (
    auth_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'RECOVERY_REQUIRED', 'DISABLED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_sessions (
  session_id text PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  device_label text NOT NULL DEFAULT 'Unknown device',
  device_fingerprint_hash text,
  ip_hash text,
  user_agent text,
  trust_status text NOT NULL DEFAULT 'UNTRUSTED',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT candidate_sessions_trust_status_check CHECK (
    trust_status IN ('TRUSTED', 'UNTRUSTED', 'BLOCKED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_profile_field_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  proposed_value text,
  value_summary text NOT NULL DEFAULT '',
  source_type text NOT NULL,
  source_ref text,
  source_document_id uuid,
  source_evidence_ref text,
  confidence_band text NOT NULL DEFAULT 'LOW',
  candidate_confirmed boolean NOT NULL DEFAULT false,
  operator_review_required boolean NOT NULL DEFAULT false,
  accepted_into_profile boolean NOT NULL DEFAULT false,
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT candidate_field_source_type_check CHECK (
    source_type IN ('CV', 'ID_DOCUMENT', 'CERTIFICATE', 'ACADEMIC_RECORD', 'PROOF_OF_ADDRESS', 'BANK_LETTER', 'USER_INPUT', 'OPERATOR', 'SYSTEM')
  ),
  CONSTRAINT candidate_field_source_confidence_check CHECK (
    confidence_band IN ('LOW', 'MEDIUM', 'HIGH', 'REVIEW_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  requested_value text NOT NULL,
  reason text NOT NULL,
  source_evidence_ref text,
  sensitivity text NOT NULL DEFAULT 'NORMAL',
  status text NOT NULL DEFAULT 'PENDING',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by text,
  decided_at timestamptz,
  decision_notes text,
  CONSTRAINT candidate_change_sensitivity_check CHECK (
    sensitivity IN ('NORMAL', 'SENSITIVE', 'LEGAL_IDENTITY', 'FINANCE', 'ACADEMIC')
  ),
  CONSTRAINT candidate_change_status_check CHECK (
    status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  channel text NOT NULL,
  direction text NOT NULL,
  urgency text NOT NULL DEFAULT 'ROUTINE',
  subject text,
  body text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'QUEUED',
  evidence_ref text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  read_at timestamptz,
  CONSTRAINT candidate_messages_channel_check CHECK (
    channel IN ('EMAIL', 'WHATSAPP', 'SMS', 'PORTAL')
  ),
  CONSTRAINT candidate_messages_direction_check CHECK (
    direction IN ('INBOUND', 'OUTBOUND', 'SYSTEM')
  ),
  CONSTRAINT candidate_messages_urgency_check CHECK (
    urgency IN ('ROUTINE', 'IMPORTANT', 'URGENT', 'EMERGENCY')
  ),
  CONSTRAINT candidate_messages_delivery_check CHECK (
    delivery_status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref text UNIQUE NOT NULL,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL',
  status text NOT NULL DEFAULT 'OPEN',
  title text NOT NULL,
  description text NOT NULL,
  evidence_ref text,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CONSTRAINT candidate_support_priority_check CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT candidate_support_status_check CHECK (
    status IN ('OPEN', 'WAITING_ON_CANDIDATE', 'WAITING_ON_OPERATOR', 'RESOLVED', 'CLOSED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_financial_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_ref text UNIQUE NOT NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'PENDING',
  provider text,
  provider_ref text,
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_financial_item_type_check CHECK (
    item_type IN ('PLAN', 'ORDER', 'INVOICE', 'PAYMENT', 'REFUND', 'CREDIT')
  ),
  CONSTRAINT candidate_financial_status_check CHECK (
    status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'WAIVED')
  )
);

CREATE TABLE IF NOT EXISTS candidate_success_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_status text NOT NULL DEFAULT 'RECORDED',
  outcome_confidence text NOT NULL DEFAULT 'UNVERIFIED',
  summary text NOT NULL,
  evidence_ref text,
  feedback_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_success_event_status_check CHECK (
    event_status IN ('RECORDED', 'VERIFIED', 'DISPUTED', 'RETRACTED')
  ),
  CONSTRAINT candidate_success_confidence_check CHECK (
    outcome_confidence IN ('UNVERIFIED', 'PARTIAL', 'VERIFIED')
  ),
  CONSTRAINT candidate_success_feedback_score_check CHECK (
    feedback_score IS NULL OR (feedback_score >= 1 AND feedback_score <= 5)
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_accounts_email ON candidate_accounts(email);
CREATE INDEX IF NOT EXISTS idx_candidate_sessions_candidate ON candidate_sessions(candidate_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_field_sources_candidate ON candidate_profile_field_sources(candidate_id, field_name);
CREATE INDEX IF NOT EXISTS idx_candidate_change_requests_candidate ON candidate_profile_change_requests(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_messages_candidate ON candidate_messages(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_support_candidate ON candidate_support_tickets(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_financial_candidate ON candidate_financial_items(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_success_candidate ON candidate_success_events(candidate_id, created_at DESC);

ALTER TABLE candidate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profile_field_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profile_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_financial_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_success_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_candidate_accounts ON candidate_accounts;
CREATE POLICY service_role_all_candidate_accounts ON candidate_accounts TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_sessions ON candidate_sessions;
CREATE POLICY service_role_all_candidate_sessions ON candidate_sessions TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_profile_field_sources ON candidate_profile_field_sources;
CREATE POLICY service_role_all_candidate_profile_field_sources ON candidate_profile_field_sources TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_profile_change_requests ON candidate_profile_change_requests;
CREATE POLICY service_role_all_candidate_profile_change_requests ON candidate_profile_change_requests TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_messages ON candidate_messages;
CREATE POLICY service_role_all_candidate_messages ON candidate_messages TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_support_tickets ON candidate_support_tickets;
CREATE POLICY service_role_all_candidate_support_tickets ON candidate_support_tickets TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_financial_items ON candidate_financial_items;
CREATE POLICY service_role_all_candidate_financial_items ON candidate_financial_items TO service_role
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_success_events ON candidate_success_events;
CREATE POLICY service_role_all_candidate_success_events ON candidate_success_events TO service_role
  FOR ALL USING (true) WITH CHECK (true);