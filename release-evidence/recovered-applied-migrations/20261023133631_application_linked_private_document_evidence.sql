-- Link private candidate documents to an explicitly selected candidate-owned application.
-- A verified review creates an application-evidence row in the same transaction.
-- Candidate document evidence is deliberately distinct from provider submission/outcome evidence.
ALTER TABLE public.candidate_applications
  ADD CONSTRAINT candidate_applications_id_candidate_id_key UNIQUE (id, candidate_id);
ALTER TABLE public.candidate_private_documents ADD COLUMN application_id uuid NULL;
ALTER TABLE public.candidate_private_documents
  ADD CONSTRAINT candidate_private_documents_application_owner_fk
  FOREIGN KEY (application_id, candidate_id)
  REFERENCES public.candidate_applications (id, candidate_id) ON DELETE RESTRICT;
ALTER TABLE public.candidate_application_evidence DROP CONSTRAINT candidate_application_evidence_evidence_type_check;
ALTER TABLE public.candidate_application_evidence ADD CONSTRAINT candidate_application_evidence_evidence_type_check
  CHECK (evidence_type = ANY (ARRAY['PRE_SUBMISSION_CHECKLIST','CANDIDATE_DOCUMENT','PROVIDER_SUBMISSION_RECEIPT','PROVIDER_REFERENCE','PROVIDER_STATUS_NOTICE','PROVIDER_OUTCOME_NOTICE','REVIEW_NOTE']));
CREATE INDEX candidate_private_documents_application_id_idx ON public.candidate_private_documents (application_id) WHERE application_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.link_verified_private_document_to_application_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_document public.candidate_private_documents%rowtype;
BEGIN
  IF NEW.decision <> 'VERIFIED' THEN RETURN NEW; END IF;
  SELECT d.* INTO v_document FROM public.candidate_private_documents d
   WHERE d.id = NEW.document_id AND d.candidate_id = NEW.candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Verified document review must reference its matching private document.'; END IF;
  IF v_document.application_id IS NULL THEN RETURN NEW; END IF;
  IF v_document.status <> 'VERIFIED' OR v_document.sha256_hex IS NULL OR v_document.uploaded_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application evidence requires a finalized, hash-verified private document.';
  END IF;
  INSERT INTO public.candidate_application_evidence (
    evidence_ref, application_id, candidate_id, evidence_type, evidence_locator, evidence_sha256,
    source_label, captured_at, verification_status, verification_note, verified_by_auth_user_id,
    verified_at, created_by_auth_user_id
  ) VALUES (
    'private-document:' || v_document.id::text, v_document.application_id, v_document.candidate_id,
    'CANDIDATE_DOCUMENT', 'private-document:' || v_document.id::text, v_document.sha256_hex,
    'Kingsmen private document verification', v_document.uploaded_at, 'VERIFIED',
    'Authorized reviewer verified the uploaded document. ' || left(trim(NEW.reviewer_note), 1100),
    NEW.reviewer_auth_user_id, now(), NEW.reviewer_auth_user_id
  ) ON CONFLICT (evidence_ref) DO NOTHING;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_application_evidence e
     WHERE e.evidence_ref = 'private-document:' || v_document.id::text
       AND e.application_id = v_document.application_id AND e.candidate_id = v_document.candidate_id
       AND e.evidence_sha256 = v_document.sha256_hex AND e.verification_status = 'VERIFIED'
       AND e.verified_by_auth_user_id = NEW.reviewer_auth_user_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Private document evidence link conflicts with existing application evidence.';
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS candidate_private_document_application_evidence_link ON public.candidate_private_document_reviews;
CREATE TRIGGER candidate_private_document_application_evidence_link
AFTER INSERT ON public.candidate_private_document_reviews
FOR EACH ROW WHEN (NEW.decision = 'VERIFIED')
EXECUTE FUNCTION public.link_verified_private_document_to_application_evidence();
REVOKE ALL ON FUNCTION public.link_verified_private_document_to_application_evidence() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_verified_private_document_to_application_evidence() FROM anon;
REVOKE ALL ON FUNCTION public.link_verified_private_document_to_application_evidence() FROM authenticated;
COMMENT ON FUNCTION public.link_verified_private_document_to_application_evidence() IS
  'Transactionally links an authorized VERIFIED private-document review to CANDIDATE_DOCUMENT evidence on the same candidate-owned application. This evidence never substitutes for a provider receipt or outcome notice.';
