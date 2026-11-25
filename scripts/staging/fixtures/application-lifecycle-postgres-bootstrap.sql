-- Full dependency fixture for 0107 -> 0108 -> 0109.
-- Disposable PostgreSQL 17 only. Never target a connected/live Supabase project.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS kingsmen_security;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$function$;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY,
  public_ref text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.candidate_auth_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  link_status text NOT NULL,
  verified_at timestamptz,
  verified_by text
);

CREATE TABLE public.candidate_master_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id) ON DELETE RESTRICT,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pathway_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_version text NOT NULL DEFAULT 'FIXTURE_CONSENT_V1',
  consent_at timestamptz NOT NULL DEFAULT now(),
  last_saved_by_auth_user_id uuid NOT NULL DEFAULT '99999999-9999-4999-8999-999999999999',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_ref text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  candidate_ref text NOT NULL,
  consent_type text NOT NULL,
  lawful_basis text NOT NULL DEFAULT 'CONSENT',
  consent_status text NOT NULL,
  consent_text_snapshot text NOT NULL DEFAULT '',
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE public.finance_plan_catalog (
  plan_code text PRIMARY KEY,
  plan_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  active boolean NOT NULL DEFAULT true,
  priority_application_count integer,
  managed_application_count integer NOT NULL DEFAULT 0,
  service_term_days integer NOT NULL DEFAULT 0,
  accommodation_route_count integer NOT NULL DEFAULT 0,
  accommodation_support_available boolean NOT NULL DEFAULT true,
  cv_versions integer NOT NULL DEFAULT 0,
  motivation_letters integer NOT NULL DEFAULT 0,
  acknowledgement_target_business_hours integer NOT NULL DEFAULT 0,
  first_response_target_business_hours integer NOT NULL DEFAULT 0,
  upgrade_bonus_routes_when_cv_revamp_owned integer NOT NULL DEFAULT 0,
  refund_policy_version text NOT NULL DEFAULT 'FIXTURE_V1',
  catalogue_version text NOT NULL DEFAULT 'FIXTURE_V1',
  service_scope text NOT NULL DEFAULT '',
  response_target_disclaimer text NOT NULL DEFAULT ''
);

CREATE TABLE public.finance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  candidate_ref text NOT NULL,
  plan_code text NOT NULL REFERENCES public.finance_plan_catalog(plan_code),
  order_status text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  catalogue_version text NOT NULL DEFAULT 'FIXTURE_V1',
  service_term_days integer NOT NULL DEFAULT 0,
  managed_application_count integer NOT NULL DEFAULT 0,
  accommodation_route_count integer NOT NULL DEFAULT 0,
  cv_versions integer NOT NULL DEFAULT 0,
  motivation_letters integer NOT NULL DEFAULT 0,
  acknowledgement_target_business_hours integer NOT NULL DEFAULT 0,
  first_response_target_business_hours integer NOT NULL DEFAULT 0,
  upgrade_bonus_routes integer NOT NULL DEFAULT 0,
  refund_policy_version text NOT NULL DEFAULT 'FIXTURE_V1',
  service_scope text NOT NULL DEFAULT '',
  entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_ref text NOT NULL UNIQUE,
  order_ref text NOT NULL REFERENCES public.finance_orders(order_ref),
  candidate_ref text NOT NULL,
  provider text NOT NULL DEFAULT 'PAYFAST',
  payment_status text NOT NULL DEFAULT 'PENDING',
  verified boolean NOT NULL DEFAULT false,
  amount_gross_cents integer NOT NULL DEFAULT 0,
  amount_fee_cents integer NOT NULL DEFAULT 0,
  amount_net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.opportunity_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_ref text NOT NULL UNIQUE,
  provider_name text NOT NULL,
  provider_type text NOT NULL,
  sector text NOT NULL,
  province text,
  official_url text,
  accreditation_status text NOT NULL,
  source_confidence text NOT NULL,
  safe_to_recommend boolean NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.opportunity_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_ref text NOT NULL UNIQUE,
  provider_ref text NOT NULL REFERENCES public.opportunity_providers(provider_ref),
  programme_name text NOT NULL,
  sector text NOT NULL,
  nqf_level text,
  delivery_mode text,
  location_text text,
  opening_status text NOT NULL,
  source_confidence text NOT NULL,
  candidate_facing_safe boolean NOT NULL,
  exact_link text,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_match_ref text NOT NULL UNIQUE,
  candidate_ref text NOT NULL,
  programme_ref text REFERENCES public.opportunity_programmes(programme_ref),
  provider_ref text REFERENCES public.opportunity_providers(provider_ref),
  sector text NOT NULL,
  match_status text NOT NULL,
  match_score numeric NOT NULL DEFAULT 0,
  source_confidence text NOT NULL,
  human_review_required boolean NOT NULL DEFAULT true,
  recommendation_summary text NOT NULL DEFAULT '',
  sealed_exact_target boolean NOT NULL DEFAULT false,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.external_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_ref text NOT NULL UNIQUE,
  authority_ref text,
  source_url text NOT NULL,
  source_title text NOT NULL,
  sector text NOT NULL,
  observed_claim text NOT NULL,
  source_confidence text NOT NULL,
  observation_status text NOT NULL,
  observed_at timestamptz NOT NULL,
  valid_until timestamptz,
  stale_after timestamptz,
  last_checked_at timestamptz,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  review_reason text
);

CREATE TABLE public.opportunity_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_ref text NOT NULL UNIQUE,
  programme_ref text REFERENCES public.opportunity_programmes(programme_ref),
  provider_ref text REFERENCES public.opportunity_providers(provider_ref),
  deadline_type text NOT NULL,
  opens_at timestamptz,
  closes_at timestamptz,
  deadline_status text NOT NULL,
  source_confidence text NOT NULL,
  timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_ref text NOT NULL UNIQUE,
  title text NOT NULL,
  provider_name text NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT')),
  description text,
  location_text text,
  source_url text,
  application_url text,
  application_method text NOT NULL DEFAULT 'EXTERNAL_PORTAL' CHECK (application_method IN ('INTERNAL','EXTERNAL_PORTAL','EMAIL','MANUAL_ONLY','IN_PERSON')),
  required_document_types text[] NOT NULL DEFAULT ARRAY[]::text[],
  required_profile_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  opens_at timestamptz,
  closes_at timestamptz,
  source_checked_at timestamptz,
  source_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (source_status IN ('UNVERIFIED','VERIFIED','STALE','CLOSED','WITHDRAWN')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_ref text NOT NULL UNIQUE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
  pathway_type text NOT NULL CHECK (pathway_type IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','SUBMISSION_PENDING','SUBMITTED_CONFIRMED','PROVIDER_REVIEW','SHORTLISTED','INTERVIEW','OFFERED','ACCEPTED','REJECTED','WITHDRAWN','CANCELLED','MANUAL_ACTION_REQUIRED','EXPIRED')),
  readiness_status text NOT NULL DEFAULT 'NOT_CHECKED' CHECK (readiness_status IN ('NOT_CHECKED','BLOCKED','WARNINGS','READY')),
  readiness_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_reference text,
  submission_evidence_ref text,
  submitted_at timestamptz,
  last_status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, candidate_id),
  UNIQUE (candidate_id, opportunity_id)
);

CREATE TABLE public.candidate_application_submission_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_ref text NOT NULL UNIQUE,
  application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
  requested_by_auth_user_id uuid NOT NULL,
  delivery_mode text NOT NULL CHECK (delivery_mode IN ('INTERNAL_ADAPTER','EXTERNAL_PORTAL','EMAIL','MANUAL_ONLY','IN_PERSON')),
  job_status text NOT NULL DEFAULT 'PREPARED' CHECK (job_status IN ('PREPARED','AUTHORIZED','MANUAL_REQUIRED','DISPATCHING','PROVIDER_ACKNOWLEDGED','FAILED','CANCELLED')),
  adapter_key text NOT NULL DEFAULT 'MANUAL',
  idempotency_key text NOT NULL UNIQUE,
  authorized_by_auth_user_id uuid,
  authorized_at timestamptz,
  dispatched_at timestamptz,
  provider_acknowledged_at timestamptz,
  provider_reference text,
  failure_code text,
  failure_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ref text NOT NULL UNIQUE,
  application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  actor_auth_user_id uuid,
  event_type text NOT NULL CHECK (event_type IN (
    'APPLICATION_CREATED','READINESS_CHECKED','STATUS_CHANGED','EVIDENCE_ATTACHED',
    'MANUAL_PACKAGE_CREATED','MANUAL_ACTION_RECORDED','EVIDENCE_VERIFIED','EVIDENCE_REJECTED',
    'SUBMISSION_AUTHORIZED','SUBMISSION_ATTEMPT_CREATED','SUBMISSION_DISPATCHED',
    'PROVIDER_ACKNOWLEDGED','PROVIDER_STATUS_RECORDED','PROVIDER_OUTCOME_RECORDED',
    'REVIEW_DECISION_RECORDED','OUTCOME_RECORDED','OUTCOME_DISPUTED',
    'OUTCOME_CORRECTION_DECIDED','OUTCOME_SUPERSEDED','CAO_CHOICES_UPDATED'
  )),
  from_status text,
  to_status text,
  reason_code text,
  evidence_ref text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_master_application_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  target_key text NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT','FUNDING','ACCOMMODATION','WIL')),
  provider_name text NOT NULL,
  programme_or_role text NOT NULL,
  provider_application_url text CHECK (provider_application_url IS NULL OR provider_application_url ~ '^https://'),
  source_reference text,
  source_confidence text NOT NULL CHECK (source_confidence IN ('A','B','C','D','UNVERIFIED')),
  planning_status text NOT NULL DEFAULT 'PLANNING' CHECK (planning_status IN ('PLANNING','PREPARING','EXTERNAL_PORTAL_REQUIRED','CANCELLED')),
  idempotency_key text NOT NULL,
  created_by_auth_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  application_id uuid,
  UNIQUE (candidate_id, target_key),
  FOREIGN KEY (application_id, candidate_id) REFERENCES public.candidate_applications(id, candidate_id) ON DELETE RESTRICT
);

GRANT USAGE ON SCHEMA public, auth, kingsmen_security TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
