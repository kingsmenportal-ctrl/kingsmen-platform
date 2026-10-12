-- Defense-in-depth hardening for RLS helper function resolution.
-- The definitions in 0019 also pin search_path; these ALTER statements protect already-initialized staging schemas.
ALTER FUNCTION kingsmen_security.current_runtime_role() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.current_service_context() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.current_candidate_public_ref() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.is_backend_service_role() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.is_founder_or_operator() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.is_founder() SET search_path = pg_catalog;
ALTER FUNCTION kingsmen_security.current_candidate_id() SET search_path = pg_catalog;
