-- N10 hardening: keep finance and lifecycle records behind the trusted server boundary.
-- APIs authenticate Supabase sessions, map them to candidate identities, then use service-role queries.
-- Do not grant direct PostgREST table privileges to anon/authenticated clients.
REVOKE ALL PRIVILEGES ON TABLE
  public.service_packages,
  public.candidate_service_orders,
  public.candidate_payment_events,
  public.candidate_refund_requests,
  public.finance_audit_events
FROM PUBLIC, anon, authenticated;

-- The audit trail is append-only, including for privileged application paths.
CREATE OR REPLACE FUNCTION public.n10_prevent_finance_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'finance audit events are immutable';
END;
$$;

DROP TRIGGER IF EXISTS n10_finance_audit_immutable ON public.finance_audit_events;
CREATE TRIGGER n10_finance_audit_immutable
BEFORE UPDATE OR DELETE ON public.finance_audit_events
FOR EACH ROW EXECUTE FUNCTION public.n10_prevent_finance_audit_mutation();

-- Explicitly document that browser roles cannot invoke service-bound finance RPCs
-- if future migrations add them without an explicit grant.
REVOKE ALL ON FUNCTION public.n10_prevent_finance_audit_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n10_prevent_finance_audit_mutation() TO service_role;
