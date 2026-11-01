-- Functional PostgreSQL 17 test of migration 0107. Run only on a disposable database.
\set ON_ERROR_STOP on

INSERT INTO public.candidates (id, public_ref, is_active) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','KNG-TEST-A',true),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','KNG-TEST-B',true),
 ('ffffffff-ffff-4fff-8fff-ffffffffffff','KNG-TEST-C',true),
 ('99999999-9999-4999-8999-999999999999','KNG-TEST-D',true);

INSERT INTO public.candidate_auth_identity_links
 (supabase_user_id,candidate_id,link_status,verified_at,verified_by)
VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VERIFIED',now(),'reviewer-test'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc','VERIFIED',now(),'reviewer-test'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','ffffffff-ffff-4fff-8fff-ffffffffffff','VERIFIED',now(),'reviewer-test'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','99999999-9999-4999-8999-999999999999','VERIFIED',now(),'reviewer-test');

INSERT INTO public.privacy_consent_records
 (candidate_ref,consent_type,consent_status,consent_text_snapshot,granted_at)
VALUES
 ('KNG-TEST-A','PROFILE_PROCESSING','ACTIVE','Test fixture consent A',now()),
 ('KNG-TEST-B','PROFILE_PROCESSING','ACTIVE','Test fixture consent B',now());

INSERT INTO public.finance_plan_catalog
 (plan_code,plan_name,description,amount_cents,currency,active,priority_application_count,
  managed_application_count,service_term_days,accommodation_route_count,
  accommodation_support_available,cv_versions,motivation_letters,
  upgrade_bonus_routes_when_cv_revamp_owned)
VALUES
 ('CV_REVAMP_R49_99','CV Revamp','CV and motivation letter service',4999,'ZAR',true,null,0,0,0,true,15,15,0),
 ('FOUNDATIONAL_ACCORD_R169_99','Foundational Accord','Foundational managed support',16999,'ZAR',true,5,4,30,8,true,0,0,2);

-- The test deliberately uses the production checkout order-time fields.
INSERT INTO public.finance_orders
 (order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,
  service_term_days,managed_application_count,accommodation_route_count,
  cv_versions,motivation_letters,upgrade_bonus_routes)
SELECT 'ord_test_cv_revamp','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p.plan_code,'PAID',
       p.amount_cents,p.currency,p.service_term_days,p.managed_application_count,
       p.accommodation_route_count,p.cv_versions,p.motivation_letters,
       p.upgrade_bonus_routes_when_cv_revamp_owned
FROM public.finance_plan_catalog p WHERE p.plan_code='CV_REVAMP_R49_99';

INSERT INTO public.finance_payments
 (payment_ref,order_ref,candidate_ref,provider,payment_status,verified,
  amount_gross_cents,currency,verified_at,created_at)
VALUES
 ('pay_test_cv_revamp','ord_test_cv_revamp','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'PAYFAST','COMPLETE',true,4999,'ZAR',now()-interval '1 minute',now()-interval '1 minute');

INSERT INTO public.finance_orders
 (order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,
  service_term_days,managed_application_count,accommodation_route_count,
  cv_versions,motivation_letters,upgrade_bonus_routes)
SELECT 'ord_test_foundational','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p.plan_code,'PAID',
       p.amount_cents,p.currency,p.service_term_days,p.managed_application_count,
       p.accommodation_route_count,p.cv_versions,p.motivation_letters,
       p.upgrade_bonus_routes_when_cv_revamp_owned
FROM public.finance_plan_catalog p WHERE p.plan_code='FOUNDATIONAL_ACCORD_R169_99';

INSERT INTO public.finance_payments
 (payment_ref,order_ref,candidate_ref,provider,payment_status,verified,
  amount_gross_cents,currency,verified_at,created_at)
VALUES
 ('pay_test_foundational','ord_test_foundational','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'PAYFAST','COMPLETE',true,16999,'ZAR',now(),now());

INSERT INTO public.finance_orders
 (order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,
  service_term_days,managed_application_count,accommodation_route_count,
  cv_versions,motivation_letters,upgrade_bonus_routes)
SELECT 'ord_test_pending','cccccccc-cccc-4ccc-8ccc-cccccccccccc',p.plan_code,'PENDING_PAYMENT',
       p.amount_cents,p.currency,p.service_term_days,p.managed_application_count,
       p.accommodation_route_count,p.cv_versions,p.motivation_letters,
       p.upgrade_bonus_routes_when_cv_revamp_owned
FROM public.finance_plan_catalog p WHERE p.plan_code='FOUNDATIONAL_ACCORD_R169_99';

INSERT INTO public.finance_payments
 (payment_ref,order_ref,candidate_ref,provider,payment_status,verified,
  amount_gross_cents,currency,verified_at)
VALUES
 ('pay_test_pending','ord_test_pending','cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'PAYFAST','PENDING',false,16999,'ZAR',null);

INSERT INTO public.candidate_applications (id,candidate_id,status)
SELECT ('a0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DRAFT'
FROM generate_series(1,8) AS n;

-- Order-time terms are snapshots, not live reads of subsequently edited catalogue rows.
UPDATE public.finance_plan_catalog
SET priority_application_count=99
WHERE plan_code='FOUNDATIONAL_ACCORD_R169_99';

DO $assert_catalogue$
DECLARE v_order public.finance_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.finance_orders WHERE order_ref='ord_test_foundational';
  IF v_order.priority_application_count<>5
     OR v_order.managed_application_count<>4
     OR v_order.accommodation_route_count<>8
     OR v_order.accommodation_support_available IS NOT TRUE
     OR v_order.entitlement_policy_version<>'KINGSMEN_CAPACITY_2026_11_01_V1' THEN
    RAISE EXCEPTION 'order-time catalogue snapshot is incorrect';
  END IF;
  BEGIN
    UPDATE public.finance_orders SET managed_application_count=77
    WHERE order_ref='ord_test_foundational';
    RAISE EXCEPTION 'immutable order terms unexpectedly changed';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$assert_catalogue$;

-- The Authenticated role can use only the RPCs, not the backing tables.
DO $assert_grants$
BEGIN
  IF has_table_privilege('authenticated','public.candidate_application_capacity_reservations','SELECT')
     OR has_table_privilege('authenticated','public.candidate_application_capacity_events','SELECT') THEN
    RAISE EXCEPTION 'authenticated role has direct capacity-table access';
  END IF;
  IF NOT has_function_privilege('authenticated','public.get_candidate_application_capacity()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.reserve_candidate_application_capacity(uuid,text,text)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.release_candidate_application_capacity(uuid,text)','EXECUTE')
     OR has_function_privilege('anon','public.get_candidate_application_capacity()','EXECUTE') THEN
    RAISE EXCEPTION 'capacity RPC grants are not least-privilege';
  END IF;
END
$assert_grants$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);

DO $candidate_a_capacity$
DECLARE
  v_summary jsonb;
  v_result jsonb;
  v_first_reservation uuid;
  v_replay uuid;
  v_release_blocked jsonb;
  v_release_event_blocked jsonb;
  v_release_ok jsonb;
  v_reservation uuid;
  i integer;
BEGIN
  v_summary:=public.get_candidate_application_capacity();
  IF (v_summary->>'has_active_plan')::boolean IS NOT TRUE
     OR (v_summary->>'priority_application_limit')::integer<>5
     OR (v_summary->>'managed_route_limit')::integer<>6
     OR (v_summary->>'accommodation_route_count')::integer<>8
     OR (v_summary->>'accommodation_support_available')::boolean IS NOT TRUE
     OR (v_summary->>'cv_revamp_bonus_applied')::integer<>2
     OR v_summary->>'catalogue_access'<>'ALL_SIX_PATHWAYS' THEN
    RAISE EXCEPTION 'verified paid capacity summary or prior-CV bonus is incorrect: %',v_summary;
  END IF;

  FOR i IN 1..5 LOOP
    v_result:=public.reserve_candidate_application_capacity(
      ('a0000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
      'PRIORITY_APPLICATION','priority-idem-'||lpad(i::text,4,'0'));
    IF (v_result->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'priority reservation % failed: %',i,v_result;
    END IF;
    IF i=1 THEN v_first_reservation:=(v_result->>'reservation_id')::uuid; END IF;
    IF i=3 THEN v_reservation:=(v_result->>'reservation_id')::uuid; END IF;
  END LOOP;

  v_result:=public.reserve_candidate_application_capacity(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'PRIORITY_APPLICATION','priority-idem-0001');
  v_replay:=(v_result->>'reservation_id')::uuid;
  IF (v_result->>'reused')::boolean IS NOT TRUE OR v_replay<>v_first_reservation THEN
    RAISE EXCEPTION 'idempotent retry did not reuse original reservation: %',v_result;
  END IF;

  v_result:=public.reserve_candidate_application_capacity(
    'a0000000-0000-4000-8000-000000000006'::uuid,
    'PRIORITY_APPLICATION','priority-idem-0006');
  IF (v_result->>'ok')::boolean IS NOT FALSE
     OR v_result->>'code'<>'APPLICATION_CAPACITY_EXHAUSTED' THEN
    RAISE EXCEPTION 'priority capacity over-allocation was not rejected: %',v_result;
  END IF;

  FOR i IN 1..6 LOOP
    v_result:=public.reserve_candidate_application_capacity(
      ('a0000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
      'MANAGED_ROUTE','managed-idem-'||lpad(i::text,4,'0'));
    IF (v_result->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'managed-route reservation % failed: %',i,v_result;
    END IF;
  END LOOP;

  v_result:=public.reserve_candidate_application_capacity(
    'a0000000-0000-4000-8000-000000000007'::uuid,
    'MANAGED_ROUTE','managed-idem-0007');
  IF (v_result->>'ok')::boolean IS NOT FALSE
     OR v_result->>'code'<>'APPLICATION_CAPACITY_EXHAUSTED' THEN
    RAISE EXCEPTION 'managed-route over-allocation was not rejected: %',v_result;
  END IF;

  IF v_first_reservation IS NULL OR v_reservation IS NULL THEN
    RAISE EXCEPTION 'expected test reservations were not created';
  END IF;

  PERFORM set_config('capacity.test_first_reservation',v_first_reservation::text,false);
  PERFORM set_config('capacity.test_release_reservation',v_reservation::text,false);
END
$candidate_a_capacity$;

RESET ROLE;

-- Simulate downstream work created while the parent application still looks editable.
INSERT INTO public.candidate_application_submission_jobs
 (application_id,candidate_id,job_status)
VALUES
 ('a0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PREPARED');

INSERT INTO public.candidate_application_events
 (application_id,candidate_id,event_type)
VALUES
 ('a0000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PROVIDER_ACKNOWLEDGED');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);

DO $candidate_a_release$
DECLARE v_result jsonb; v_job_reservation uuid; v_event_reservation uuid; v_plain_reservation uuid;
BEGIN
  v_job_reservation:=current_setting('capacity.test_first_reservation')::uuid;
  v_event_reservation:=current_setting('capacity.test_event_reservation')::uuid;
  v_plain_reservation:=current_setting('capacity.test_release_reservation')::uuid;
  v_result:=public.release_candidate_application_capacity(v_job_reservation,'test release');
  IF (v_result->>'ok')::boolean IS NOT FALSE OR v_result->>'code'<>'CAPACITY_RELEASE_NOT_ALLOWED' THEN
    RAISE EXCEPTION 'release should be blocked when a submission job exists: %',v_result;
  END IF;
  v_result:=public.release_candidate_application_capacity(v_event_reservation,'test release');
  IF (v_result->>'ok')::boolean IS NOT FALSE OR v_result->>'code'<>'CAPACITY_RELEASE_NOT_ALLOWED' THEN
    RAISE EXCEPTION 'release should be blocked when provider receipt event exists: %',v_result;
  END IF;

  v_result:=public.release_candidate_application_capacity(v_plain_reservation,'unused draft route');
  IF (v_result->>'ok')::boolean IS NOT TRUE OR v_result->>'reservation_status'<>'RELEASED' THEN
    RAISE EXCEPTION 'unused editable draft reservation should release: %',v_result;
  END IF;
END
$candidate_a_release$;

RESET ROLE;

-- Candidate B has a pending/unsettled order and must not receive another candidate's capacity.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',false);
DO $candidate_b_isolation$
DECLARE v_summary jsonb; v_denied boolean:=false;
BEGIN
  v_summary:=public.get_candidate_application_capacity();
  IF (v_summary->>'has_active_plan')::boolean IS NOT FALSE
     OR (v_summary->>'priority_application_limit')::integer<>0
     OR v_summary->>'catalogue_access'<>'ALL_SIX_PATHWAYS' THEN
    RAISE EXCEPTION 'unsettled candidate B order granted capacity: %',v_summary;
  END IF;
  BEGIN
    PERFORM public.release_candidate_application_capacity(
      current_setting('capacity.test_first_reservation')::uuid,'unauthorised cross-candidate release');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied:=true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'candidate B released candidate A reservation'; END IF;
END
$candidate_b_isolation$;

RESET ROLE;

-- A user linked to multiple verified candidate records fails closed.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false);
DO $ambiguous_identity$
DECLARE v_denied boolean:=false;
BEGIN
  BEGIN
    PERFORM public.get_candidate_application_capacity();
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied:=true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ambiguous Auth identity did not fail closed'; END IF;
END
$ambiguous_identity$;
RESET ROLE;

-- The audit ledger is append-only even for a database owner.
DO $immutable_events$
BEGIN
  BEGIN
    UPDATE public.candidate_application_capacity_events
       SET details='{"tampered":true}'::jsonb
     WHERE event_type='CAPACITY_RESERVED';
    RAISE EXCEPTION 'capacity event update unexpectedly succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM='capacity event update unexpectedly succeeded' THEN RAISE; END IF;
  END;
END
$immutable_events$;

SELECT 'application capacity PostgreSQL integration: PASS' AS result;
