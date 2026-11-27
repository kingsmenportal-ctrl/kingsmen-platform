\set ON_ERROR_STOP on
BEGIN;

INSERT INTO public.candidates(id,public_ref,is_active) VALUES
 ('11111111-1111-4111-8111-111111111111','CAND-A',true),
 ('22222222-2222-4222-8222-222222222222','CAND-B',true);
INSERT INTO public.candidate_accounts(candidate_id,auth_user_id,email,email_verified) VALUES
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-0000-4000-8000-000000000001','a@example.test',true),
 ('22222222-2222-4222-8222-000000000002','bbbbbbbb-0000-4000-8000-000000000002','b@example.test',true);
INSERT INTO public.candidate_auth_identity_links(supabase_user_id,candidate_id,link_status,verified_at,verified_by) VALUES
 ('aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','VERIFIED',now()-interval '1 minute','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'),
 ('bbbbbbbb-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','VERIFIED',now()-interval '1 minute','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02');
INSERT INTO public.finance_plan_catalog(plan_code,plan_name,description,amount_cents,currency,active,managed_application_count,accommodation_route_count)
VALUES ('FOUNDATIONAL_ACCORD_R169_99','Foundational Accord','Sandbox fixture plan',16999,'ZAR',true,5,4);
INSERT INTO public.platform_reviewers(auth_user_id,role_code,is_active,revoked_at)
VALUES ('eeeeeeee-0000-4000-8000-000000000001','FINANCE_REVIEWER',true,null);

DO $test$
DECLARE
  v_checkout jsonb;
  v_again jsonb;
  v_settle jsonb;
  v_summary jsonb;
  v_refund jsonb;
  v_review jsonb;
  v_payment_ref text;
  v_refund_ref text;
  v_claimed integer;
  v_bad boolean := false;
BEGIN
  v_checkout := public.create_payfast_sandbox_checkout_bundle(
    'aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
    'FOUNDATIONAL_ACCORD_R169_99','idem-phase5-0001','ord_phase5_0001','inv_phase5_0001',
    'intent_phase5_0001','evidence_checkout_0001','https://portal.example/return',
    'https://portal.example/cancel','https://project.example/functions/v1/payfast-sandbox?action=itn',
    '{"merchant_id":"10000100","return_url":"https://portal.example/return","cancel_url":"https://portal.example/cancel","notify_url":"https://project.example/itn","email_address":"a@example.test","m_payment_id":"ord_phase5_0001","amount":"169.99","item_name":"Foundational Accord"}'::jsonb
  );
  IF v_checkout#>>'{intent,paymentUrl}' IS DISTINCT FROM 'https://sandbox.payfast.co.za/eng/process'
     OR v_checkout->>'orderStatus' IS DISTINCT FROM 'PENDING_PAYMENT'
     OR v_checkout->>'paymentStatus' IS DISTINCT FROM 'PENDING'
     OR v_checkout#>'{intent,signedPayload}' ? 'merchant_key'
     OR v_checkout#>'{intent,signedPayload}' ? 'signature' THEN
    RAISE EXCEPTION 'checkout intent violated sandbox or secret-storage boundary: %',v_checkout;
  END IF;
  v_again := public.create_payfast_sandbox_checkout_bundle(
    'aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
    'FOUNDATIONAL_ACCORD_R169_99','idem-phase5-0001','ord_other','inv_other',
    'intent_other','evidence_other','https://portal.example/return',
    'https://portal.example/cancel','https://project.example/itn',
    '{"merchant_id":"10000100","m_payment_id":"ord_phase5_0001","amount":"169.99"}'::jsonb
  );
  IF v_again->>'reused' IS DISTINCT FROM 'true' OR (SELECT count(*) FROM public.finance_orders WHERE candidate_ref='11111111-1111-4111-8111-111111111111') <> 1 THEN
    RAISE EXCEPTION 'checkout idempotency failed: %',v_again;
  END IF;

  INSERT INTO public.payfast_itn_receipts(
    itn_ref,merchant_reference,provider_payment_id,payment_status,amount_gross,
    signature_valid,ip_valid,amount_valid,accepted,idempotency_key,evidence_ref
  ) VALUES (
    'itn_phase5_0001','ord_phase5_0001','123456789','COMPLETE','169.99',
    true,true,true,true,'itn-idem-phase5-0001','evidence_itn_0001'
  );
  v_settle := public.payfast_settle_sandbox_payment(
    'ord_phase5_0001','123456789',16999,499,16500,'pay_phase5_0001',
    'evidence_payment_0001','itn_phase5_0001','11111111-1111-4111-8111-111111111111'
  );
  IF v_settle->>'outcome' IS DISTINCT FROM 'recorded'
     OR (SELECT order_status FROM public.finance_orders WHERE order_ref='ord_phase5_0001') <> 'PAID'
     OR (SELECT verified FROM public.finance_payments WHERE payment_ref='pay_phase5_0001') IS NOT TRUE
     OR (SELECT count(*) FROM public.notification_outbox WHERE idempotency_key='payment-verified:pay_phase5_0001') <> 1
     OR (SELECT count(*) FROM public.candidate_portal_messages WHERE portal_message_ref='portal-payment-verified:pay_phase5_0001') <> 1 THEN
    RAISE EXCEPTION 'verified settlement did not atomically update order, audit and notification: %',v_settle;
  END IF;
  v_settle := public.payfast_settle_sandbox_payment(
    'ord_phase5_0001','123456789',16999,499,16500,'pay_phase5_duplicate',
    'evidence_duplicate','itn_phase5_0001','11111111-1111-4111-8111-111111111111'
  );
  IF v_settle->>'outcome' IS DISTINCT FROM 'duplicate' THEN
    RAISE EXCEPTION 'duplicate provider payment was not idempotent: %',v_settle;
  END IF;

  PERFORM set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true);
  v_summary := public.get_candidate_finance_summary();
  IF jsonb_array_length(v_summary->'orders') <> 1 OR jsonb_array_length(v_summary->'payments') <> 1 THEN
    RAISE EXCEPTION 'candidate finance summary failed ownership/read contract: %',v_summary;
  END IF;
  v_refund := public.request_candidate_finance_refund('pay_phase5_0001',5000,'Service was not delivered as agreed');
  v_refund_ref := v_refund->>'refund_ref';
  IF v_refund->>'refund_status' IS DISTINCT FROM 'PENDING_REVIEW' OR v_refund->>'refund_executed' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'refund request must remain pending human review: %',v_refund;
  END IF;
  PERFORM set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000001',true);
  v_review := public.review_finance_refund_request(v_refund_ref,'APPROVE','Reviewed evidence and policy','approval-fixture-001');
  IF v_review->>'refund_status' IS DISTINCT FROM 'APPROVED' OR v_review->>'refund_executed' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'refund review must not execute a provider refund: %',v_review;
  END IF;

  INSERT INTO public.candidate_communication_preferences(candidate_ref,transactional_email_enabled,consent_source)
  VALUES ('optout-candidate',false,'USER_PREFERENCE');
  INSERT INTO public.notification_outbox(
    notification_ref,candidate_ref,channel,recipient,subject,body,purpose,status,idempotency_key,
    scheduled_for,evidence_ref,max_attempts
  ) VALUES (
    'notif-optout-001','optout-candidate','EMAIL_PRIMARY','optout@example.test','Test','Test body',
    'TEST','QUEUED','idem-optout-001',now(),'evidence-optout-001',2
  );
  PERFORM public.claim_notification_outbox(20);
  IF (SELECT status FROM public.notification_outbox WHERE notification_ref='notif-optout-001') <> 'QUEUED' THEN
    RAISE EXCEPTION 'opted-out candidate notification was claimed';
  END IF;

  UPDATE public.candidate_communication_preferences SET transactional_email_enabled=true,suppressed_at=null,suppression_reason=null
    WHERE candidate_ref='optout-candidate';
  SELECT count(*) INTO v_claimed FROM public.claim_notification_outbox(20)
    WHERE notification_ref='notif-optout-001';
  IF v_claimed <> 1 THEN RAISE EXCEPTION 'eligible email was not claimed'; END IF;
  PERFORM public.record_notification_delivery_attempt('notif-optout-001','FAILED','MOCK',null,'MOCK_FAIL','{"simulated":true}'::jsonb,'MOCK_FAILURE');
  UPDATE public.notification_outbox SET next_attempt_at=now() WHERE notification_ref='notif-optout-001';
  SELECT count(*) INTO v_claimed FROM public.claim_notification_outbox(20)
    WHERE notification_ref='notif-optout-001';
  IF v_claimed <> 1 THEN RAISE EXCEPTION 'failed email was not retried'; END IF;
  PERFORM public.record_notification_delivery_attempt('notif-optout-001','FAILED','MOCK',null,'MOCK_FAIL','{"simulated":true}'::jsonb,'MOCK_FAILURE');
  IF (SELECT status FROM public.notification_outbox WHERE notification_ref='notif-optout-001') <> 'DEAD_LETTER' THEN
    RAISE EXCEPTION 'notification did not enter dead-letter state after retry limit';
  END IF;

  INSERT INTO public.candidate_private_document_events(document_id,candidate_id,event_type,from_status,to_status,metadata)
  VALUES ('99999999-9999-4999-8999-999999999999','11111111-1111-4111-8111-111111111111','REVIEW_DECISION','UNDER_REVIEW','CORRECTION_REQUIRED','{"reviewer_note":"Upload clearer evidence"}');
  IF NOT EXISTS (SELECT 1 FROM public.candidate_portal_messages WHERE title='Document correction requested' AND candidate_ref='11111111-1111-4111-8111-111111111111')
     OR NOT EXISTS (SELECT 1 FROM public.notification_outbox WHERE template_key='document_review_status_v1' AND candidate_ref='11111111-1111-4111-8111-111111111111') THEN
    RAISE EXCEPTION 'document review did not enqueue portal/email notifications';
  END IF;

  INSERT INTO public.candidate_communication_preferences(candidate_ref,transactional_email_enabled,consent_source)
  VALUES ('candidate-bounce',true,'USER_PREFERENCE');
  INSERT INTO public.notification_outbox(
    notification_ref,candidate_ref,channel,recipient,subject,body,purpose,status,idempotency_key,
    scheduled_for,evidence_ref,provider_delivery_status
  ) VALUES (
    'notif-bounce-001','candidate-bounce','EMAIL_PRIMARY','bounce@example.test','Test','Test body',
    'TEST','SENT','idem-bounce-001',now(),'evidence-bounce-001','ACCEPTED'
  );
  INSERT INTO public.notification_delivery_attempts(
    attempt_ref,notification_ref,channel,provider,provider_message_id,status,response_code,response_body,evidence_ref
  ) VALUES ('attempt-bounce-001','notif-bounce-001','EMAIL_PRIMARY','RESEND','resend_msg_001','SENT','200','{}'::jsonb,'evidence-bounce-001');
  PERFORM public.record_notification_provider_event('svix-event-001','resend_msg_001','BOUNCED','{"provider":"RESEND","event_type":"email.bounced"}'::jsonb);
  IF (SELECT provider_delivery_status FROM public.notification_outbox WHERE notification_ref='notif-bounce-001') <> 'BOUNCED'
     OR (SELECT transactional_email_enabled FROM public.candidate_communication_preferences WHERE candidate_ref='candidate-bounce') IS NOT FALSE THEN
    RAISE EXCEPTION 'provider bounce did not update delivery state and suppress further transactional email';
  END IF;

  IF has_table_privilege('authenticated','public.notification_outbox','SELECT')
     OR has_table_privilege('anon','public.finance_payments','SELECT')
     OR has_table_privilege('authenticated','public.finance_orders','SELECT')
     OR has_function_privilege('anon','public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'client roles have excessive finance or outbox privileges';
  END IF;
END;
$test$;

ROLLBACK;
