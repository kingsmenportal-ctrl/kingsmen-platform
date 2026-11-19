-- Disposable contract fixture for migration 0109. Never point this at Supabase.
-- GitHub Actions runs this against an ephemeral PostgreSQL 17 service.
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
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY,
  public_ref text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.candidate_auth_identity_links (
  id uuid PRIMARY KEY,
  supabase_user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  link_status text NOT NULL,
  verified_at timestamptz,
  verified_by uuid
);

CREATE TABLE public.candidate_opportunities (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  provider_name text NOT NULL,
  source_url text,
  closes_at timestamptz
);

CREATE TABLE public.candidate_applications (
  id uuid PRIMARY KEY,
  application_ref text NOT NULL UNIQUE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
  pathway_type text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  readiness_status text NOT NULL DEFAULT 'NOT_CHECKED',
  readiness_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_reference text,
  submission_evidence_ref text,
  submitted_at timestamptz,
  last_status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, candidate_id)
);

CREATE TABLE public.candidate_master_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_consent_records (
  id uuid PRIMARY KEY,
  candidate_ref text NOT NULL,
  consent_type text NOT NULL,
  consent_status text NOT NULL,
  revoked_at timestamptz,
  consent_text_snapshot text,
  granted_at timestamptz NOT NULL
);

CREATE TABLE public.candidate_application_events (
  event_ref text PRIMARY KEY,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  actor_auth_user_id uuid NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  reason_code text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (application_id, candidate_id)
    REFERENCES public.candidate_applications(id, candidate_id) ON DELETE RESTRICT
);
