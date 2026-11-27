\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS kingsmen_security;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY,
  public_ref text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.candidate_accounts (
  candidate_id uuid PRIMARY KEY REFERENCES public.candidates(id),
  auth_user_id uuid,
  email text UNIQUE NOT NULL,
  email_verified boolean NOT NULL DEFAULT false
);
CREATE TABLE public.candidate_auth_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  link_status text NOT NULL,
  verified_at timestamptz,
  verified_by text
);
CREATE TABLE public.platform_reviewers (
  auth_user_id uuid NOT NULL,
  role_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz
);
CREATE TABLE public.candidate_private_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  created_by_auth_user_id uuid NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  document_type text NOT NULL DEFAULT 'OTHER',
  application_id uuid,
  preparation_item_id uuid,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  sha256_hex text,
  status text NOT NULL DEFAULT 'UPLOADED_CANDIDATE_REPORTED',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.candidate_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  event_type text NOT NULL,
  from_status text,
  to_status text,
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.candidate_private_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  actor_type text NOT NULL DEFAULT 'REVIEWER',
  event_type text NOT NULL,
  from_status text,
  to_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
