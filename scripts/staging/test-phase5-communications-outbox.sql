do $test$
declare
  v_candidate_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_candidate_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  v_document_a uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_document_b uuid := '99999999-9999-4999-8999-999999999999';
  v_review_a uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  v_review_b uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  v_outbox_count integer;
begin
  insert into public.candidate_communication_preferences(candidate_id,email_address,email_transactional)
  values (v_candidate_a,'candidate-a@example.test',true),(v_candidate_b,'candidate-b@example.test',false);
  insert into public.candidate_private_documents(id,candidate_id,application_id,original_filename,status)
  values
    (v_document_a,v_candidate_a,'11111111-1111-4111-8111-111111111111','proof.pdf','CORRECTION_REQUIRED'),
    (v_document_b,v_candidate_b,'bbbbbbbb-0000-4000-8000-000000000001','opted-out.pdf','VERIFIED');

  insert into public.candidate_private_document_reviews(id,document_id,candidate_id,reviewer_auth_user_id,decision,reviewer_note,evidence_reference)
  values (v_review_a,v_document_a,v_candidate_a,'22222222-2222-4222-8222-222222222222','CORRECTION_REQUIRED','Please replace the unreadable file.','review-evidence-001');
  insert into public.candidate_private_document_reviews(id,document_id,candidate_id,reviewer_auth_user_id,decision,reviewer_note,evidence_reference)
  values (v_review_b,v_document_b,v_candidate_b,'22222222-2222-4222-8222-222222222222','VERIFIED','not applicable','review-evidence-002');

  insert into public.finance_payments(payment_ref,order_ref,candidate_ref,payment_status,verified)
  values ('pay_a','ord_a',v_candidate_a::text,'PENDING',false);
  update public.finance_payments set payment_status='COMPLETE',verified=true where payment_ref='pay_a';
  update public.finance_payments set payment_status='COMPLETE',verified=true where payment_ref='pay_a';

  select count(*) into v_outbox_count from public.notification_outbox;
  if v_outbox_count <> 2 then raise exception 'expected 2 consented event notifications, got %',v_outbox_count; end if;
  if exists(select 1 from public.notification_outbox where status <> 'QUEUED' or sent_at is not null) then
    raise exception 'notification event was incorrectly marked delivered';
  end if;
  if exists(select 1 from public.notification_outbox where recipient='candidate-b@example.test') then
    raise exception 'opted-out candidate received a queued notification';
  end if;
  if exists(select 1 from public.notification_outbox where body ilike '%unreadable%' or body ilike '%review-evidence%') then
    raise exception 'notification contains sensitive reviewer note/evidence';
  end if;
  if (select count(*) from public.notification_outbox where idempotency_key='payment-verified:pay_a') <> 1 then
    raise exception 'verified payment update was not idempotent';
  end if;
  if (select count(*) from public.notification_delivery_attempts) <> 0 then
    raise exception 'event enqueue falsely created a delivery attempt';
  end if;
end
$test$;
select 'PASS: document-review and verified-payment events enqueue consented, idempotent email without claiming delivery.' as result;
