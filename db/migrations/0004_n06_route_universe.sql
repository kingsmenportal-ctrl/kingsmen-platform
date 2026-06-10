-- N06 - Route Universe / Application Workbench
-- All sectors are available from day one. Caps limit volume, not capability.

CREATE TABLE IF NOT EXISTS route_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text UNIQUE NOT NULL,
  category_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  requires_source_verification boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text UNIQUE NOT NULL,
  provider_name text NOT NULL,
  provider_type text NOT NULL,
  province text,
  base_url text,
  source_authority_id uuid REFERENCES source_authorities(id) ON DELETE SET NULL,
  default_confidence_band text NOT NULL DEFAULT 'C',
  verification_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  public_safe boolean NOT NULL DEFAULT false,
  private_provider_requires_accreditation_check boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT route_providers_type_check CHECK (
    provider_type IN (
      'UNIVERSITY',
      'TVET',
      'SETA',
      'LEARNERSHIP_PROVIDER',
      'BURSARY_PROVIDER',
      'ACCOMMODATION_PROVIDER',
      'EMPLOYER',
      'PRIVATE_COLLEGE',
      'APPLICATION_PORTAL',
      'GOVERNMENT_AUTHORITY',
      'QUALITY_AUTHORITY'
    )
  ),
  CONSTRAINT route_providers_confidence_check CHECK (
    default_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT route_providers_verification_check CHECK (
    verification_status IN ('VERIFIED', 'NEEDS_REVIEW', 'STALE', 'BLOCKED', 'RISK')
  )
);

CREATE TABLE IF NOT EXISTS route_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES route_providers(id) ON DELETE SET NULL,
  programme_key text UNIQUE NOT NULL,
  programme_name text NOT NULL,
  route_type text NOT NULL,
  qualification_type text,
  province text,
  delivery_mode text NOT NULL DEFAULT 'UNKNOWN',
  application_method text NOT NULL DEFAULT 'UNKNOWN',
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  route_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  availability_status text NOT NULL DEFAULT 'UNKNOWN',
  eligibility_summary text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT route_programmes_route_type_check CHECK (
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
  CONSTRAINT route_programmes_delivery_mode_check CHECK (
    delivery_mode IN ('CONTACT', 'DISTANCE', 'HYBRID', 'WORKPLACE', 'ONLINE', 'UNKNOWN')
  ),
  CONSTRAINT route_programmes_application_method_check CHECK (
    application_method IN ('DIRECT_PORTAL', 'CAO', 'NSFAS', 'EMAIL', 'MANUAL', 'JOB_BOARD', 'UNKNOWN')
  ),
  CONSTRAINT route_programmes_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT route_programmes_route_status_check CHECK (
    route_status IN ('VERIFIED', 'NEEDS_REVIEW', 'STALE', 'BLOCKED', 'RISK')
  ),
  CONSTRAINT route_programmes_availability_check CHECK (
    availability_status IN ('OPEN', 'CLOSED', 'FUTURE', 'UNKNOWN', 'MANUAL_CHECK_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS route_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES route_programmes(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  requirement_type text NOT NULL,
  requirement_text text NOT NULL,
  document_type text,
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  verification_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, requirement_key),
  CONSTRAINT route_requirements_type_check CHECK (
    requirement_type IN ('ACADEMIC', 'DOCUMENT', 'AGE', 'LOCATION', 'FINANCE', 'CITIZENSHIP', 'EXPERIENCE', 'OTHER')
  ),
  CONSTRAINT route_requirements_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT route_requirements_verification_check CHECK (
    verification_status IN ('VERIFIED', 'NEEDS_REVIEW', 'STALE', 'BLOCKED', 'RISK')
  )
);

CREATE TABLE IF NOT EXISTS route_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES route_programmes(id) ON DELETE CASCADE,
  deadline_key text NOT NULL,
  deadline_type text NOT NULL,
  deadline_date date,
  deadline_text text NOT NULL,
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  verification_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, deadline_key),
  CONSTRAINT route_deadlines_type_check CHECK (
    deadline_type IN ('OPENING', 'CLOSING', 'LATE_PAYMENT', 'DOCUMENT_UPLOAD', 'STATUS_CHECK', 'UNKNOWN')
  ),
  CONSTRAINT route_deadlines_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS route_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES route_programmes(id) ON DELETE CASCADE,
  fee_key text NOT NULL,
  fee_type text NOT NULL,
  amount_cents integer,
  currency text NOT NULL DEFAULT 'ZAR',
  fee_text text NOT NULL,
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  verification_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, fee_key),
  CONSTRAINT route_fees_type_check CHECK (
    fee_type IN ('APPLICATION', 'ADMIN', 'LATE', 'REGISTRATION', 'TUITION', 'NO_FEE', 'UNKNOWN')
  ),
  CONSTRAINT route_fees_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS portal_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES route_providers(id) ON DELETE CASCADE,
  portal_key text UNIQUE NOT NULL,
  portal_name text NOT NULL,
  portal_url text NOT NULL,
  login_required boolean NOT NULL DEFAULT false,
  otp_risk boolean NOT NULL DEFAULT false,
  captcha_risk boolean NOT NULL DEFAULT false,
  supports_document_upload boolean NOT NULL DEFAULT false,
  supports_status_check boolean NOT NULL DEFAULT false,
  playwright_allowed boolean NOT NULL DEFAULT false,
  manual_map_required boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  source_confidence_band text NOT NULL DEFAULT 'C',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_dna_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  )
);

CREATE TABLE IF NOT EXISTS portal_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES portal_dna(id) ON DELETE CASCADE,
  check_ref text UNIQUE NOT NULL,
  health_status text NOT NULL DEFAULT 'UNKNOWN',
  http_status integer,
  otp_detected boolean NOT NULL DEFAULT false,
  captcha_detected boolean NOT NULL DEFAULT false,
  manual_only_detected boolean NOT NULL DEFAULT false,
  map_fallback_required boolean NOT NULL DEFAULT false,
  evidence_ref text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  message text NOT NULL DEFAULT '',
  CONSTRAINT portal_health_status_check CHECK (
    health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
  )
);

CREATE TABLE IF NOT EXISTS application_workbench_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  programme_id uuid REFERENCES route_programmes(id) ON DELETE SET NULL,
  workbench_ref text UNIQUE NOT NULL,
  workbench_status text NOT NULL DEFAULT 'NOT_READY',
  route_readiness_status text NOT NULL DEFAULT 'NOT_READY',
  document_readiness_status text NOT NULL DEFAULT 'MISSING',
  source_confidence_band text NOT NULL DEFAULT 'C',
  portal_health_status text NOT NULL DEFAULT 'UNKNOWN',
  map_fallback_required boolean NOT NULL DEFAULT false,
  priority_score integer NOT NULL DEFAULT 0,
  next_action text NOT NULL DEFAULT 'REVIEW_ROUTE',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workbench_status_check CHECK (
    workbench_status IN ('NOT_READY', 'READY', 'WAITING', 'MANUAL_REQUIRED', 'SUBMITTED', 'COMPLETED', 'FAILED')
  ),
  CONSTRAINT workbench_route_readiness_check CHECK (
    route_readiness_status IN ('NOT_READY', 'READY', 'MANUAL_REQUIRED', 'SOURCE_REVIEW_REQUIRED')
  ),
  CONSTRAINT workbench_document_readiness_check CHECK (
    document_readiness_status IN ('MISSING', 'PARTIAL', 'READY', 'REVIEW_REQUIRED')
  ),
  CONSTRAINT workbench_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT workbench_portal_health_check CHECK (
    portal_health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
  )
);

CREATE TABLE IF NOT EXISTS route_readiness_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  programme_id uuid REFERENCES route_programmes(id) ON DELETE SET NULL,
  snapshot_ref text UNIQUE NOT NULL,
  readiness_status text NOT NULL DEFAULT 'NOT_READY',
  blockers jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL,
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT route_readiness_status_check CHECK (
    readiness_status IN ('NOT_READY', 'READY', 'MANUAL_REQUIRED', 'SOURCE_REVIEW_REQUIRED')
  )
);

CREATE TABLE IF NOT EXISTS cao_choice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  cao_choice_ref text UNIQUE NOT NULL,
  choice_number integer NOT NULL,
  institution_name text NOT NULL,
  programme_name text NOT NULL,
  cao_programme_code text,
  source_url text,
  source_confidence_band text NOT NULL DEFAULT 'C',
  choice_status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cao_choice_number_check CHECK (choice_number >= 1 AND choice_number <= 6),
  CONSTRAINT cao_choice_confidence_check CHECK (
    source_confidence_band IN ('A', 'B', 'C', 'D')
  ),
  CONSTRAINT cao_choice_status_check CHECK (
    choice_status IN ('DRAFT', 'READY', 'SUBMITTED', 'CHANGE_OF_MIND', 'CANCELLED')
  )
);

CREATE TABLE IF NOT EXISTS nsfas_support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  nsfas_case_ref text UNIQUE NOT NULL,
  support_type text NOT NULL,
  support_status text NOT NULL DEFAULT 'OPEN',
  mynsfas_status text NOT NULL DEFAULT 'UNKNOWN',
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_action text NOT NULL DEFAULT 'CHECK_MYNFSAS',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nsfas_support_type_check CHECK (
    support_type IN ('APPLICATION_SUPPORT', 'DOCUMENT_SUPPORT', 'STATUS_TRACKING', 'APPEAL_SUPPORT')
  ),
  CONSTRAINT nsfas_support_status_check CHECK (
    support_status IN ('OPEN', 'WAITING_ON_CANDIDATE', 'WAITING_ON_NSFAS', 'READY', 'CLOSED', 'FAILED')
  )
);

CREATE TABLE IF NOT EXISTS map_manual_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  map_ref text UNIQUE NOT NULL,
  reason_code text NOT NULL,
  reason_summary text NOT NULL,
  manual_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  package_status text NOT NULL DEFAULT 'DRAFT',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_reason_code_check CHECK (
    reason_code IN ('OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'PORTAL_DOWN', 'MANUAL_ONLY', 'SOURCE_REVIEW_REQUIRED', 'OTHER')
  ),
  CONSTRAINT map_package_status_check CHECK (
    package_status IN ('DRAFT', 'READY', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  )
);

CREATE INDEX IF NOT EXISTS idx_route_categories_code ON route_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_route_providers_type ON route_providers(provider_type, verification_status);
CREATE INDEX IF NOT EXISTS idx_route_programmes_type ON route_programmes(route_type, availability_status);
CREATE INDEX IF NOT EXISTS idx_route_requirements_programme ON route_requirements(programme_id, requirement_type);
CREATE INDEX IF NOT EXISTS idx_route_deadlines_programme ON route_deadlines(programme_id, deadline_type);
CREATE INDEX IF NOT EXISTS idx_route_fees_programme ON route_fees(programme_id, fee_type);
CREATE INDEX IF NOT EXISTS idx_portal_dna_provider ON portal_dna(provider_id);
CREATE INDEX IF NOT EXISTS idx_portal_health_portal ON portal_health_checks(portal_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_workbench_candidate ON application_workbench_items(candidate_id, workbench_status);
CREATE INDEX IF NOT EXISTS idx_workbench_application ON application_workbench_items(application_id);
CREATE INDEX IF NOT EXISTS idx_route_readiness_candidate ON route_readiness_snapshots(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cao_choice_application ON cao_choice_items(application_id, choice_number);
CREATE INDEX IF NOT EXISTS idx_nsfas_support_candidate ON nsfas_support_cases(candidate_id, support_status);
CREATE INDEX IF NOT EXISTS idx_map_manual_candidate ON map_manual_packages(candidate_id, package_status);

ALTER TABLE route_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_workbench_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cao_choice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfas_support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_manual_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_route_categories ON route_categories;
CREATE POLICY service_role_all_route_categories ON route_categories
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_providers ON route_providers;
CREATE POLICY service_role_all_route_providers ON route_providers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_programmes ON route_programmes;
CREATE POLICY service_role_all_route_programmes ON route_programmes
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_requirements ON route_requirements;
CREATE POLICY service_role_all_route_requirements ON route_requirements
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_deadlines ON route_deadlines;
CREATE POLICY service_role_all_route_deadlines ON route_deadlines
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_fees ON route_fees;
CREATE POLICY service_role_all_route_fees ON route_fees
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_portal_dna ON portal_dna;
CREATE POLICY service_role_all_portal_dna ON portal_dna
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_portal_health_checks ON portal_health_checks;
CREATE POLICY service_role_all_portal_health_checks ON portal_health_checks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_application_workbench_items ON application_workbench_items;
CREATE POLICY service_role_all_application_workbench_items ON application_workbench_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_readiness_snapshots ON route_readiness_snapshots;
CREATE POLICY service_role_all_route_readiness_snapshots ON route_readiness_snapshots
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_cao_choice_items ON cao_choice_items;
CREATE POLICY service_role_all_cao_choice_items ON cao_choice_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_nsfas_support_cases ON nsfas_support_cases;
CREATE POLICY service_role_all_nsfas_support_cases ON nsfas_support_cases
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_map_manual_packages ON map_manual_packages;
CREATE POLICY service_role_all_map_manual_packages ON map_manual_packages
  FOR ALL USING (true) WITH CHECK (true);