-- Integration contract for 0109 against disposable PostgreSQL 17 only.
-- Requires fixture setup and db/migrations/0109_candidate_application_draft_persistence_20261101.sql.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO public.candidates (id, public_ref, is_active) VALUES
  ('11111111-1111-4111-8111-111111111111', 'CAND-A', true),
  ('22222222-2222-4222-8222-222222222222', 'CAND-B', true),
  ('33333333-3333-4333-8333-333333333333', 'CAND-C', true);

INSERT INTO public.candidate_auth_identity_links
  (id, supabase_user_id, candidate_id, link_status, verified_at, verified_by) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaaaaaaa-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'VERIFIED', now() - interval '1 minute', '99999999-9999-4999-8999-999999999999'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'bbbbbbbb-0000-4000-8000-000000000002',
   '22222222-2222-4222-8222-222222222222', 'VERIFIED', now() - interval '1 minute', '99999999-9999-4999-8999-999999999999'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'cccccccc-0000-4000-8000-000000000003',
   '33333333-3333-4333-8333-333333333333', 'VERIFIED', now() - interval '1 minute', '99999999-9999-4999-8999-999999999999');

INSERT INTO public.candidate_master_profiles (candidate_id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

INSERT INTO public.privacy_consent_records
  (id, candidate_ref, consent_type, consent_status, revoked_at, consent_text_snapshot, granted_at) VALUES
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'CAND-A', 'PROFILE_PROCESSING', 'ACTIVE', NULL, 'Fixture consent A', now() - interval '1 minute'),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'CAND-B', 'PROFILE_PROCESSING', 'ACTIVE', NULL, 'Fixture consent B', now() - interval '1 minute'),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 'CAND-C', 'PROFILE_PROCESSING', 'ACTIVE', NULL, 'Fixture consent C', now() - interval '1 minute');

INSERT INTO public.candidate_opportunities (id, title, provider_name, source_url, closes_at) VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'Fixture opportunity A', 'Fixture provider', 'https://provider.example/a', now() + interval '30 days'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'Fixture opportunity B', 'Fixture provider', 'https://provider.example/b', now() + interval '30 days'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'Fixture opportunity C', 'Fixture provider', 'https://provider.example/c', now() + interval '30 days');

INSERT INTO public.candidate_applications
  (id, application_ref, candidate_id, opportunity_id, pathway_type, status, kingsmen_status, readiness_status, readiness_snapshot) VALUES
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'FIXTURE-A-1', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'EMPLOYMENT', 'READY_TO_SUBMIT', 'Draft', 'READY', '{"fixture":true}'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', 'FIXTURE-B-1', '22222222-2222-4222-8222-222222222222',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'TVET', 'DRAFT', 'Action required', 'NOT_CHECKED', '{}'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff3', 'FIXTURE-C-1', '33333333-3333-4333-8333-333333333333',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'INTERNSHIP', 'DRAFT', 'Draft', 'NOT_CHECKED', '{}');

DO $test$
DECLARE
  v_result jsonb;
  v_message text;
  v_rejected boolean;
  v_count integer;
BEGIN
  -- The source database's existing event allowlist must be widened by migration 0109.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.candidate_applications'::regclass
      AND c.conname = 'candidate_applications_kingsmen_status_check'
      AND position('Provider receipt confirmed' IN pg_get_constraintdef(c.oid)) > 0
      AND position('Decision recorded' IN pg_get_constraintdef(c.oid)) > 0
  ) THEN
    RAISE EXCEPTION 'canonical seven-value Kingsmen status contract is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.candidate_application_events'::regclass
      AND c.conname = 'candidate_application_events_event_type_check'
      AND position('APPLICATION_DRAFT_SAVED' IN pg_get_constraintdef(c.oid)) > 0
  ) THEN
    RAISE EXCEPTION 'APPLICATION_DRAFT_SAVED event type is not allowed by the application event constraint';
  END IF;

  -- ACL contract: RPCs are candidate-callable, draft storage is service-only.
  IF has_function_privilege('anon', 'public.get_candidate_application_draft(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute get_candidate_application_draft';
  END IF;
  IF has_function_privilege('authenticated', 'public.get_candidate_application_draft(uuid)', 'EXECUTE') IS NOT TRUE
     OR has_function_privilege('authenticated', 'public.save_candidate_application_draft(uuid,jsonb,integer,text)', 'EXECUTE') IS NOT TRUE THEN
    RAISE EXCEPTION 'authenticated candidate RPC grants are missing';
  END IF;
  IF has_table_privilege('authenticated', 'public.candidate_application_draft_answers', 'SELECT')
     OR has_table_privilege('authenticated', 'public.candidate_application_draft_answers', 'INSERT')
     OR has_table_privilege('anon', 'public.candidate_application_draft_answers', 'SELECT')
     OR has_table_privilege('service_role', 'public.candidate_application_draft_answers', 'SELECT') IS NOT TRUE THEN
    RAISE EXCEPTION 'draft-answer table privileges do not match the restricted-access contract';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"First draft","additional_answers":[{"question_key":"q1","answer":"Example"}]}'::jsonb,
    0,
    'draft-key-A-001'
  );
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR (v_result->>'draft_version')::integer <> 1
     OR v_result->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_result->>'readiness_recheck_required' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'first draft save failed contract: %', v_result;
  END IF;

  -- Exact retry reuses version 1 and does not duplicate the audit event.
  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"First draft","additional_answers":[{"question_key":"q1","answer":"Example"}]}'::jsonb,
    0,
    'draft-key-A-001'
  );
  IF v_result->>'reused' IS DISTINCT FROM 'true' OR (v_result->>'draft_version')::integer <> 1 THEN
    RAISE EXCEPTION 'idempotent retry failed contract: %', v_result;
  END IF;

  -- Same idempotency key with different content must be rejected.
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '{"motivation_statement":"Different payload"}'::jsonb,
      0,
      'draft-key-A-001'
    );
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'idempotency-key content reuse was not rejected'; END IF;

  -- Stale expected version must return a conflict without overwriting version 1.
  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"Stale write"}'::jsonb,
    0,
    'draft-key-A-002'
  );
  IF v_result->>'code' IS DISTINCT FROM 'APPLICATION_DRAFT_VERSION_CONFLICT'
     OR (v_result->>'current_version')::integer <> 1 THEN
    RAISE EXCEPTION 'stale-version write was not rejected: %', v_result;
  END IF;

  -- Correct version creates version 2 and resets readiness.
  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"Version 2"}'::jsonb,
    1,
    'draft-key-A-003'
  );
  IF v_result->>'ok' IS DISTINCT FROM 'true' OR (v_result->>'draft_version')::integer <> 2 THEN
    RAISE EXCEPTION 'second draft save failed contract: %', v_result;
  END IF;
  SELECT count(*) INTO v_count FROM public.candidate_application_events
   WHERE application_id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'
     AND event_type = 'APPLICATION_DRAFT_SAVED';
  IF v_count <> 2 THEN RAISE EXCEPTION 'expected two save audit events, found %', v_count; END IF;
  IF EXISTS (SELECT 1 FROM public.candidate_application_events
             WHERE application_id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'
               AND details ? 'answer_data') THEN
    RAISE EXCEPTION 'application answer content leaked into audit event details';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.candidate_applications
                 WHERE id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'
                   AND status = 'READY_TO_SUBMIT'
                   AND kingsmen_status = 'Draft'
                   AND readiness_status = 'NOT_CHECKED'
                   AND readiness_snapshot->>'readiness_recheck_required' = 'true') THEN
    RAISE EXCEPTION 'saving draft changed the internal workflow state, changed Kingsmen status or failed to invalidate readiness';
  END IF;

  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR v_result#>>'{draft,motivation_statement}' IS DISTINCT FROM 'Version 2'
     OR v_result->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_result->>'draft_version' <> '2'
     OR v_result#>>'{application,kingsmen_status}' IS DISTINCT FROM 'Draft'
     OR v_result#>>'{application,status}' IS DISTINCT FROM 'READY_TO_SUBMIT' THEN
    RAISE EXCEPTION 'candidate could not reload its latest saved draft: %', v_result;
  END IF;

  -- Candidate B may read its own parent, but neither load nor write A's parent.
  PERFORM set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', true);
  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff2');
  IF v_result->>'ok' IS DISTINCT FROM 'true' OR v_result->>'draft_version' <> '0' THEN
    RAISE EXCEPTION 'candidate B cannot load its own draft shell: %', v_result;
  END IF;

  -- Action required remains candidate-editable without changing the candidate-facing label.
  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff2',
    '{"motivation_statement":"Candidate B correction"}'::jsonb,
    0,
    'draft-key-B-own-001'
  );
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR v_result->>'kingsmen_status' IS DISTINCT FROM 'Action required'
     OR (v_result->>'draft_version')::integer <> 1 THEN
    RAISE EXCEPTION 'Action required application was not safely editable: %', v_result;
  END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'OWNED_APPLICATION_NOT_FOUND';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'cross-candidate read was not rejected'; END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '{"motivation_statement":"cross-candidate write"}'::jsonb,
      2,
      'draft-key-B-001'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'OWNED_APPLICATION_NOT_FOUND';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'cross-candidate write was not rejected'; END IF;

  -- A valid identity without a reusable profile still cannot save answers.
  PERFORM set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000003', true);
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff3',
      '{"motivation_statement":"No reusable profile"}'::jsonb,
      0,
      'draft-key-C-001'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'CANDIDATE_REUSABLE_PROFILE_REQUIRED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'save without reusable profile was not rejected'; END IF;

  -- Missing verified Auth linkage must fail closed.
  PERFORM set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000004', true);
  v_rejected := false;
  BEGIN
    PERFORM public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'missing verified identity was not rejected'; END IF;

  -- Once the parent crosses into a submission state, draft editing is locked.
  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
  UPDATE public.candidate_applications
  SET status = 'SUBMITTED_CONFIRMED',
      kingsmen_status = 'Submitted to Kingsmen'
  WHERE id = 'ffffffff-ffff-4fff-8fff-fffffffffff1';
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '{"motivation_statement":"Must be locked"}'::jsonb,
      2,
      'draft-key-A-004'
    );
  EXCEPTION WHEN object_not_in_prerequisite_state THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'APPLICATION_DRAFT_IS_LOCKED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'draft editing was not locked after submission state'; END IF;

  -- Revoked consent blocks any further draft save.
  UPDATE public.candidate_applications
  SET status = 'DRAFT', kingsmen_status = 'Draft'
  WHERE id = 'ffffffff-ffff-4fff-8fff-fffffffffff1';
  UPDATE public.privacy_consent_records
  SET consent_status = 'REVOKED', revoked_at = clock_timestamp()
  WHERE candidate_ref = 'CAND-A' AND consent_type = 'PROFILE_PROCESSING';
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '{"motivation_statement":"Must require consent"}'::jsonb,
      2,
      'draft-key-A-005'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'PROFILE_PROCESSING_CONSENT_REQUIRED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked consent was not enforced'; END IF;
END
$test$;

ROLLBACK;
SELECT 'PASS: application draft persistence PostgreSQL integration contract' AS result;
