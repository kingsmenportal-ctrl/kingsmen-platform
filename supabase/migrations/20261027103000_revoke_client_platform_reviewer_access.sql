-- Reviewer grants are backend authorization records, not client-readable data.
-- Edge Functions use service_role after validating the caller's JWT and reviewer grant.
-- Remove inherited and direct client privileges; do not depend on RLS alone.
REVOKE ALL PRIVILEGES ON TABLE public.platform_reviewers
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_reviewers
  TO service_role;

COMMENT ON TABLE public.platform_reviewers IS
  'Backend-only reviewer authorization registry. Client roles cannot read or mutate grants directly; Edge Functions validate the authenticated caller and use service-role access.';
