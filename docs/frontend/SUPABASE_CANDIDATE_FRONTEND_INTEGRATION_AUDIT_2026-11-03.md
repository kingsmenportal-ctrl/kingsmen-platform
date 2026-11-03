# Supabase candidate frontend integration — source and runtime evidence

Audit date: 2026-11-03  
Project: `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
Repository branch: `feat/kingsmen-frontend-implementation-2026-11-03`  
PR: [#317](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/317)

## Live Edge Function source synchronisation

The two candidate flows called by the frontend were retrieved from the active staging Supabase project and copied byte-for-byte into this repository branch:

| Function | Live status | Version | JWT verification | Deployed source SHA-256 | Tracked source |
|---|---:|---:|---:|---|---|
| `candidate-master-profile` | ACTIVE | 3 | true | `824ec08a6c9f21f7e33bd974ed21e2609419c73492721be18e7d1c02af977bf9` | `supabase/functions/candidate-master-profile/index.ts` |
| `candidate-save-verified-opportunity` | ACTIVE | 3 | true | `4fa2199309074ce3db6b0e78757b1bfb6076e2e45faf5faaf301ba280d88e292` | `supabase/functions/candidate-save-verified-opportunity/index.ts` |

Both live functions validate the bearer session with Supabase Auth. Profile resolution uses an explicit Auth-user-to-candidate identity link; email equality is used only as a duplicate/manual-review guard during self-service bootstrap, not to attach an existing candidate. The opportunity-save function requires a verified identity, active profile-processing consent, an approved N15 match, official provider/programme evidence and a fresh source observation. It prepares a Kingsmen parent application in DRAFT state; it does not submit to a provider.

The profile bootstrap RPC is SECURITY DEFINER and its execute ACL is restricted to `service_role` and `postgres`. The parent-application preparation RPC is SECURITY DEFINER and is executable by `authenticated`; its body checks `auth.uid()`, the authenticated candidate mapping, active consent, current N15 evidence and pathway consistency before creating a DRAFT. This public-schema privileged RPC is also reported by Supabase Security Advisors and requires explicit security-owner review of the intended exposure.

## Database state confirmed in staging

- `public.candidate_auth_identity_links`, `public.candidate_master_profiles`, and `public.candidate_workspace_saved_opportunities` exist and have RLS enabled.
- At audit time, each of those three tables had zero rows. This means the schema and function deployments exist, but no real candidate profile, verified identity link or saved-opportunity record was available for a reload/re-login or Candidate A/B runtime isolation test.
- The saved-opportunity RLS predicate is based on `private.current_verified_candidate_id()`, which resolves the authenticated user's explicitly VERIFIED identity link. However, the table currently has broad table-level privileges for `anon` as well as `authenticated`; policies still constrain rows, but the anonymous grants are wider than the current browser flow requires. The current frontend only reads the list directly; server-side service-role code performs the upsert. Narrow the grants and policy roles in a reviewed migration before release.
- Supabase Security Advisors (2026-11-03) reported: 6 authenticated-callable SECURITY DEFINER functions; 17 RLS-enabled tables without policies; and leaked-password protection disabled. Some no-policy tables appear intended for backend/reviewer operations and should remain inaccessible to client roles; triage each finding rather than applying blanket policies. The SECURITY DEFINER findings must be reviewed individually. The specific parent-application preparation RPC includes ownership, consent and source checks, but its exposure should still receive independent review.
- No candidate PII or row contents are included in this audit.

## Source-of-truth drift — migration files are incomplete

The staging migration ledger ends at `20261029193124 candidate_self_service_profile_bootstrap_0095`. The repository tree at the audited branch contained migrations through `0086` (plus older baseline files), but not the deployed `0087`–`0095` migration set or a checked-in migration that recreates the profile-bootstrap schema/RPC as deployed. The function source is now tracked; the database history is not yet reproducible from this branch.

Do not fabricate SQL from a migration name. Recover the exact deployed schema changes and their provenance, review them against the live schema, then commit them as ordered migrations before claiming that a clean environment can be rebuilt from source.

## Release and test boundary

- Green repository tests/builds are evidence for the exact SHA on which they ran; each new commit needs its own run.
- The existence of deployed Edge Functions and RLS policies does not prove candidate authentication, profile persistence, cross-session reload, Candidate A/B isolation or a successful opportunity-save action. Those require authorised staging test accounts and runtime evidence.
- Private document upload/read, PayFast settlement, provider receipt and provider outcome remain independent tests. Do not infer them from profile/opportunity function success.
- This audit makes no database schema changes and does not change active Edge Function versions.
