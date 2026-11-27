-- Phase 5 least-privilege hardening.
-- Finance, payment and candidate communication truth is accessed only through reviewed server-side paths.
-- RLS does not protect TRUNCATE, REFERENCES, or TRIGGER privileges, so direct table
-- grants to anon/authenticated must be removed as well.
begin;

do $phase5_finance_privileges$
declare
  missing_tables text[];
begin
  select array_agg(t.table_name order by t.table_name)
    into missing_tables
  from (values
    ('finance_plan_catalog'),
    ('finance_orders'),
    ('finance_invoices'),
    ('payfast_payment_intents'),
    ('finance_payments'),
    ('payfast_itn_receipts'),
    ('payfast_signature_audit'),
    ('finance_refund_requests'),
    ('finance_ledger_entries'),
    ('finance_audit_events'),
    ('candidate_communication_preferences'),
    ('candidate_communications'),
    ('candidate_communication_attempts'),
    ('candidate_messages'),
    ('candidate_mobile_notification_preferences')
  ) as t(table_name)
  where to_regclass('public.' || quote_ident(t.table_name)) is null;

  if missing_tables is not null then
    raise exception 'PHASE5_FINANCE_SCHEMA_INCOMPLETE: %', array_to_string(missing_tables, ', ');
  end if;
end
$phase5_finance_privileges$;

revoke all privileges on table
  public.finance_plan_catalog,
  public.finance_orders,
  public.finance_invoices,
  public.payfast_payment_intents,
  public.finance_payments,
  public.payfast_itn_receipts,
  public.payfast_signature_audit,
  public.finance_refund_requests,
  public.finance_ledger_entries,
  public.finance_audit_events,
  public.candidate_communication_preferences,
  public.candidate_communications,
  public.candidate_communication_attempts,
  public.candidate_messages,
  public.candidate_mobile_notification_preferences
from anon, authenticated;

comment on table public.finance_orders is
  'Kingsmen Phase 5 finance truth; direct anon/authenticated table privileges revoked; access via reviewed server-side workflows only.';
comment on table public.finance_payments is
  'Kingsmen Phase 5 payment truth; payment status is server-authoritative and requires verified PayFast ITN evidence.';

commit;
