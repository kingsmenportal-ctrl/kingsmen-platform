-- 0030 - Narrow authenticated write privileges to explicit candidate workflows.
-- RLS remains required; SQL grants alone never authorize cross-candidate access.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.candidate_accounts FROM authenticated;
GRANT SELECT ON TABLE public.candidate_accounts TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.candidates FROM authenticated;
GRANT SELECT ON TABLE public.candidates TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.applications FROM authenticated;
GRANT SELECT ON TABLE public.applications TO authenticated;
REVOKE INSERT, DELETE ON TABLE public.candidate_profiles FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.candidate_profiles TO authenticated;
REVOKE DELETE ON TABLE public.candidate_portal_state FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.candidate_portal_state TO authenticated;
