-- End-to-end migration-chain contract: 0107 -> 0108 -> 0109.
-- Run only in the isolated kingsmen_lifecycle PostgreSQL 17 database.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO public.candidates (id, public_ref, is_active) VALUES
  ('11111111-1111-4111-8111-111111111111', 'CAND-A', true),
  ('22222222-2222-4222-8222-222222222222', 'CAND-B', true),
  ('33333333-3333-4333-8333-333333333333', 'CAND-C', true),
  ('44444444-4444-4444-8444-444444444444', 'CAND-D-INACTIVE', false);

INSERT INTO public.candidate_auth_identity_links
  (id, supabase_user_id, candidate_id, link_status, verified_at, verified_by) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaaaaaaa-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'VERIFIED', now() - interval '2 minutes', 'fixture-reviewer'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'bbbbbbbb-0000-4000-8000-000000000002',
   '22222222-2222-4222-8222-222222222222', 'VERIFIED', now() - interval '2 minutes', 'fixture-reviewer'),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'dddddddd-0000-4000-8000-000000000004',
   '44444444-4444-4444-8444-444444444444', 'VERIFIED', now() - interval '2 minutes', 'fixture-reviewer');

INSERT INTO public.candidate_master_profiles (candidate_id, profile_data, pathway_preferences) VALUES
  ('11111111-1111-4111-8111-111111111111', '{"fixture":"A"}', '{"EMPLOYMENT":true}'),
  ('22222222-2222-4222-8222-222222222222', '{"fixture":"B"}', '{"TVET":true}');

INSERT INTO public.privacy_consent_records
  (id, consent_ref, candidate_ref, consent_type, lawful_basis, consent_status,
   consent_text_snapshot, evidence_refs, granted_at) VALUES
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'consent-fixture-A', 'CAND-A',
   'PROFILE_PROCESSING', 'CONSENT', 'ACTIVE', 'Fixture consent A', ARRAY['consent-evidence-A'], now() - interval '1 minute'),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'consent-fixture-B', 'CAND-B',
   'PROFILE_PROCESSING', 'CONSENT', 'ACTIVE', 'Fixture consent B', ARRAY['consent-evidence-B'], now() - interval '1 minute');

INSERT INTO public.opportunity_providers
  (provider_ref, provider_name, provider_type, sector, province, official_url,
   accreditation_status, source_confidence, safe_to_recommend, evidence_refs) VALUES
  ('provider-fixture-1', 'Fixture Employer', 'EMPLOYER', 'EMPLOYMENT', 'Gauteng',
   'https://provider.example/', 'VERIFIED', 'OFFICIAL_VERIFIED', true, ARRAY['provider-evidence-1']);

INSERT INTO public.opportunity_programmes
  (programme_ref, provider_ref, programme_name, sector, location_text, opening_status,
   source_confidence, candidate_facing_safe, exact_link, evidence_refs) VALUES
  ('programme-fixture-1', 'provider-fixture-1', 'Fixture employment role', 'EMPLOYER',
   'Gauteng', 'OPEN', 'OFFICIAL_VERIFIED', true, 'https://provider.example/job',
   ARRAY['programme-evidence-1']);

INSERT INTO public.candidate_opportunity_matches
  (candidate_match_ref, candidate_ref, programme_ref, provider_ref, sector,
   match_status, match_score, source_confidence, human_review_required,
   recommendation_summary, sealed_exact_target, evidence_refs) VALUES
  ('match-fixture-A', '11111111-1111-4111-8111-111111111111',
   'programme-fixture-1', 'provider-fixture-1', 'EMPLOYER',
   'APPROVED', 1, 'OFFICIAL_VERIFIED', false,
   'Fixture match, approved only for this disposable test.', false, ARRAY['match-evidence-1']);

INSERT INTO public.external_source_observations
  (observation_ref, source_url, source_title, sector, observed_claim, source_confidence,
   observation_status, observed_at, valid_until, stale_after, last_checked_at, evidence_refs) VALUES
  ('observation-fixture-1', 'https://provider.example/job', 'Fixture official role page',
   'EMPLOYMENT', 'Fixture application window', 'OFFICIAL_VERIFIED', 'VERIFIED',
   now() - interval '5 minutes', now() + interval '1 day', now() + interval '1 day',
   now() - interval '1 minute', ARRAY['source-observation-evidence-1']);

INSERT INTO public.opportunity_deadlines
  (deadline_ref, programme_ref, provider_ref, deadline_type, opens_at, closes_at,
   deadline_status, source_confidence, timezone, evidence_refs) VALUES
  ('deadline-fixture-1', 'programme-fixture-1', 'provider-fixture-1',
   'APPLICATION_WINDOW', now() - interval '1 hour', now() + interval '30 days',
   'CONFIRMED', 'OFFICIAL_VERIFIED', 'Africa/Johannesburg', ARRAY['deadline-evidence-1']);

INSERT INTO public.candidate_master_application_targets
  (candidate_id, target_key, pathway_type, provider_name, programme_or_role,
   provider_application_url, source_reference, source_confidence, planning_status,
   idempotency_key, created_by_auth_user_id) VALUES
  ('11111111-1111-4111-8111-111111111111', 'target-fixture-A',
   'EMPLOYMENT', 'Fixture Employer', 'Fixture employment role',
   'https://provider.example/job', 'N15 match reference: match-fixture-A',
   'A', 'PLANNING', 'target-fixture-idem-A',
   'aaaaaaaa-0000-4000-8000-000000000001'),
  ('33333333-3333-4333-8333-333333333333', 'target-fixture-C-no-link',
   'EMPLOYMENT', 'Fixture Employer', 'Fixture employment role',
   'https://provider.example/job', 'N15 match reference: match-fixture-A',
   'A', 'PLANNING', 'target-fixture-idem-C',
   'cccccccc-0000-4000-8000-000000000003');

-- Call the candidate-facing security-definer functions as authenticated, not as postgres.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);

DO $lifecycle$
DECLARE
  v_prepared jsonb;
  v_saved jsonb;
  v_loaded jsonb;
  v_application_id uuid;
  v_status text;
  v_count integer;
  v_message text;
  v_rejected boolean := false;
  v_inactive jsonb;
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.prepare_candidate_application_from_master_target(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated role cannot execute application preparation';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.save_candidate_application_draft(uuid,jsonb,integer,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_candidate_application_draft(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated role cannot execute draft read/write RPCs';
  END IF;

  v_prepared := public.prepare_candidate_application_from_master_target('target-fixture-A');
  IF v_prepared->>'ok' IS DISTINCT FROM 'true'
     OR v_prepared->>'created' IS DISTINCT FROM 'true'
     OR v_prepared->>'status' IS DISTINCT FROM 'DRAFT'
     OR v_prepared->>'provider_submission_sent' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION '0108 failed to prepare a truthful parent draft from the fresh approved match: %', v_prepared;
  END IF;

  v_application_id := (v_prepared->>'application_id')::uuid;
  SELECT status INTO v_status FROM public.candidate_applications WHERE id = v_application_id
    AND candidate_id = '11111111-1111-4111-8111-111111111111';
  IF v_status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'prepared parent application is not candidate-owned DRAFT';
  END IF;

  v_saved := public.save_candidate_application_draft(
    v_application_id,
    '{"motivation_statement":"Created from verified match","relevant_experience":"Disposable fixture","additional_answers":[{"question_key":"fixture-question-1","answer":"fixture answer"}]}'::jsonb,
    0,
    'chain-draft-save-001'
  );
  IF v_saved->>'ok' IS DISTINCT FROM 'true'
     OR (v_saved->>'draft_version')::integer <> 1
     OR v_saved->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_saved->>'readiness_recheck_required' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION '0109 failed to save draft created by 0108: %', v_saved;
  END IF;

  v_loaded := public.get_candidate_application_draft(v_application_id);
  IF v_loaded->>'ok' IS DISTINCT FROM 'true'
     OR v_loaded->>'draft_version' <> '1'
     OR v_loaded#>>'{draft,motivation_statement}' IS DISTINCT FROM 'Created from verified match'
     OR v_loaded#>>'{application,status}' IS DISTINCT FROM 'DRAFT'
     OR v_loaded->>'provider_submission_sent' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'parent application and saved answers did not round-trip: %', v_loaded;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_master_application_targets
    WHERE target_key = 'target-fixture-A'
      AND candidate_id = '11111111-1111-4111-8111-111111111111'
      AND application_id = v_application_id
      AND planning_status = 'PREPARING'
  ) THEN
    RAISE EXCEPTION '0108 did not link the new parent application to its owned target';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.candidate_application_events
  WHERE application_id = v_application_id
    AND candidate_id = '11111111-1111-4111-8111-111111111111'
    AND event_type IN ('APPLICATION_CREATED', 'APPLICATION_DRAFT_SAVED');
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'expected creation + draft-save audit events, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.candidate_application_submission_jobs
    WHERE application_id = v_application_id
      AND candidate_id = '11111111-1111-4111-8111-111111111111'
  ) OR EXISTS (
    SELECT 1 FROM public.candidate_application_events
    WHERE application_id = v_application_id
      AND event_type IN ('SUBMISSION_AUTHORIZED','SUBMISSION_ATTEMPT_CREATED','SUBMISSION_DISPATCHED','PROVIDER_ACKNOWLEDGED')
  ) THEN
    RAISE EXCEPTION 'preparation/draft save caused a provider submission side effect';
  END IF;

  -- No verified Auth-to-candidate link must fail closed.
  PERFORM set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000003', true);
  BEGIN
    PERFORM public.prepare_candidate_application_from_master_target('target-fixture-C-no-link');
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'application preparation did not reject an Auth user with no verified identity link';
  END IF;

  -- A verified but inactive candidate must not get a draft.
  PERFORM set_config('request.jwt.claim.sub', 'dddddddd-0000-4000-8000-000000000004', true);
  v_inactive := public.prepare_candidate_application_from_master_target('any-target-for-inactive-user');
  IF v_inactive->>'ok' IS DISTINCT FROM 'false'
     OR v_inactive->>'code' IS DISTINCT FROM 'ACTIVE_CANDIDATE_REQUIRED' THEN
    RAISE EXCEPTION 'inactive candidate gate failed: %', v_inactive;
  END IF;
END
$lifecycle$;

RESET ROLE;

SELECT 'PASS: full 0107 -> 0108 -> 0109 application lifecycle contract' AS result;
ROLLBACK;
