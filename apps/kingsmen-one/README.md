# Kingsmen One — isolated application foundation

Kingsmen One is a separate, mobile-first candidate portal foundation within the Kingsmen platform repository. It does not replace Kingsmen Gateway or alter the existing production/staging deployment.

## Current delivery boundary
- Responsive candidate workspace with dashboard, pathway overview, opportunities, application preparation, document readiness and activity views.
- Local demo state is explicitly labelled and stored only in the browser. It is not a real account, secure document store, provider submission, payment, or verified outcome.
- Candidate-reported progress is kept distinct from independently verified outcomes.
- The canonical sixth pathway name is intentionally not guessed; it must be read from an authoritative Kingsmen source before being shown as a real pathway.
- Supabase staging was inspected read-only. No schema, RLS policy, row, or credential was changed by this foundation commit.
- Replit app creation currently returns `requires_active_subscription`; no Replit app URL was returned.
- Netlify is not yet connected to this branch and no Kingsmen One deploy has been made.

## Run locally
Serve this folder with any static HTTP server, or open `index.html` directly. The smoke test uses Node's built-in test runner and requires no install:

`node --test tests/smoke.test.mjs`

## Integration gates
Before production use, wire real Supabase Auth, bind the authenticated user to the correct candidate only through the authorised identity-review flow (never email matching), enforce server-side authorization and RLS, use private Storage for document bytes, and add authenticated end-to-end tests. Provider submissions, payments, refunds and entitlements must use verified evidence and server-side workflows. Never place service-role secrets in browser code.

## Delivery state
This is the first tracked foundation batch, not a claim that the full Kingsmen platform is complete, tested in a live environment, connected to every provider, or deployed.


## Verified-candidate readiness persistence
The candidate workspace now calls the Supabase Edge Function `candidate-workspace-readiness` to load and save preparation-task completion and the selected priority pathway. The function requires a valid Supabase Auth session, resolves the candidate exclusively through `candidate_auth_identity_links` with `link_status=VERIFIED` and a non-null `verified_at`, and only then reads/writes `candidate_workspace_readiness`. The browser never supplies an authoritative `candidate_id`, and the service-role key remains server-side.

Accounts without a verified identity link keep using the local preview state and cannot read or write candidate readiness records. This endpoint does not persist profile fields, upload documents, submit applications, or independently verify a candidate's reported progress. Automated source-contract tests cover the boundary; authenticated browser E2E still requires a controlled verified test account.


## Persistent application preparation (implemented; live journey pending)
The `candidate-application-preparation` Edge Function is deployed with JWT verification enabled. It resolves candidate ownership only through a server-verified `candidate_auth_identity_links` row (`link_status=VERIFIED` and non-null `verified_at`). It can load the candidate's trackers/checklists, create a tracker only from a saved route owned by the signed-in account and still marked verified in `route_programmes`, add bounded task/document checklist items, and record candidate-reported preparation/evidence references. Candidate IDs are never accepted from the browser.

The frontend now connects the Applications view to the persistent tracker and checklist endpoints. Four default preparation items are created for a new tracker. A candidate-reported submission requires an evidence reference and is explicitly not provider-confirmed submission. This workflow does not upload private documents or change provider application/outcome records. Source-contract coverage is added; a controlled authenticated browser journey and Netlify frontend deployment remain outstanding.
