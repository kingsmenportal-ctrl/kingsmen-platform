-- 0009 - RLS Security Boundary Hardening
-- Purpose: replace bootstrap-wide policies with trusted JWT-claim scoped policies.
-- candidate_public_ref, kingsmen_role, and service_context must be server-managed app_metadata claims; never accept user_metadata or client-settable GUCs.
-- Public launch remains blocked until this migration is applied and proven against staging.

CREATE SCHEMA IF NOT EXISTS kingsmen_security;

CREATE OR REPLACE FUNCTION kingsmen_security.current_runtime_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(auth.jwt() -> 'app_metadata' ->> 'kingsmen_role', ''), NULLIF(auth.jwt() ->> 'role', ''), 'anonymous')
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.current_service_context()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(auth.jwt() -> 'app_metadata' ->> 'service_context', ''), 'none')
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.current_candidate_public_ref()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'candidate_public_ref', '')
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.is_backend_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT kingsmen_security.current_runtime_role() = 'service_role'
    AND kingsmen_security.current_service_context() = 'backend_api'
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.is_founder_or_operator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT kingsmen_security.current_runtime_role() IN ('founder', 'operator')
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.is_founder()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT kingsmen_security.current_runtime_role() = 'founder'
$$;

CREATE OR REPLACE FUNCTION kingsmen_security.current_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT id
  FROM public.candidates
  WHERE public_ref = kingsmen_security.current_candidate_public_ref()
  LIMIT 1
$$;

REVOKE ALL ON SCHEMA kingsmen_security FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA kingsmen_security FROM PUBLIC;
GRANT USAGE ON SCHEMA kingsmen_security TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kingsmen_security TO authenticated, service_role;

-- Remove N03 bootstrap-wide policies. Trusted runtime identity comes from server-managed JWT app_metadata;
-- never trust client-settable GUCs or user_metadata. The Supabase service_role key bypasses RLS and is backend-only.
DROP POLICY IF EXISTS service_role_all_candidates ON candidates;
DROP POLICY IF EXISTS service_role_all_candidate_profiles ON candidate_profiles;
DROP POLICY IF EXISTS service_role_all_applications ON applications;
DROP POLICY IF EXISTS service_role_all_idempotency_keys ON idempotency_keys;
DROP POLICY IF EXISTS service_role_all_command_log ON command_log;
DROP POLICY IF EXISTS service_role_all_workflow_runs ON workflow_runs;
DROP POLICY IF EXISTS service_role_all_evidence_ledger ON evidence_ledger;
DROP POLICY IF EXISTS service_role_all_audit_events ON audit_events;
DROP POLICY IF EXISTS service_role_all_source_authorities ON source_authorities;
DROP POLICY IF EXISTS service_role_all_route_sources ON route_sources;
DROP POLICY IF EXISTS service_role_all_worker_heartbeats ON worker_heartbeats;
DROP POLICY IF EXISTS service_role_all_dead_letter_queue ON dead_letter_queue;
DROP POLICY IF EXISTS service_role_all_approval_requests ON approval_requests;
DROP POLICY IF EXISTS service_role_all_system_runtime_config ON system_runtime_config;

-- Candidates.
CREATE POLICY candidates_service_role_backend_all ON candidates
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY candidates_founder_operator_read ON candidates
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY candidates_candidate_read_own ON candidates
  FOR SELECT TO authenticated USING (public_ref = kingsmen_security.current_candidate_public_ref());

-- Candidate profiles.
CREATE POLICY candidate_profiles_service_role_backend_all ON candidate_profiles
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY candidate_profiles_founder_operator_read ON candidate_profiles
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY candidate_profiles_candidate_read_own ON candidate_profiles
  FOR SELECT TO authenticated USING (candidate_id = kingsmen_security.current_candidate_id());

-- Applications.
CREATE POLICY applications_service_role_backend_all ON applications
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY applications_founder_operator_read ON applications
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY applications_candidate_read_own ON applications
  FOR SELECT TO authenticated USING (candidate_id = kingsmen_security.current_candidate_id());

-- Evidence and operational tables: candidates may read only their own safe rows where applicable.
CREATE POLICY evidence_ledger_service_role_backend_all ON evidence_ledger
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY evidence_ledger_founder_operator_read ON evidence_ledger
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY evidence_ledger_candidate_read_own_safe ON evidence_ledger
  FOR SELECT TO authenticated USING (
    candidate_id = kingsmen_security.current_candidate_id()
    AND protected_data = false
  );

CREATE POLICY audit_events_service_role_backend_all ON audit_events
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY audit_events_founder_read ON audit_events
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder());

CREATE POLICY workflow_runs_service_role_backend_all ON workflow_runs
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY workflow_runs_founder_operator_read ON workflow_runs
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY workflow_runs_candidate_read_own ON workflow_runs
  FOR SELECT TO authenticated USING (candidate_id = kingsmen_security.current_candidate_id());

CREATE POLICY command_log_service_role_backend_all ON command_log
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY command_log_founder_operator_read ON command_log
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY idempotency_keys_service_role_backend_all ON idempotency_keys
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY worker_heartbeats_service_role_backend_all ON worker_heartbeats
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY worker_heartbeats_founder_operator_read ON worker_heartbeats
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY dead_letter_queue_service_role_backend_all ON dead_letter_queue
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY dead_letter_queue_founder_operator_read ON dead_letter_queue
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY approval_requests_service_role_backend_all ON approval_requests
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY approval_requests_founder_operator_read ON approval_requests
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

-- Source metadata: only verified route/source rows can be read outside operator/founder/service contexts.
CREATE POLICY source_authorities_service_role_backend_all ON source_authorities
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY source_authorities_founder_operator_read ON source_authorities
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY route_sources_service_role_backend_all ON route_sources
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY route_sources_founder_operator_read ON route_sources
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

CREATE POLICY route_sources_public_verified_read ON route_sources
  FOR SELECT TO anon, authenticated, service_role USING (status = 'VERIFIED' AND confidence_band IN ('A', 'B'));

CREATE POLICY system_runtime_config_service_role_backend_all ON system_runtime_config
  FOR ALL TO service_role USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

CREATE POLICY system_runtime_config_founder_operator_read ON system_runtime_config
  FOR SELECT TO authenticated, service_role USING (kingsmen_security.is_founder_or_operator());

COMMENT ON SCHEMA kingsmen_security IS 'Kingsmen runtime-claim RLS helpers. Public launch still requires staging proof.';
