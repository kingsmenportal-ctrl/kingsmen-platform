-- Isolated PostgreSQL fixture for 0110 N15 source review. No Supabase live connection.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')
$function$;
GRANT EXECUTE ON FUNCTION auth.role() TO PUBLIC;

CREATE TABLE public.opportunity_source_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_ref text NOT NULL UNIQUE,
  authority_name text NOT NULL,
  authority_type text NOT NULL,
  base_url text NOT NULL,
  sector_scope text[] NOT NULL DEFAULT ARRAY[]::text[],
  confidence_band text NOT NULL DEFAULT 'OFFICIAL_VERIFIED'
    CHECK (confidence_band IN ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.external_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_ref text NOT NULL UNIQUE,
  authority_ref text,
  source_url text NOT NULL,
  source_title text NOT NULL,
  sector text NOT NULL,
  observed_claim text NOT NULL,
  source_confidence text NOT NULL DEFAULT 'MEDIUM'
    CHECK (source_confidence IN ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  observation_status text NOT NULL DEFAULT 'NEEDS_REVIEW'
    CHECK (observation_status IN ('DRAFT','NEEDS_REVIEW','VERIFIED','STALE','REJECTED','ARCHIVED')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  stale_after timestamptz,
  last_checked_at timestamptz,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  review_reason text
);

CREATE TABLE public.opportunity_verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_ref text NOT NULL UNIQUE,
  target_type text NOT NULL CHECK (target_type IN ('SOURCE','PROVIDER','PROGRAMME','DEADLINE','ELIGIBILITY','FEE','SIGNAL')),
  target_ref text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (review_status IN ('PENDING_REVIEW','APPROVED','REJECTED','STALE','SUPERSEDED')),
  source_confidence_before text NOT NULL CHECK (source_confidence_before IN ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  source_confidence_after text CHECK (source_confidence_after IS NULL OR source_confidence_after IN ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  reviewer_ref text,
  review_reason text NOT NULL DEFAULT '',
  decision_notes text,
  evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

INSERT INTO public.opportunity_source_authorities
  (authority_ref, authority_name, authority_type, base_url, sector_scope, confidence_band, active, notes)
VALUES
  ('AUTH-DHET-CI', 'CI Department Authority', 'GOVERNMENT_REGISTER', 'https://dhet.example/', ARRAY['HIGHER_EDUCATION','TVET'], 'OFFICIAL_VERIFIED', true, 'Synthetic test fixture only'),
  ('AUTH-INACTIVE-CI', 'Inactive CI Authority', 'GOVERNMENT_REGISTER', 'https://inactive.example/', ARRAY['EMPLOYMENT'], 'OFFICIAL_VERIFIED', false, 'Synthetic test fixture only');

INSERT INTO public.external_source_observations
  (observation_ref, authority_ref, source_url, source_title, sector, observed_claim, source_confidence, observation_status, observed_at, last_checked_at, stale_after, evidence_refs, review_reason)
VALUES
  ('obs-approve', 'AUTH-DHET-CI', 'https://dhet.example/opportunities/one', 'CI Opportunity One', 'HIGHER_EDUCATION', 'Synthetic source-link observation.', 'HIGH', 'NEEDS_REVIEW', now() - interval '1 hour', now() - interval '1 hour', now() - interval '30 minutes', ARRAY['https://dhet.example/'], 'AUTOMATED_LINK_DISCOVERY_ONLY'),
  ('obs-reject', 'AUTH-DHET-CI', 'https://dhet.example/opportunities/two', 'CI Opportunity Two', 'TVET', 'Synthetic source-link observation.', 'HIGH', 'NEEDS_REVIEW', now() - interval '1 hour', now() - interval '1 hour', now() - interval '30 minutes', ARRAY['https://dhet.example/'], 'AUTOMATED_LINK_DISCOVERY_ONLY'),
  ('obs-stale', 'AUTH-DHET-CI', 'https://dhet.example/opportunities/three', 'CI Opportunity Three', 'TVET', 'Synthetic source-link observation.', 'MEDIUM', 'NEEDS_REVIEW', now() - interval '1 hour', now() - interval '1 hour', now() - interval '30 minutes', ARRAY['https://dhet.example/'], 'AUTOMATED_LINK_DISCOVERY_ONLY'),
  ('obs-off-domain', 'AUTH-DHET-CI', 'https://outside.example/opportunities/four', 'CI Off-Domain Link', 'EMPLOYMENT', 'Synthetic source-link observation.', 'HIGH', 'NEEDS_REVIEW', now() - interval '1 hour', now() - interval '1 hour', now() - interval '30 minutes', ARRAY['https://dhet.example/'], 'AUTOMATED_LINK_DISCOVERY_ONLY'),
  ('obs-inactive-authority', 'AUTH-INACTIVE-CI', 'https://inactive.example/opportunities/five', 'CI Inactive Authority Link', 'EMPLOYMENT', 'Synthetic source-link observation.', 'HIGH', 'NEEDS_REVIEW', now() - interval '1 hour', now() - interval '1 hour', now() - interval '30 minutes', ARRAY['https://inactive.example/'], 'AUTOMATED_LINK_DISCOVERY_ONLY');
