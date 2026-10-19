-- Authorised candidate-document review: reviewer-only decisions and durable evidence.
CREATE TABLE IF NOT EXISTS public.candidate_private_document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.candidate_private_documents(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  reviewer_auth_user_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('VERIFIED','REJECTED')),
  reviewer_note text NOT NULL CHECK (length(trim(reviewer_note)) BETWEEN 3 AND 1200),
  evidence_reference text NOT NULL CHECK (length(trim(evidence_reference)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS candidate_private_document_reviews_document_time_idx
  ON public.candidate_private_document_reviews(document_id, created_at DESC);
ALTER TABLE public.candidate_private_document_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_private_document_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.candidate_private_document_reviews TO service_role;
GRANT SELECT, UPDATE ON public.candidate_private_documents TO service_role;
GRANT SELECT, INSERT ON public.candidate_private_document_events TO service_role;

CREATE OR REPLACE FUNCTION public.review_candidate_private_document(
  p_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_reviewer_note text,
  p_evidence_reference text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_doc public.candidate_private_documents%ROWTYPE;
  v_note text := trim(coalesce(p_reviewer_note, ''));
  v_evidence text := trim(coalesce(p_evidence_reference, ''));
BEGIN
  IF p_document_id IS NULL OR p_reviewer_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Document and reviewer are required' USING ERRCODE = '22023';
  END IF;
  IF p_decision NOT IN ('VERIFIED','REJECTED') THEN
    RAISE EXCEPTION 'Unsupported document review decision' USING ERRCODE = '22023';
  END IF;
  IF length(v_note) < 3 OR length(v_note) > 1200 OR length(v_evidence) < 3 OR length(v_evidence) > 500 THEN
    RAISE EXCEPTION 'Reviewer note and evidence reference are required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_reviewers r
    WHERE r.auth_user_id = p_reviewer_auth_user_id
      AND r.is_active = true AND r.revoked_at IS NULL
      AND r.role_code = 'PLATFORM_ADMIN'
  ) THEN
    RAISE EXCEPTION 'Reviewer is not authorised for document decisions' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_doc
  FROM public.candidate_private_documents
  WHERE id = p_document_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Private document not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_doc.status NOT IN ('UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW') THEN
    RAISE EXCEPTION 'Document is not awaiting review' USING ERRCODE = '55000';
  END IF;
  UPDATE public.candidate_private_documents
    SET status = p_decision, updated_at = now()
    WHERE id = v_doc.id;
  INSERT INTO public.candidate_private_document_reviews
    (document_id, candidate_id, reviewer_auth_user_id, decision, reviewer_note, evidence_reference)
    VALUES (v_doc.id, v_doc.candidate_id, p_reviewer_auth_user_id, p_decision, v_note, v_evidence);
  INSERT INTO public.candidate_private_document_events
    (document_id, candidate_id, actor_type, event_type, from_status, to_status, metadata)
    VALUES (v_doc.id, v_doc.candidate_id, 'REVIEWER', 'REVIEW_STATUS_CHANGED',
      v_doc.status, p_decision,
      jsonb_build_object('reviewer_auth_user_id', p_reviewer_auth_user_id,
        'review_id', (SELECT id FROM public.candidate_private_document_reviews
          WHERE document_id = v_doc.id ORDER BY created_at DESC, id DESC LIMIT 1),
        'evidence_reference', v_evidence));
  RETURN jsonb_build_object('documentId', v_doc.id, 'status', p_decision);
END;
$function$;
REVOKE ALL ON FUNCTION public.review_candidate_private_document(uuid,uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_candidate_private_document(uuid,uuid,text,text,text) TO service_role;
