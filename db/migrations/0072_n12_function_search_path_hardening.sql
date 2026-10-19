-- N12 database hardening: pin search_path for append-only / transition guard triggers.
-- These trigger functions do not need caller-controlled schema resolution. pg_catalog
-- is explicit first; public contains the trigger functions' own schema; pg_temp is last.
-- This migration intentionally leaves RLS-deny-by-default finance tables unchanged.
ALTER FUNCTION public.prevent_candidate_application_event_mutation()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.prevent_candidate_outcome_ledger_mutation()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.guard_candidate_outcome_identity()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.guard_n09_communication_state()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.prevent_n09_ledger_delete()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.n10_prevent_finance_audit_mutation()
  SET search_path = pg_catalog, public, pg_temp;
