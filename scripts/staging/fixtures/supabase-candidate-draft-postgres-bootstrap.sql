-- PostgreSQL 17 fixture for the exact Supabase candidate-draft migration.
-- Disposable CI only. Never point this fixture at Supabase or production.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END
$roles$;

CREATE SCHEMA auth;
CREATE SCHEMA kingsmen_security;
CREATE SCHEMA private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$function$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY,
  public_ref text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.candidate_accounts (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  auth_status text NOT NULL DEFAULT 'ACTIVE',
  email_verified boolean NOT NULL DEFAULT true,
  account_recovery_required boolean NOT NULL DEFAULT false,
  device_trust_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_auth_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
  link_status text NOT NULL CHECK (link_status IN ('PENDING','VERIFIED','REVOKED')),
  verified_at timestamptz,
  verified_by text,
  CHECK (link_status <> 'VERIFIED' OR (verified_at IS NOT NULL AND verified_by IS NOT NULL))
);

CREATE OR REPLACE FUNCTION private.current_verified_candidate_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT l.candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = auth.uid()
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
  LIMIT 1
$function$;
REVOKE ALL ON FUNCTION private.current_verified_candidate_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_verified_candidate_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION kingsmen_security.current_authenticated_candidate_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','auth'
AS $function$
  SELECT ca.candidate_id
  FROM public.candidate_accounts ca
  WHERE ca.auth_user_id = auth.uid()
  LIMIT 1
$function$;

CREATE TABLE public.candidate_opportunities (
  id uuid PRIMARY KEY,
  opportunity_ref text NOT NULL UNIQUE,
  title text NOT NULL,
  provider_name text NOT NULL,
  pathway_type text NOT NULL,
  description text,
  location_text text,
  source_url text,
  application_url text,
  application_method text NOT NULL,
  required_document_types text[] NOT NULL DEFAULT '{}',
  required_profile_fields text[] NOT NULL DEFAULT '{}',
  opens_at timestamptz,
  closes_at timestamptz,
  source_checked_at timestamptz,
  source_status text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_applications (
  id uuid PRIMARY KEY,
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
  UNIQUE (id,candidate_id),
  UNIQUE (candidate_id,opportunity_id)
);

CREATE TABLE public.candidate_master_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id) ON DELETE RESTRICT,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pathway_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent_version text NOT NULL DEFAULT 'fixture-v1',
  consent_at timestamptz NOT NULL DEFAULT now(),
  last_saved_by_auth_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_consent_records (
  id uuid PRIMARY KEY,
  consent_ref text NOT NULL UNIQUE,
  candidate_ref text NOT NULL,
  consent_type text NOT NULL,
  lawful_basis text NOT NULL DEFAULT 'CONSENT',
  consent_status text NOT NULL,
  consent_text_snapshot text NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE public.candidate_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ref text NOT NULL UNIQUE,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  actor_auth_user_id uuid,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  reason_code text,
  evidence_ref text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_application_events_event_type_check CHECK (event_type IN (
    'APPLICATION_CREATED','READINESS_CHECKED','STATUS_CHANGED','EVIDENCE_ATTACHED',
    'MANUAL_PACKAGE_CREATED','MANUAL_ACTION_RECORDED','EVIDENCE_VERIFIED',
    'EVIDENCE_REJECTED','SUBMISSION_AUTHORIZED','SUBMISSION_ATTEMPT_CREATED',
    'SUBMISSION_DISPATCHED','PROVIDER_ACKNOWLEDGED','PROVIDER_STATUS_RECORDED',
    'PROVIDER_OUTCOME_RECORDED','REVIEW_DECISION_RECORDED','OUTCOME_RECORDED',
    'OUTCOME_DISPUTED','OUTCOME_CORRECTION_DECIDED','OUTCOME_SUPERSEDED',
    'CAO_CHOICES_UPDATED'
  )),
  FOREIGN KEY (application_id,candidate_id)
    REFERENCES public.candidate_applications(id,candidate_id) ON DELETE RESTRICT
);

CREATE TABLE public.candidate_application_submission_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_ref text NOT NULL UNIQUE,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  requested_by_auth_user_id uuid NOT NULL,
  delivery_mode text NOT NULL,
  job_status text NOT NULL,
  adapter_key text NOT NULL,
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
