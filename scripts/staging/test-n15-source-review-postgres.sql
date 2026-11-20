\set ON_ERROR_STOP on
BEGIN;

DO $acl$
BEGIN
  IF has_function_privilege('anon', 'public.record_n15_source_review_decision(text,text,text,text,text,text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute source-review RPC';
  END IF;
  IF has_function_privilege('authenticated', 'public.record_n15_source_review_decision(text,text,text,text,text,text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute source-review RPC';
  END IF;
  IF has_function_privilege('service_role', 'public.record_n15_source_review_decision(text,text,text,text,text,text[])', 'EXECUTE') IS NOT TRUE THEN
    RAISE EXCEPTION 'service_role must execute source-review RPC';
  END IF;
END
$acl$;

SELECT set_config('request.jwt.claim.role', 'service_role', true);

DO $test$
DECLARE
  v jsonb;
  v_row public.external_source_observations%ROWTYPE;
  v_reviews integer;
BEGIN
  v := public.record_n15_source_review_decision(
    'obs-approve',
    'APPROVE_OFFICIAL_SOURCE',
    'reviewer-ci-001',
    'Human inspected the authority-controlled source.',
    'The link is under the approved authority hostname. Opening status remains unverified.',
    ARRAY['https://dhet.example/opportunities/one','https://dhet.example/']
  );
  IF v->>'ok' IS DISTINCT FROM 'true'
     OR v->>'observation_status' IS DISTINCT FROM 'VERIFIED'
     OR v->>'source_confidence' IS DISTINCT FROM 'OFFICIAL_VERIFIED'
     OR v->>'published_opportunities_created' IS DISTINCT FROM 'false'
     OR v->>'programme_opening_status_changed' IS DISTINCT FROM 'false'
     OR v->>'deadline_status_changed' IS DISTINCT FROM 'false'
     OR v->>'eligibility_rules_changed' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'official source review did not return safe success: %', v;
  END IF;
  SELECT * INTO v_row FROM public.external_source_observations WHERE observation_ref='obs-approve';
  IF v_row.observation_status <> 'VERIFIED'
     OR v_row.source_confidence <> 'OFFICIAL_VERIFIED'
     OR v_row.stale_after <= clock_timestamp()
     OR NOT ('https://dhet.example/opportunities/one' = ANY(v_row.evidence_refs)) THEN
    RAISE EXCEPTION 'approved observation not persisted with expected confidence, evidence or freshness';
  END IF;
  SELECT count(*) INTO v_reviews FROM public.opportunity_verification_reviews
   WHERE target_type='SOURCE' AND target_ref='obs-approve' AND review_status='APPROVED'
     AND reviewer_ref='reviewer-ci-001' AND reviewed_at IS NOT NULL;
  IF v_reviews <> 1 THEN RAISE EXCEPTION 'source approval audit row missing'; END IF;

  v := public.record_n15_source_review_decision(
    'obs-approve',
    'APPROVE_OFFICIAL_SOURCE',
    'reviewer-ci-001',
    'Attempt duplicate review.',
    NULL,
    ARRAY['https://dhet.example/opportunities/one']
  );
  IF v->>'code' IS DISTINCT FROM 'SOURCE_OBSERVATION_ALREADY_DECIDED' THEN
    RAISE EXCEPTION 'duplicate source review was not rejected: %', v;
  END IF;
  SELECT count(*) INTO v_reviews FROM public.opportunity_verification_reviews WHERE target_ref='obs-approve';
  IF v_reviews <> 1 THEN RAISE EXCEPTION 'duplicate review created a second audit row'; END IF;

  v := public.record_n15_source_review_decision(
    'obs-reject',
    'REJECT_SOURCE',
    'reviewer-ci-002',
    'The discovered link is not suitable to retain.',
    'Link target is invalid for the declared source.',
    ARRAY['https://dhet.example/opportunities/two']
  );
  IF v->>'ok' IS DISTINCT FROM 'true' OR v->>'observation_status' IS DISTINCT FROM 'REJECTED'
     OR v->>'source_confidence' IS DISTINCT FROM 'LOW' THEN
    RAISE EXCEPTION 'source rejection was not persisted safely: %', v;
  END IF;

  v := public.record_n15_source_review_decision(
    'obs-stale',
    'MARK_SOURCE_STALE',
    'reviewer-ci-003',
    'The previous source check is no longer current.',
    NULL,
    ARRAY['https://dhet.example/opportunities/three']
  );
  IF v->>'ok' IS DISTINCT FROM 'true' OR v->>'observation_status' IS DISTINCT FROM 'STALE'
     OR v->>'source_confidence' IS DISTINCT FROM 'MEDIUM' THEN
    RAISE EXCEPTION 'stale-source decision did not preserve its confidence band: %', v;
  END IF;

  v := public.record_n15_source_review_decision(
    'obs-off-domain',
    'APPROVE_OFFICIAL_SOURCE',
    'reviewer-ci-004',
    'Attempt off-domain approval.',
    NULL,
    ARRAY['https://dhet.example/']
  );
  IF v->>'code' IS DISTINCT FROM 'SOURCE_URL_OUTSIDE_AUTHORITY' THEN
    RAISE EXCEPTION 'off-domain source was not blocked: %', v;
  END IF;
  SELECT * INTO v_row FROM public.external_source_observations WHERE observation_ref='obs-off-domain';
  IF v_row.observation_status <> 'NEEDS_REVIEW' THEN
    RAISE EXCEPTION 'off-domain failed approval mutated the observation';
  END IF;

  v := public.record_n15_source_review_decision(
    'obs-inactive-authority',
    'APPROVE_OFFICIAL_SOURCE',
    'reviewer-ci-005',
    'Attempt approval under an inactive authority.',
    NULL,
    ARRAY['https://inactive.example/opportunities/five']
  );
  IF v->>'code' IS DISTINCT FROM 'SOURCE_AUTHORITY_NOT_VERIFIED' THEN
    RAISE EXCEPTION 'inactive authority was not blocked: %', v;
  END IF;

  v := public.record_n15_source_review_decision(
    'obs-approve',
    'APPROVE_OFFICIAL_SOURCE',
    'reviewer-ci-006',
    'Try evidence without authority host.',
    NULL,
    ARRAY['https://unrelated.example/evidence']
  );
  IF v->>'code' IS DISTINCT FROM 'SOURCE_OBSERVATION_ALREADY_DECIDED' THEN
    RAISE EXCEPTION 'already-decided guard should precede evidence check: %', v;
  END IF;
END
$test$;

SELECT set_config('request.jwt.claim.role', 'authenticated', true);
DO $authz$
DECLARE
  v_denied boolean := false;
  v_msg text;
BEGIN
  BEGIN
    PERFORM public.record_n15_source_review_decision(
      'obs-reject',
      'REJECT_SOURCE',
      'candidate-user',
      'Candidate cannot review this source.',
      NULL,
      ARRAY['https://dhet.example/opportunities/two']
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_denied := v_msg = 'N15_SOURCE_REVIEW_SERVICE_ROLE_REQUIRED';
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'non-service role execution was not denied'; END IF;
END
$authz$;

ROLLBACK;
SELECT 'PASS: N15 source review atomicity, authority, idempotency and least privilege' AS result;
