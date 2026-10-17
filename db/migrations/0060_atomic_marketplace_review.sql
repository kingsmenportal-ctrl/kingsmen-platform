-- 0060: atomic founder/operator marketplace review with durable evidence audit.
-- The caller must have an authenticated Supabase identity and pass the database role guard.
CREATE OR REPLACE FUNCTION public.review_marketplace_entity(
  p_entity_kind text,
  p_entity_id uuid,
  p_decision text,
  p_evidence_urls text[] DEFAULT ARRAY[]::text[],
  p_notes text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous text;
  v_next text;
  v_transaction_id uuid := gen_random_uuid();
  v_event_id uuid;
  v_actor uuid := auth.uid();
  v_evidence text[] := COALESCE(p_evidence_urls, ARRAY[]::text[]);
  v_notes text := left(COALESCE(p_notes, ''), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_entity_id IS NULL OR p_entity_kind IS NULL OR p_entity_kind NOT IN ('ORGANISATION','LISTING') THEN
    RAISE EXCEPTION 'INVALID_REVIEW_TARGET' USING ERRCODE = '22023';
  END IF;
  IF p_decision IS NULL OR length(trim(p_decision)) = 0 THEN
    RAISE EXCEPTION 'REVIEW_DECISION_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF cardinality(v_evidence) > 10 THEN
    RAISE EXCEPTION 'TOO_MANY_EVIDENCE_URLS' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_evidence) AS u(value)
    WHERE length(value) > 2048
       OR value !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
       OR lower(substring(value from '^https://([^/:?#]+)')) IN ('localhost')
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.localhost'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.local'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.internal'
  ) THEN
    RAISE EXCEPTION 'INVALID_REVIEW_EVIDENCE_URL' USING ERRCODE = '22023';
  END IF;

  IF p_entity_kind = 'ORGANISATION' THEN
    IF p_decision NOT IN ('VERIFIED','REJECTED','SUSPENDED') THEN
      RAISE EXCEPTION 'INVALID_ORGANISATION_DECISION' USING ERRCODE = '22023';
    END IF;
    IF v_previous <> 'PENDING_REVIEW' AND NOT (p_decision = 'SUSPENDED' AND v_previous = 'VERIFIED') THEN
      RAISE EXCEPTION 'ORGANISATION_NOT_IN_REVIEWABLE_STATE' USING ERRCODE = '23514';
    END IF;
    IF p_decision = 'VERIFIED' AND cardinality(v_evidence) = 0 THEN
      RAISE EXCEPTION 'VERIFICATION_EVIDENCE_REQUIRED' USING ERRCODE = '22023';
    END IF;
    SELECT verification_status INTO v_previous
      FROM public.organisations WHERE id = p_entity_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ORGANISATION_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    v_next := p_decision;
    UPDATE public.organisations
      SET verification_status = v_next,
          verification_evidence = CASE WHEN cardinality(v_evidence) > 0 THEN v_evidence ELSE verification_evidence END,
          reviewed_by = v_actor,
          reviewed_at = now(),
          updated_at = now()
      WHERE id = p_entity_id;
  ELSE
    IF p_decision NOT IN ('PUBLISHED','REJECTED','CLOSED') THEN
      RAISE EXCEPTION 'INVALID_LISTING_DECISION' USING ERRCODE = '22023';
    END IF;
    IF (p_decision IN ('PUBLISHED','REJECTED') AND v_previous <> 'PENDING_REVIEW') OR (p_decision = 'CLOSED' AND v_previous <> 'PUBLISHED') THEN
      RAISE EXCEPTION 'LISTING_NOT_IN_REVIEWABLE_STATE' USING ERRCODE = '23514';
    END IF;
    IF p_decision = 'PUBLISHED' AND cardinality(v_evidence) = 0 THEN
      RAISE EXCEPTION 'PUBLICATION_EVIDENCE_REQUIRED' USING ERRCODE = '22023';
    END IF;
    SELECT status INTO v_previous
      FROM public.organisation_listings WHERE id = p_entity_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'LISTING_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    IF p_decision = 'PUBLISHED' AND NOT EXISTS (
      SELECT 1 FROM public.organisation_listings l
      JOIN public.organisations o ON o.id = l.organisation_id
      WHERE l.id = p_entity_id AND o.verification_status = 'VERIFIED'
    ) THEN
      RAISE EXCEPTION 'ORGANISATION_MUST_BE_VERIFIED_BEFORE_PUBLICATION' USING ERRCODE = '23514';
    END IF;
    v_next := p_decision;
    UPDATE public.organisation_listings
      SET status = v_next,
          source_verified_at = CASE WHEN v_next = 'PUBLISHED' THEN now() ELSE source_verified_at END,
          source_verified_by = CASE WHEN v_next = 'PUBLISHED' THEN v_actor ELSE source_verified_by END,
          evidence_refs = CASE WHEN cardinality(v_evidence) > 0 THEN v_evidence ELSE evidence_refs END,
          reviewed_by = v_actor,
          reviewed_at = now(),
          review_notes = v_notes,
          updated_at = now()
      WHERE id = p_entity_id;
  END IF;

  INSERT INTO public.marketplace_review_events(
    entity_kind, entity_id, actor_id, action, previous_state, new_state, evidence_urls, occurred_at, transaction_id
  ) VALUES (
    p_entity_kind, p_entity_id, v_actor, p_decision, v_previous, v_next, v_evidence, now(), v_transaction_id
  ) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object(
    'ok', true, 'entityKind', p_entity_kind, 'entityId', p_entity_id,
    'previousState', v_previous, 'newState', v_next,
    'transactionId', v_transaction_id, 'reviewEventId', v_event_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_marketplace_entity(text, uuid, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_marketplace_entity(text, uuid, text, text[], text) TO authenticated;
