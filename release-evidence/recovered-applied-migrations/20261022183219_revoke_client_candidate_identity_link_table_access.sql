-- Identity links are a backend-only binding ledger. Client roles must not
-- inspect or mutate links; candidate identity is resolved through the private
-- helper and authorised reviewer workflow.
REVOKE ALL PRIVILEGES ON TABLE public.candidate_auth_identity_links
  FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_auth_identity_links
  TO service_role;
COMMENT ON TABLE public.candidate_auth_identity_links IS
  'Backend-only identity binding ledger. Clients must not read or mutate identity links directly; verified access is resolved through the private current_verified_candidate_id helper and audited reviewer workflow.';
