-- N06 least-privilege hardening for tables created by migration 0060.
-- API routes use the server-side service role; browser roles must have no direct table grants.
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public.candidate_opportunities FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.candidate_saved_opportunities FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.candidate_applications FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.candidate_application_events FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_opportunities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_saved_opportunities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_applications TO service_role;
GRANT SELECT, INSERT ON TABLE public.candidate_application_events TO service_role;
COMMIT;
