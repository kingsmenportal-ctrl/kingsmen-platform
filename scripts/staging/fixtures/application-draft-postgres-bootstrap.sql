-- Minimal isolated PostgreSQL 17 fixture for 0109 candidate application draft persistence.
-- Test-only identities and records. This file must never be pointed at shared staging/production.
\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $roles$;
DO $roles$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $roles$;
DO $roles$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $roles$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS kingsmen_security;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$function$;

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY,
  public_ref text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.candidate_auth_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  link_status text NOT NULL,
  verified_at timestamptz,
  verified_by text
);

CREATE TABLE public.candidate_master_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id),
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pathway_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_ref text NOT NULL,
  consent_type text NOT NULL,
  consent_status text NOT NULL,
  revoked_at timestamptz,
  consent_text_snapshot text NOT NULL DEFAULT '',
  granted_at timestamptz NOT NULL DEFAULT now()
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
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id),
  pathway_type text NOT NULL,
  status text NOT NULL,
  readiness_status text NOT NULL DEFAULT 'NOT_CHECKED',
  readiness_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, candidate_id)
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
    REFERENCES public.candidate_applications(id, candidate_id)
);

GRANT USAGE ON SCHEMA public, auth, kingsmen_security TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
