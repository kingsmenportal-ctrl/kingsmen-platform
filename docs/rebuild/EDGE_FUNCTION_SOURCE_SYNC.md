# Supabase Edge Function source reconciliation

Observed on 2026-11-19 against staging project `euhubhhnumtibbyufghm`.

## Candidate profile function captured

- Function: `candidate-master-profile`
- Deployed status: ACTIVE
- Deployed version reported by Supabase: 4
- `verify_jwt`: true
- Deployed source hash reported by Supabase: `824ec08a6c9f21f7e33bd974ed21e2609419c73492721be18e7d1c02af977bf9`
- Captured to `supabase/functions/candidate-master-profile/index.ts` on rebuild branch commit `5bd64bf4d76819a7f70116ce633cdcf302540d5a`.
- Purpose: authenticated candidate profile load/save, self-service bootstrap with consent, profile correction requests, and consent withdrawal. Uses server-side `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function environment; the candidate browser calls the function using the public anon key plus the authenticated user's Bearer token.

This file is a source capture from the deployed function. It was **not deployed** or changed in Supabase by this operation. Before future deployments, review the source against the live function, run the relevant tests, and verify the intended CORS origins.

## Repository/live drift

The initial main-branch tree contained source for only two functions under `supabase/functions/` (`n15-candidate-opportunities` and `n15-source-ingestion`), while the active Supabase project reported 21 active Edge Functions. The new profile page depends on `candidate-master-profile`, so that exact deployed source has now been captured in the rebuild branch rather than leaving a live dependency without a source-controlled file.

This does not reconcile all deployed functions. Inventory the remaining functions and capture/review each source before consolidating, retiring or redeploying them. Never infer a function can be removed from the name or inventory alone.

## CORS / runtime prerequisite

The deployed profile function allows the staging origin `https://kingsmen-portal-staging.netlify.app`, local ports 8888, and Netlify deploy-preview subdomains matching its allowlist regex. The actual frontend hostname must be confirmed before a browser integration test. Do not broaden CORS indiscriminately; add only the actual authorized Kingsmen origins and then test preflight plus authenticated requests.
