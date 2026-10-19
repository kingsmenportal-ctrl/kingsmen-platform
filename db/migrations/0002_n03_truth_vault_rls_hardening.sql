-- N03 follow-up: remove the implicit PUBLIC audience from the initial service policies.
-- Apply only after reviewing the target database and approved migration procedure.
-- This file is declarative source; it does not apply itself to any environment.
BEGIN;

DROP POLICY IF EXISTS service_role_all_candidates ON public.candidates;
CREATE POLICY service_role_all_candidates ON public.candidates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_candidate_profiles ON public.candidate_profiles;
CREATE POLICY service_role_all_candidate_profiles ON public.candidate_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_applications ON public.applications;
CREATE POLICY service_role_all_applications ON public.applications
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_idempotency_keys ON public.idempotency_keys;
CREATE POLICY service_role_all_idempotency_keys ON public.idempotency_keys
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_command_log ON public.command_log;
CREATE POLICY service_role_all_command_log ON public.command_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_workflow_runs ON public.workflow_runs;
CREATE POLICY service_role_all_workflow_runs ON public.workflow_runs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_evidence_ledger ON public.evidence_ledger;
CREATE POLICY service_role_all_evidence_ledger ON public.evidence_ledger
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_audit_events ON public.audit_events;
CREATE POLICY service_role_all_audit_events ON public.audit_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_source_authorities ON public.source_authorities;
CREATE POLICY service_role_all_source_authorities ON public.source_authorities
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_route_sources ON public.route_sources;
CREATE POLICY service_role_all_route_sources ON public.route_sources
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_worker_heartbeats ON public.worker_heartbeats;
CREATE POLICY service_role_all_worker_heartbeats ON public.worker_heartbeats
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_dead_letter_queue ON public.dead_letter_queue;
CREATE POLICY service_role_all_dead_letter_queue ON public.dead_letter_queue
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_approval_requests ON public.approval_requests;
CREATE POLICY service_role_all_approval_requests ON public.approval_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_system_runtime_config ON public.system_runtime_config;
CREATE POLICY service_role_all_system_runtime_config ON public.system_runtime_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
