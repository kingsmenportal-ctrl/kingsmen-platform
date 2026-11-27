-- Integration contract for the exact Supabase draft-persistence migration.
-- Runs only against the disposable PostgreSQL fixture created by CI.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000002'),
  ('cccccccc-0000-4000-8000-000000000003'),
  ('dddddddd-0000-4000-8000-000000000004');

INSERT INTO public.candidates (id,public_ref,is_active) VALUES
  ('11111111-1111-4111-8111-111111111111','CAND-A',true),
  ('22222222-2222-4222-8222-222222222222','CAND-B',true),
  ('33333333-3333-4333-8333-333333333333','CAND-C',true),
  ('44444444-4444-4444-8444-444444444444','CAND-D',true);

INSERT INTO public.candidate_accounts (candidate_id,auth_user_id,email) VALUES
  ('11111111-1111-4111-8111-111111111111','aaaaaaaa-0000-4000-8000-000000000001','a@example.test'),
  ('22222222-2222-4222-8222-222222222222','bbbbbbbb-0000-4000-8000-000000000002','b@example.test'),
  ('33333333-3333-4333-8333-333333333333','cccccccc-0000-4000-8000-000000000003','c@example.test'),
  ('44444444-4444-4444-8444-444444444444','dddddddd-0000-4000-8000-000000000004','d@example.test');

INSERT INTO public.candidate_auth_identity_links
  (supabase_user_id,candidate_id,link_status,verified_at,verified_by)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','VERIFIED',now()-interval '2 minutes','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'),
  ('bbbbbbbb-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','VERIFIED',now()-interval '2 minutes','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02'),
  ('cccccccc-0000-4000-8000-000000000003','33333333-3333-4333-8333-333333333333','VERIFIED',now()-interval '2 minutes','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03'),
  ('dddddddd-0000-4000-8000-000000000004','44444444-4444-4444-8444-444444444444','VERIFIED',now()-interval '2 minutes','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04');

INSERT INTO public.candidate_master_profiles (candidate_id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222'),
  ('44444444-4444-4444-8444-444444444444');

INSERT INTO public.privacy_consent_records
  (id,consent_ref,candidate_ref,consent_type,consent_status,consent_text_snapshot,granted_at)
VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','CONSENT-A','CAND-A','PROFILE_PROCESSING','ACTIVE','Fixture consent A',now()-interval '1 minute'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2','CONSENT-B','CAND-B','PROFILE_PROCESSING','ACTIVE','Fixture consent B',now()-interval '1 minute'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3','CONSENT-C','CAND-C','PROFILE_PROCESSING','ACTIVE','Fixture consent C',now()-interval '1 minute'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4','CONSENT-D','CAND-D','PROFILE_PROCESSING','REVOKED','Fixture consent D',now()-interval '1 minute');

INSERT INTO public.candidate_opportunities
  (id,opportunity_ref,title,provider_name,pathway_type,source_url,application_url,
   application_method,source_checked_at,source_status,is_published,closes_at)
VALUES
  ('99999999-9999-4999-8999-999999999991','FIXTURE-A','Verified opportunity A','Fixture Provider A','EMPLOYMENT',
   'https://provider.example/opportunity-a','https://provider.example/apply-a','EXTERNAL_PORTAL',
   now()-interval '5 minutes','VERIFIED',true,now()+interval '30 days'),
  ('99999999-9999-4999-8999-999999999992','FIXTURE-B','Opportunity B','Fixture Provider B','TVET',
   'https://provider.example/opportunity-b','https://provider.example/apply-b','EXTERNAL_PORTAL',
   now()-interval '5 minutes','VERIFIED',true,now()+interval '30 days'),
  ('99999999-9999-4999-8999-999999999993','FIXTURE-C','Opportunity C','Fixture Provider C','INTERNSHIP',
   'https://provider.example/opportunity-c','https://provider.example/apply-c','EXTERNAL_PORTAL',
   now()-interval '5 minutes','VERIFIED',true,now()+interval '30 days'),
  ('99999999-9999-4999-8999-999999999994','FIXTURE-D','Opportunity D','Fixture Provider D','APPRENTICESHIP',
   'https://provider.example/opportunity-d','https://provider.example/apply-d','EXTERNAL_PORTAL',
   now()-interval '5 minutes','VERIFIED',true,now()+interval '30 days');

INSERT INTO public.candidate_applications
  (id,application_ref,candidate_id,opportunity_id,pathway_type,status,readiness_status,readiness_snapshot)
VALUES
  ('ffffffff-ffff-4fff-8fff-fffffffffff1','FIXTURE-A-1','11111111-1111-4111-8111-111111111111',
   '99999999-9999-4999-8999-999999999991','EMPLOYMENT','READY_TO_SUBMIT','READY','{"fixture":true}'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2','FIXTURE-B-1','22222222-2222-4222-8222-222222222222',
   '99999999-9999-4999-8999-999999999992','TVET','DRAFT','NOT_CHECKED','{}'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff3','FIXTURE-C-1','33333333-3333-4333-8333-333333333333',
   '99999999-9999-4999-8999-999999999993','INTERNSHIP','DRAFT','NOT_CHECKED','{}'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff4','FIXTURE-D-1','44444444-4444-4444-8444-444444444444',
   '99999999-9999-4999-8999-999999999994','APPRENTICESHIP','DRAFT','NOT_CHECKED','{}');

DO $test$
DECLARE
  v_result jsonb;
  v_message text;
  v_rejected boolean := false;
  v_count integer;
  v_ref text;
BEGIN
  IF has_function_privilege('anon','public.get_candidate_application_draft(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.save_candidate_application_draft(uuid,jsonb,integer,text)','EXECUTE')
     OR has_function_privilege('anon','public.prepare_candidate_manual_portal_submission(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'anon unexpectedly has candidate application RPC execution';
  END IF;
  IF has_function_privilege('authenticated','public.get_candidate_application_draft(uuid)','EXECUTE') IS NOT TRUE
     OR has_function_privilege('authenticated','public.save_candidate_application_draft(uuid,jsonb,integer,text)','EXECUTE') IS NOT TRUE
     OR has_function_privilege('authenticated','public.prepare_candidate_manual_portal_submission(uuid)','EXECUTE') IS NOT TRUE THEN
    RAISE EXCEPTION 'authenticated application RPC execution grants are missing';
  END IF;
  IF has_table_privilege('authenticated','public.candidate_application_draft_answers','SELECT')
     OR has_table_privilege('authenticated','public.candidate_application_draft_answers','INSERT')
     OR has_table_privilege('anon','public.candidate_application_draft_answers','SELECT')
     OR has_table_privilege('service_role','public.candidate_application_draft_answers','SELECT') IS NOT TRUE THEN
    RAISE EXCEPTION 'draft-answer table ACL does not match the private-storage contract';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid='public.candidate_application_events'::regclass
      AND c.conname='candidate_application_events_event_type_check'
      AND position('APPLICATION_DRAFT_SAVED' in pg_get_constraintdef(c.oid))>0
  ) THEN
    RAISE EXCEPTION 'APPLICATION_DRAFT_SAVED event type was not safely added to the event allowlist';
  END IF;

  PERFORM set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true);

  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR v_result->>'draft_version' IS DISTINCT FROM '0'
     OR v_result->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_result#>>'{application,kingsmen_status}' IS DISTINCT FROM 'Draft' THEN
    RAISE EXCEPTION 'candidate A could not load its own draft shell: %',v_result;
  END IF;

  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"First draft","availability_date":"2026-12-01","additional_answers":[{"question_key":"q1","answer":"Example"}]}'::jsonb,
    0,'draft-key-A-001'
  );
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR (v_result->>'draft_version')::integer <> 1
     OR v_result->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_result->>'readiness_recheck_required' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'first save failed: %',v_result;
  END IF;

  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"First draft","availability_date":"2026-12-01","additional_answers":[{"question_key":"q1","answer":"Example"}]}'::jsonb,
    0,'draft-key-A-001'
  );
  IF v_result->>'reused' IS DISTINCT FROM 'true'
     OR (v_result->>'draft_version')::integer <> 1 THEN
    RAISE EXCEPTION 'identical idempotent retry did not reuse version 1: %',v_result;
  END IF;

  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"Different content"}'::jsonb,
    0,'draft-key-A-001'
  );
  IF v_result->>'code' IS DISTINCT FROM 'APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT' THEN
    RAISE EXCEPTION 'same key with different payload was not rejected: %',v_result;
  END IF;

  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"Stale content"}'::jsonb,
    0,'draft-key-A-002'
  );
  IF v_result->>'code' IS DISTINCT FROM 'APPLICATION_DRAFT_VERSION_CONFLICT'
     OR (v_result->>'current_version')::integer <> 1 THEN
    RAISE EXCEPTION 'stale write was not rejected: %',v_result;
  END IF;

  v_result := public.save_candidate_application_draft(
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '{"motivation_statement":"Version 2","qualifications_summary":"Updated","availability_date":""}'::jsonb,
    1,'draft-key-A-003'
  );
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR (v_result->>'draft_version')::integer <> 2 THEN
    RAISE EXCEPTION 'version 2 update failed: %',v_result;
  END IF;

  SELECT count(*) INTO v_count FROM public.candidate_application_events
  WHERE application_id='ffffffff-ffff-4fff-8fff-fffffffffff1'
    AND event_type='APPLICATION_DRAFT_SAVED';
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'expected exactly two draft audit events, got %',v_count;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.candidate_application_events
    WHERE application_id='ffffffff-ffff-4fff-8fff-fffffffffff1'
      AND details ? 'answer_data'
  ) THEN
    RAISE EXCEPTION 'application answers leaked into event details';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_applications
    WHERE id='ffffffff-ffff-4fff-8fff-fffffffffff1'
      AND status='READY_TO_SUBMIT' AND readiness_status='NOT_CHECKED'
      AND readiness_snapshot->>'readiness_recheck_required'='true'
  ) THEN
    RAISE EXCEPTION 'saving a draft must invalidate readiness without rewriting workflow status';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_application_events
    WHERE application_id='ffffffff-ffff-4fff-8fff-fffffffffff1'
      AND event_type='APPLICATION_DRAFT_SAVED'
      AND from_status='READY_TO_SUBMIT' AND to_status='READY_TO_SUBMIT'
  ) THEN
    RAISE EXCEPTION 'draft audit event must preserve the application lifecycle status';
  END IF;

  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result#>>'{draft,motivation_statement}' IS DISTINCT FROM 'Version 2'
     OR v_result->>'draft_version' IS DISTINCT FROM '2' THEN
    RAISE EXCEPTION 'candidate could not reload its latest saved answers: %',v_result;
  END IF;

  -- Candidate B's own application has no saved draft; verify the correct prerequisite error.
  PERFORM set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
  v_result := public.prepare_candidate_manual_portal_submission('ffffffff-ffff-4fff-8fff-fffffffffff2');
  IF v_result->>'code' IS DISTINCT FROM 'APPLICATION_DRAFT_REQUIRED' THEN
    RAISE EXCEPTION 'portal handoff without saved draft did not fail with the draft prerequisite: %',v_result;
  END IF;
  PERFORM set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true);

  -- Saved draft can be prepared for the verified official portal, but no
  -- provider submission is sent and retries reuse the same manual job.
  v_result := public.prepare_candidate_manual_portal_submission('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result->>'ok' IS DISTINCT FROM 'true'
     OR v_result->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v_result->>'official_url' IS DISTINCT FROM 'https://provider.example/apply-a'
     OR v_result->>'job_status' IS DISTINCT FROM 'MANUAL_REQUIRED' THEN
    RAISE EXCEPTION 'verified manual portal handoff failed: %',v_result;
  END IF;
  v_ref := v_result->>'submission_ref';

  v_result := public.prepare_candidate_manual_portal_submission('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result->>'submission_ref' IS DISTINCT FROM v_ref THEN
    RAISE EXCEPTION 'manual portal handoff retry created a different submission reference: %',v_result;
  END IF;
  SELECT count(*) INTO v_count FROM public.candidate_application_submission_jobs
  WHERE application_id='ffffffff-ffff-4fff-8fff-fffffffffff1';
  IF v_count <> 1 THEN RAISE EXCEPTION 'manual handoff retry created duplicate jobs'; END IF;

  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  IF v_result#>>'{handoff,submission_ref}' IS DISTINCT FROM v_ref
     OR v_result#>>'{handoff,official_url}' IS DISTINCT FROM 'https://provider.example/apply-a'
     OR v_result#>>'{handoff,provider_submission_sent}' IS DISTINCT FROM 'false'
     OR v_result#>>'{application,status}' IS DISTINCT FROM 'MANUAL_ACTION_REQUIRED' THEN
    RAISE EXCEPTION 'manual handoff was not persisted for resume: %',v_result;
  END IF;

  -- Candidate B cannot read or mutate candidate A's parent application.
  PERFORM set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
  v_result := public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff2');
  IF v_result->>'ok' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'candidate B could not load own application shell';
  END IF;
  v_rejected := false;
  BEGIN
    PERFORM public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  EXCEPTION WHEN insufficient_privilege THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'cross-candidate read was not blocked'; END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff1','{"motivation_statement":"Cross candidate"}'::jsonb,
      2,'draft-key-B-001'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'OWNED_APPLICATION_NOT_FOUND';
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'cross-candidate write was not blocked by ownership checks';
  END IF;

  -- Missing reusable profile is denied.
  PERFORM set_config('request.jwt.claim.sub','cccccccc-0000-4000-8000-000000000003',true);
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff3','{"motivation_statement":"No profile"}'::jsonb,
      0,'draft-key-C-001'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'CANDIDATE_REUSABLE_PROFILE_REQUIRED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'save without reusable profile was not denied'; END IF;

  -- Latest revoked consent is not overridden by an older active record.
  PERFORM set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000004',true);
  v_rejected := false;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      'ffffffff-ffff-4fff-8fff-fffffffffff4','{"motivation_statement":"Revoked consent"}'::jsonb,
      0,'draft-key-D-001'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    v_rejected := v_message = 'PROFILE_PROCESSING_CONSENT_REQUIRED';
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked profile-processing consent was not denied'; END IF;

  -- Missing identity fails closed.
  PERFORM set_config('request.jwt.claim.sub','12345678-1234-4234-8234-123456789012',true);
  v_rejected := false;
  BEGIN
    PERFORM public.get_candidate_application_draft('ffffffff-ffff-4fff-8fff-fffffffffff1');
  EXCEPTION WHEN insufficient_privilege THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'missing authenticated candidate was not denied'; END IF;
END
$test$;

ROLLBACK;
SELECT 'PASS: Supabase candidate draft migration, ownership, consent, idempotency and manual portal handoff contract' AS result;
