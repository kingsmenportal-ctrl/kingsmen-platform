-- Exercise migration 0109 against a disposable PostgreSQL 17 database.
\set ON_ERROR_STOP on

INSERT INTO public.candidates (id, public_ref, is_active) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','KNG-TEST-A',true),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','KNG-TEST-B',true);

INSERT INTO public.candidate_auth_identity_links
 (supabase_user_id,candidate_id,link_status,verified_at,verified_by)
VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VERIFIED',now(),'reviewer-fixture'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc','VERIFIED',now(),'reviewer-fixture');

INSERT INTO public.candidate_master_profiles (candidate_id,profile_data)
VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"first_name":"Candidate A"}'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','{"first_name":"Candidate B"}');

INSERT INTO public.privacy_consent_records
 (candidate_ref,consent_type,consent_status,consent_text_snapshot,granted_at)
VALUES
 ('KNG-TEST-A','PROFILE_PROCESSING','ACTIVE','Disposable test consent A',now()),
 ('KNG-TEST-B','PROFILE_PROCESSING','ACTIVE','Disposable test consent B',now());

INSERT INTO public.candidate_opportunities (id,title,provider_name,source_url,closes_at) VALUES
 ('10000000-0000-4000-8000-000000000001','A opportunity','A provider','https://example.test/a',now()+interval '30 days'),
 ('20000000-0000-4000-8000-000000000002','B opportunity','B provider','https://example.test/b',now()+interval '30 days');

INSERT INTO public.candidate_applications
 (id,application_ref,candidate_id,opportunity_id,pathway_type,status,readiness_status)
VALUES
 ('30000000-0000-4000-8000-000000000001','KM-TEST-A1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','10000000-0000-4000-8000-000000000001','HIGHER_EDUCATION','DRAFT','NOT_CHECKED'),
 ('30000000-0000-4000-8000-000000000002','KM-TEST-A2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','10000000-0000-4000-8000-000000000001','HIGHER_EDUCATION','SUBMITTED','NOT_CHECKED'),
 ('40000000-0000-4000-8000-000000000001','KM-TEST-B1','cccccccc-cccc-4ccc-8ccc-cccccccccccc','20000000-0000-4000-8000-000000000002','TVET','DRAFT','NOT_CHECKED');

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);

DO $test$
DECLARE
  v jsonb;
  v_answers jsonb := jsonb_build_object(
    'motivation_statement','I am applying for this opportunity.',
    'relevant_experience','Relevant work experience.',
    'qualifications_summary','Matric and additional training.',
    'preferred_campus','Johannesburg',
    'additional_answers',jsonb_build_array(jsonb_build_object('question_key','additional_context','answer','Test context'))
  );
  v_updated jsonb;
BEGIN
  -- Initial read must return a real owned parent and an empty version-zero draft.
  v := public.get_candidate_application_draft('30000000-0000-4000-8000-000000000001');
  IF v->>'ok' IS DISTINCT FROM 'true'
     OR (v->>'draft_version')::integer <> 0
     OR v->>'provider_submission_sent' IS DISTINCT FROM 'false'
     OR v->>'is_editable' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'TEST_INITIAL_DRAFT_READ_FAILED: %', v;
  END IF;

  -- First write creates version one.
  v := public.save_candidate_application_draft(
    '30000000-0000-4000-8000-000000000001',v_answers,0,'draft-test-key-0001'
  );
  IF v->>'ok' IS DISTINCT FROM 'true'
     OR (v->>'draft_version')::integer <> 1
     OR v->>'provider_submission_sent' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'TEST_FIRST_DRAFT_SAVE_FAILED: %', v;
  END IF;

  -- Read-after-write must preserve the answer data.
  v := public.get_candidate_application_draft('30000000-0000-4000-8000-000000000001');
  IF v->'draft'->>'motivation_statement' IS DISTINCT FROM 'I am applying for this opportunity.'
     OR v->'draft'->'additional_answers'->0->>'answer' IS DISTINCT FROM 'Test context' THEN
    RAISE EXCEPTION 'TEST_DRAFT_READ_AFTER_WRITE_FAILED: %', v;
  END IF;

  -- A retry with the same key and same payload is idempotent.
  v := public.save_candidate_application_draft(
    '30000000-0000-4000-8000-000000000001',v_answers,1,'draft-test-key-0001'
  );
  IF v->>'ok' IS DISTINCT FROM 'true'
     OR v->>'reused' IS DISTINCT FROM 'true'
     OR (v->>'draft_version')::integer <> 1 THEN
    RAISE EXCEPTION 'TEST_IDEMPOTENT_RETRY_FAILED: %', v;
  END IF;

  -- A stale writer receives a version conflict and cannot overwrite newer answers.
  v := public.save_candidate_application_draft(
    '30000000-0000-4000-8000-000000000001',
    jsonb_build_object('motivation_statement','Stale overwrite'),
    0,'draft-test-key-0002'
  );
  IF v->>'ok' IS DISTINCT FROM 'false'
     OR v->>'code' IS DISTINCT FROM 'APPLICATION_DRAFT_VERSION_CONFLICT'
     OR (v->>'current_version')::integer <> 1 THEN
    RAISE EXCEPTION 'TEST_OPTIMISTIC_VERSION_CONFLICT_FAILED: %', v;
  END IF;

  -- Current version can be updated once; readiness is reset and version increments.
  v_updated := v_answers || jsonb_build_object('motivation_statement','Updated application statement.');
  v := public.save_candidate_application_draft(
    '30000000-0000-4000-8000-000000000001',v_updated,1,'draft-test-key-0003'
  );
  IF v->>'ok' IS DISTINCT FROM 'true'
     OR (v->>'draft_version')::integer <> 2
     OR v->>'readiness_recheck_required' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'TEST_VERSIONED_UPDATE_FAILED: %', v;
  END IF;

  -- Reusing an idempotency key with different data is rejected.
  BEGIN
    PERFORM public.save_candidate_application_draft(
      '30000000-0000-4000-8000-000000000001',
      jsonb_build_object('motivation_statement','Different payload'),
      2,'draft-test-key-0003'
    );
    RAISE EXCEPTION 'TEST_EXPECTED_IDEMPOTENCY_CONFLICT_NOT_RAISED';
  EXCEPTION WHEN SQLSTATE '23505' THEN
    NULL;
  END;

  -- Disallowed answer keys are rejected by the database boundary.
  BEGIN
    PERFORM public.save_candidate_application_draft(
      '30000000-0000-4000-8000-000000000001',
      jsonb_build_object('candidate_id','cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      2,'draft-test-key-0004'
    );
    RAISE EXCEPTION 'TEST_EXPECTED_INPUT_REJECTION_NOT_RAISED';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;

  -- Submitted parents are read-only.
  BEGIN
    PERFORM public.save_candidate_application_draft(
      '30000000-0000-4000-8000-000000000002',
      jsonb_build_object('motivation_statement','Must not save'),
      0,'draft-test-key-locked'
    );
    RAISE EXCEPTION 'TEST_EXPECTED_LOCK_REJECTION_NOT_RAISED';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    NULL;
  END;
END
$test$;

-- Switch to Candidate B: attempts to read or save Candidate A's parent must fail.
SELECT set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
DO $isolation$
BEGIN
  BEGIN
    PERFORM public.get_candidate_application_draft('30000000-0000-4000-8000-000000000001');
    RAISE EXCEPTION 'TEST_CROSS_CANDIDATE_READ_WAS_NOT_BLOCKED';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
  BEGIN
    PERFORM public.save_candidate_application_draft(
      '30000000-0000-4000-8000-000000000001',
      jsonb_build_object('motivation_statement','Cross candidate write'),
      2,'draft-test-key-cross'
    );
    RAISE EXCEPTION 'TEST_CROSS_CANDIDATE_WRITE_WAS_NOT_BLOCKED';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
  IF (public.get_candidate_application_draft('40000000-0000-4000-8000-000000000001')->>'application_ref')
     IS DISTINCT FROM 'KM-TEST-B1' THEN
    RAISE EXCEPTION 'TEST_CANDIDATE_B_OWN_READ_FAILED';
  END IF;
END
$isolation$;

-- Table privileges stay revoked from client roles; narrowly scoped RPCs remain executable.
DO $privileges$
BEGIN
  IF has_table_privilege('authenticated','public.candidate_application_draft_answers','SELECT')
     OR has_table_privilege('anon','public.candidate_application_draft_answers','SELECT') THEN
    RAISE EXCEPTION 'TEST_CLIENT_DRAFT_TABLE_PRIVILEGE_LEAK';
  END IF;
  IF NOT has_function_privilege('authenticated','public.get_candidate_application_draft(uuid)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.save_candidate_application_draft(uuid,jsonb,integer,text)','EXECUTE')
     OR has_function_privilege('anon','public.save_candidate_application_draft(uuid,jsonb,integer,text)','EXECUTE') THEN
    RAISE EXCEPTION 'TEST_DRAFT_RPC_GRANTS_INVALID';
  END IF;
END
$privileges$;

COMMIT;

SELECT 'PASS: application draft read/write, version conflict, idempotency, input validation, parent lock, A/B isolation and RPC privileges' AS result;
