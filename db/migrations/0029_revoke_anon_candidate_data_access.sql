-- 0029 - Remove anonymous SQL privileges from candidate-sensitive tables.
-- RLS policies remain the row-level boundary for authenticated users; this is
-- an additional least-privilege layer and does not replace two-user runtime tests.
REVOKE ALL PRIVILEGES ON TABLE
  public.candidate_accounts,
  public.candidates,
  public.candidate_profiles,
  public.applications
FROM anon, PUBLIC;

-- Preserve authenticated candidate workflows and trusted backend access explicitly.
GRANT SELECT ON TABLE
  public.candidate_accounts,
  public.candidates,
  public.candidate_profiles,
  public.applications
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.candidate_profiles,
  public.applications
TO authenticated;

-- The candidate identity mapping is operator/backend-managed only.
REVOKE ALL PRIVILEGES ON TABLE public.candidate_accounts FROM authenticated;
GRANT SELECT ON TABLE public.candidate_accounts TO authenticated;

-- Candidate records are read-only to candidate sessions; mutation remains trusted-backend-only.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.candidates FROM authenticated;
