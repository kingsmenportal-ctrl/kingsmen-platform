# Kingsmen frontend implementation — 2026-11-03

## Scope

This change integrates the uploaded static HTML/CSS prototype into the existing Next.js Kingsmen application. It does not publish a separate microsite and does not claim a production-connected platform.

## Implemented in this branch

- Refined the homepage and made the six canonical pathways exact: Higher Education, TVET, SETA programmes & learnerships, Internships, Apprenticeships and Employment.
- Added a native `/packages/` route with the canonical seven paid products, correct ZAR cent-level prices, priority application limits and separate concurrent 30-day managed-route capacity.
- Linked package selections to the candidate workbench using an allowlisted plan ID. The query value is display-only and is not authority for pricing, checkout or entitlements.
- Connected the Free Destiny Map page to the existing `FreeDestinyMapApiForm` and public intake API-boundary contract. The form checks route intent and consent, presents response failures as failures, and explicitly distinguishes API acceptance from production storage.
- Added candidate sign-in and registration screens using the configured Supabase Auth REST endpoints. Session values are stored in the same project-scoped browser storage convention expected by the existing opportunity-match UI. This is not a substitute for server-side authorisation, RLS or verified account-to-candidate identity linkage.
- Added a candidate session control with sign-out and route entry points.
- Added local document preflight: PDF/JPEG/PNG, 10 MiB maximum, and browser SHA-256 digest. The selected file bytes are not uploaded or saved by the preflight component.
- Refined the candidate dashboard, plans/finance and document views, including evidence-bound application and payment language.
- Improved opportunity-match eligibility detail and sign-in navigation.
- Updated shared site metadata.

## Canonical product contract represented

| Product | Price (ZAR) | Priority applications | Concurrent managed-route capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor's Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| CV Revamp | R49.99 | Standalone service | 0 |

Foundational Accord includes 8 accommodation routes. Accommodation support is available with paid plans. CV Revamp includes 15 CV versions and 15 motivation letters, with a target turnaround of 3 business days. Its +2 route bonus applies only after verified service ownership and an eligible upgrade. The Free Destiny Map remains separate from paid products.

## Integration and security boundaries

- Plan selection does not create an order, initiate PayFast, mark payment settled or grant entitlements.
- Paid checkout for the seven canonical plans remains gated by the existing finance contract until service terms and PayFast sandbox/ITN evidence are approved.
- The current document upload-url/read-url routes are signer shells. No file upload or persisted document record is represented as live by this UI.
- Candidate matching continues to use the existing authenticated N15 feed. No unverified opportunity rows are invented to fill empty states.
- Saved-opportunity persistence is not connected to a server-backed account store yet; the UI does not claim cross-session persistence.
- Candidate profile persistence and candidate-to-auth identity linkage require the existing backend and RLS contract to be completed and runtime-tested.
- Browser storage is used for the current Supabase Auth session convention; server-side access control and database RLS remain required.
- No credentials, private candidate records, document content, payment secrets or provider passwords are added to this branch.

## Verification status

- Source inspected: uploaded eight-file prototype and relevant existing Next.js routes, auth/client helpers, document API shells, N15 matching UI, contracts and validators.
- Pull request: feature branch proposal; not merged by these changes.
- CI evidence: focused repository tests, API build, dependency installation and Next.js web build passed on commit `81b4b06adf426fa1489c395b752810b07f88cf0c` (GitHub Actions run `41683989228`). Any later commit requires fresh CI evidence.
- Deployment: Netlify staging site identity is known, but deployment of this PR head is not confirmed. Check the PR's Netlify Deploy Preview/branch deploy against the final commit before calling it deployed.
- Runtime: public homepage, package page, Free Destiny Map form submission response, auth UI routes, document preflight and candidate navigation must be checked at the deployed URL. Auth credentials must not be recorded in logs or evidence.
- This change does not claim production readiness, verified payment settlement, private file upload, successful saved-profile persistence or provider-confirmed application outcomes.
