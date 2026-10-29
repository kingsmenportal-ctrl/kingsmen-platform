-- N17 founder operations contain private operational and aggregate candidate-risk data.
-- API runtime accesses these tables using a server-only PostgreSQL credential after
-- verifying the Supabase Auth session and an active FOUNDER operator grant.
do $$
declare t text;
begin
  foreach t in array array[
    'founder_runtime_config','founder_operator_profiles','founder_command_catalog',
    'founder_command_requests','founder_command_results','founder_daily_briefs',
    'founder_watchlist_items','founder_escalation_threads','founder_decision_log',
    'founder_mobile_cards','founder_ops_audit_events'
  ] loop
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- Remove the legacy permissive policies; table grants are also revoked above.
drop policy if exists founder_runtime_config_all on public.founder_runtime_config;
drop policy if exists founder_operator_profiles_all on public.founder_operator_profiles;
drop policy if exists founder_command_catalog_all on public.founder_command_catalog;
drop policy if exists founder_command_requests_all on public.founder_command_requests;
drop policy if exists founder_command_results_all on public.founder_command_results;
drop policy if exists founder_daily_briefs_all on public.founder_daily_briefs;
drop policy if exists founder_watchlist_items_all on public.founder_watchlist_items;
drop policy if exists founder_escalation_threads_all on public.founder_escalation_threads;
drop policy if exists founder_decision_log_all on public.founder_decision_log;
drop policy if exists founder_mobile_cards_all on public.founder_mobile_cards;
drop policy if exists founder_ops_audit_events_all on public.founder_ops_audit_events;
