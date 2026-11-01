-- 0103: reusable candidate application packets.
-- A packet is a private preparation artefact. It does not create a provider submission,
-- does not claim provider receipt, and does not imply a provider-specific form template.
BEGIN;

CREATE TABLE IF NOT EXISTS public.candidate_application_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_ref text NOT NULL UNIQUE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.candidate_master_application_targets(id) ON DELETE CASCADE,
  pathway_type text NOT NULL CHECK (pathway_type IN (
    'HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT'
  )),
  provider_key text NOT NULL CHECK (length(trim(provider_key)) BETWEEN 3 AND 100),
  provider_name text NOT NULL CHECK (length(trim(provider_name)) BETWEEN 1 AND 180),
  programme_or_role text NOT NULL CHECK (length(trim(programme_or_role)) BETWEEN 2 AND 240),
  packet_status text NOT NULL DEFAULT 'PROVIDER_REQUIREMENTS_PENDING'
    CHECK (packet_status IN ('PREPARING','GENERIC_PROFILE_READY','PROVIDER_REQUIREMENTS_PENDING','ARCHIVED')),
  template_status text NOT NULL DEFAULT 'NO_VERIFIED_PROVIDER_TEMPLATE'
    CHECK (template_status IN ('NO_VERIFIED_PROVIDER_TEMPLATE','VERIFIED_PROVIDER_TEMPLATE')),
  candidate_profile_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  application_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_profile_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  selected_document_count integer NOT NULL DEFAULT 0 CHECK (selected_document_count BETWEEN 0 AND 20),
  provider_requirements_status text NOT NULL DEFAULT 'NOT_VERIFIED'
    CHECK (provider_requirements_status IN ('NOT_VERIFIED','VERIFIED')),
  provider_submission_sent boolean NOT NULL DEFAULT false,
  provider_receipt_confirmed boolean NOT NULL DEFAULT false,
  provider_integration_state text NOT NULL DEFAULT 'NOT_CONNECTED'
    CHECK (provider_integration_state IN ('NOT_CONNECTED','AUTHORISED_TESTING','CONNECTED')),
  created_by_auth_user_id uuid NOT NULL,
  updated_by_auth_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, target_id)
);

CREATE INDEX IF NOT EXISTS candidate_application_packets_candidate_updated_idx
  ON public.candidate_application_packets(candidate_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS candidate_application_packets_target_idx
  ON public.candidate_application_packets(target_id);

CREATE TABLE IF NOT EXISTS public.candidate_application_packet_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.candidate_application_packets(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  private_document_id uuid NOT NULL REFERENCES public.candidate_private_documents(id) ON DELETE RESTRICT,
  document_type_snapshot text NOT NULL,
  original_filename_snapshot text NOT NULL,
  selected_by_auth_user_id uuid NOT NULL,
  selected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (packet_id, private_document_id)
);

CREATE INDEX IF NOT EXISTS candidate_application_packet_documents_candidate_idx
  ON public.candidate_application_packet_documents(candidate_id, packet_id);

CREATE OR REPLACE FUNCTION private.guard_candidate_application_packet_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_target_candidate_id uuid;
BEGIN
  SELECT candidate_id INTO v_target_candidate_id
  FROM public.candidate_master_application_targets
  WHERE id = NEW.target_id;

  IF v_target_candidate_id IS NULL OR v_target_candidate_id <> NEW.candidate_id THEN
    RAISE EXCEPTION 'APPLICATION_PACKET_TARGET_OWNER_MISMATCH' USING ERRCODE = '42501';
  END IF;

  IF NEW.provider_submission_sent OR NEW.provider_receipt_confirmed THEN
    RAISE EXCEPTION 'PREPARATION_PACKET_CANNOT_ASSERT_PROVIDER_SUBMISSION_OR_RECEIPT' USING ERRCODE = '42501';
  END IF;

  IF NEW.template_status = 'VERIFIED_PROVIDER_TEMPLATE' AND NEW.provider_requirements_status <> 'VERIFIED' THEN
    RAISE EXCEPTION 'VERIFIED_APPLICATION_TEMPLATE_REQUIRES_PROVIDER_REQUIREMENT_EVIDENCE' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION private.guard_candidate_application_packet_owner() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.guard_candidate_application_packet_owner() TO service_role;

DROP TRIGGER IF EXISTS candidate_application_packets_owner_guard ON public.candidate_application_packets;
CREATE TRIGGER candidate_application_packets_owner_guard
BEFORE INSERT OR UPDATE ON public.candidate_application_packets
FOR EACH ROW EXECUTE FUNCTION private.guard_candidate_application_packet_owner();

CREATE OR REPLACE FUNCTION private.guard_candidate_application_packet_document()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_packet_candidate_id uuid;
  v_document_candidate_id uuid;
  v_document_status text;
  v_document_type text;
  v_original_filename text;
BEGIN
  SELECT candidate_id INTO v_packet_candidate_id
  FROM public.candidate_application_packets
  WHERE id = NEW.packet_id;

  SELECT candidate_id, status, document_type, original_filename
    INTO v_document_candidate_id, v_document_status, v_document_type, v_original_filename
  FROM public.candidate_private_documents
  WHERE id = NEW.private_document_id;

  IF v_packet_candidate_id IS NULL OR v_packet_candidate_id <> NEW.candidate_id
     OR v_document_candidate_id IS NULL OR v_document_candidate_id <> NEW.candidate_id THEN
    RAISE EXCEPTION 'APPLICATION_PACKET_DOCUMENT_OWNER_MISMATCH' USING ERRCODE = '42501';
  END IF;

  IF v_document_status NOT IN ('UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW','VERIFIED') THEN
    RAISE EXCEPTION 'APPLICATION_PACKET_DOCUMENT_NOT_AVAILABLE' USING ERRCODE = '22023';
  END IF;

  NEW.document_type_snapshot := v_document_type;
  NEW.original_filename_snapshot := v_original_filename;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION private.guard_candidate_application_packet_document() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.guard_candidate_application_packet_document() TO service_role;

DROP TRIGGER IF EXISTS candidate_application_packet_documents_owner_guard ON public.candidate_application_packet_documents;
CREATE TRIGGER candidate_application_packet_documents_owner_guard
BEFORE INSERT OR UPDATE ON public.candidate_application_packet_documents
FOR EACH ROW EXECUTE FUNCTION private.guard_candidate_application_packet_document();

ALTER TABLE public.candidate_application_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_packet_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_application_packets_select_own ON public.candidate_application_packets;
CREATE POLICY candidate_application_packets_select_own
  ON public.candidate_application_packets
  FOR SELECT TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id());

DROP POLICY IF EXISTS candidate_application_packet_documents_select_own ON public.candidate_application_packet_documents;
CREATE POLICY candidate_application_packet_documents_select_own
  ON public.candidate_application_packet_documents
  FOR SELECT TO authenticated
  USING (candidate_id = kingsmen_security.current_authenticated_candidate_id());

REVOKE ALL ON TABLE public.candidate_application_packets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.candidate_application_packet_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.candidate_application_packets TO authenticated;
GRANT SELECT ON TABLE public.candidate_application_packet_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_application_packets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_application_packet_documents TO service_role;

COMMENT ON TABLE public.candidate_application_packets IS
  'Private reusable candidate application preparation packet; provider-specific requirements and submissions remain unverified until separately evidenced.';
COMMENT ON TABLE public.candidate_application_packet_documents IS
  'References to candidate-owned private Document Vault files selected for an application preparation packet; binary content is never copied.';
COMMENT ON COLUMN public.candidate_application_packets.template_status IS
  'NO_VERIFIED_PROVIDER_TEMPLATE means this is only a reusable profile/document preparation packet, not a completed institution form.';
COMMENT ON COLUMN public.candidate_application_packets.provider_submission_sent IS
  'Remains false for preparation packets. Only a separate authorised provider submission/receipt workflow may record an external submission.';

COMMIT;
