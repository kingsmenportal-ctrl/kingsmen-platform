-- Minimal, disposable PostgreSQL 17 fixture for migration 0107.
-- No production data or credentials are used by this test database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;
DO $roles$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;
DO $roles$
BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

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

CREATE TABLE public.finance_plan_catalog (
  plan_code text PRIMARY KEY,
  plan_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  active boolean NOT NULL DEFAULT true,
  priority_application_count integer,
  managed_application_count integer NOT NULL DEFAULT 0,
  service_term_days integer NOT NULL DEFAULT 0,
  accommodation_route_count integer NOT NULL DEFAULT 0,
  accommodation_support_available boolean NOT NULL DEFAULT true,
  cv_versions integer NOT NULL DEFAULT 0,
  motivation_letters integer NOT NULL DEFAULT 0,
  upgrade_bonus_routes_when_cv_revamp_owned integer NOT NULL DEFAULT 0
);

CREATE TABLE public.finance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  candidate_ref text NOT NULL,
  plan_code text NOT NULL,
  order_status text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  catalogue_version text NOT NULL DEFAULT '1.0',
  service_term_days integer NOT NULL DEFAULT 0,
  managed_application_count integer NOT NULL DEFAULT 0,
  accommodation_route_count integer NOT NULL DEFAULT 0,
  cv_versions integer NOT NULL DEFAULT 0,
  motivation_letters integer NOT NULL DEFAULT 0,
  acknowledgement_target_business_hours integer NOT NULL DEFAULT 0,
  first_response_target_business_hours integer NOT NULL DEFAULT 0,
  upgrade_bonus_routes integer NOT NULL DEFAULT 0,
  refund_policy_version text NOT NULL DEFAULT 'TEST_V1',
  service_scope text NOT NULL DEFAULT '',
  entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_ref text NOT NULL UNIQUE,
  order_ref text NOT NULL REFERENCES public.finance_orders(order_ref),
  candidate_ref text NOT NULL,
  provider text NOT NULL DEFAULT 'PAYFAST',
  payment_status text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  amount_gross_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_ref text NOT NULL DEFAULT gen_random_uuid()::text,
  candidate_ref text NOT NULL,
  consent_type text NOT NULL,
  consent_status text NOT NULL,
  revoked_at timestamptz,
  consent_text_snapshot text NOT NULL DEFAULT '',
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_applications (
  id uuid PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  status text NOT NULL,
  UNIQUE (id, candidate_id)
);

CREATE TABLE public.candidate_application_submission_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.candidate_applications(id),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  job_status text NOT NULL DEFAULT 'PREPARED'
);

CREATE TABLE public.candidate_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.candidate_applications(id),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  event_type text NOT NULL
);

GRANT USAGE ON SCHEMA public, auth, kingsmen_security TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
