-- 0029 - Remove anonymous SQL privileges from candidate-sensitive tables.
-- RLS policies remain the row-level boundary for authenticated users; this is
-- an additional least-privilege layer and does not replace two-user runtime tests.
REVOKE ALL PRIVILEGES ON TABLE
  public.candidate_accounts,
  public.candidates,
  public.candidate_profiles,
  public.applications
FROM anon, PUBLIC;

-- Candidate sessions only need reads on the identity map and candidate/application
-- records, plus profile updates allowed by the existing own-candidate RLS policy.
GRANT SELECT ON TABLE
  public.candidate_accounts,
  public.candidates,
  public.candidate_profiles,
  public.applications
TO authenticated;

GRANT UPDATE ON TABLE public.candidate_profiles TO authenticated;

-- The candidate identity mapping and candidate/application records remain
-- backend-managed for writes; no authenticated insert/delete or application
-- mutation privilege is introduced by this migration.
