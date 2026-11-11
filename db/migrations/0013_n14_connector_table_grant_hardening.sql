-- N14 least-privilege hardening.
-- These operational tables are backend-only. RLS policies already target service_role;
-- revoke table-level grants from public API roles as an independent defense-in-depth layer.
begin;

revoke all privileges on table
  public.integration_connectors,
  public.workflow_connector_registry,
  public.integration_outbox,
  public.integration_inbox,
  public.workflow_result_events,
  public.webhook_security_events,
  public.n8n_workflow_dispatches,
  public.airtable_mirror_events,
  public.playwright_probe_events,
  public.integration_dead_letter_queue,
  public.integration_health_snapshots
from anon, authenticated, public;

-- Intentionally do not grant anything here. The service_role backend boundary must
-- remain explicit and managed by the existing Supabase role setup.

commit;
