# Kingsmen frontend consolidation and staging-deployment audit

**Audit date:** 2026-11-03  
**Primary review stream:** [PR #317](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/317)  
**Overlapping stream:** [PR #316](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/316)

## Research scope

The uploaded `kingsmen-frontend-prototype.zip` was present in the execution workspace and was inspected. It contains these seven screens:

- `index.html`
- `packages.html`
- `candidate-dashboard.html`
- `destiny-map.html`
- `documents.html`
- `payment-confirmed.html`
- `staff-review.html`

Shared styling is in `styles.css`; shared browser interactions are in `app.js`, `flows.js` and the related scripts. The current release uses the existing Next.js application under `apps/web/src/app`, while retaining `apps/web-frontend/` as a static reference/smoke-check surface. This is not intended to become a separate temporary portal.

## Work consolidated in PR #317

- Preserves the navy/gold Kingsmen site styling and imports the prototype screen concepts into the existing Next.js routes.
- Keeps the six core pathways consistent: Higher Education, TVET, SETA programmes and learnerships, Internships, Apprenticeships, Employment.
- Preserves the canonical seven paid product prices and separate application / managed-route limits, plus the separate R0 Free Destiny Map entry.
- Adds a plan review handoff from each paid package into the candidate workbench. The selected query parameter is a display-only preference: it does not create an order, call PayFast or grant entitlements.
- Connects the Free Destiny Map form to the existing public intake API command boundary. A valid response still does not prove production persistence, contact delivery or an official provider application.
- Adds candidate sign-in and registration UI through the configured Supabase Auth REST endpoints, the existing browser auth-storage convention, and a sign-out control. These controls do not prove candidate-to-profile identity linkage or server-side authorisation.
- Adds a local document preflight for PDF/JPEG/PNG up to 10 MiB, with a SHA-256 digest computed inside the browser. File bytes are not sent by the preflight component.
- Adds the plans/finance screen with payment-evidence rules.
- Keeps the payment receipt and staff review screens labelled as previews using synthetic example data.

## Canonical product facts represented

| Product | Price | Priority applications | Concurrent managed-route capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor's Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| CV Revamp | R49.99 | Standalone | 0 |

Foundational Accord includes 8 accommodation routes. Accommodation support is available with paid plans. CV Revamp includes 15 CV versions and 15 motivation letters, with a target turnaround of 3 business days. Its conditional +2 managed-route bonus only applies after verified CV Revamp ownership and an eligible upgrade. The Free Destiny Map is separate from the seven paid products.

## Backend truth boundaries

These are not implemented by adding a frontend control, so they remain separate work:

1. **Candidate profile persistence:** authenticated create/update/reload/re-login proof and verified mapping from Supabase Auth user to the authorised Kingsmen candidate record are still required.
2. **Saved opportunities:** the candidate UI must not claim cross-session saved-item persistence until an authorised backend store is connected and tested.
3. **Document Vault:** the existing upload/read URL routes are signer shells, not live signed URLs. Private storage, server-side MIME/size enforcement, expiring signed links, malware scanning where applicable, reviewer decisions and audit persistence remain unproven.
4. **PayFast:** selecting a plan is not checkout. No entitlement may activate until a persisted order is reconciled with a verified, idempotent PayFast ITN / approved finance evidence. The receipt page is a design example, not a real receipt.
5. **Opportunity feed and submissions:** only currently verified, eligible and fresh opportunities should appear as open. Candidate-reported submission remains distinct from provider-confirmed receipt and outcome.
6. **Staff review:** the synthetic preview does not write to real candidate records. Live actions must require authenticated reviewer permission, row-level isolation, evidence and immutable audit events.

## CI findings

The earlier PR #317 head `01e4e28a8031f72004d5c8e38e7e5656969cfee3` had a successful Kingsmen CI run and a successful Jarvis Live Runtime run. The newer consolidation changes trigger fresh validation; the latest CI result must be read from PR #317 before merge. A prior successful run is not proof for a later commit.

The separate main-branch-protection evidence job returned HTTP 404 and `BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE`. It does not establish that protection is enabled or disabled. Do not bypass review or merge requirements on the strength of that failure.

## Deployment investigation

The existing Netlify project is `kingsmen-portal-staging`, site ID `fb27d0db-b116-4890-8f7f-14e654c27dbc`. The connected Netlify query reports a current site and branch-version URL but does not expose a usable deployment ID or source commit. A query against the surfaced branch URL via the deployment-detail action returned 404, and the runtime in this task cannot resolve the public Netlify host from the shell. Consequently, the exact deployed commit and working staging runtime are **not proven by this audit**.

Netlify's documented Git integration normally generates a Deploy Preview for an open pull request when the site is connected and Deploy Previews are enabled; the predictable format is `deploy-preview-317--kingsmen-portal-staging.netlify.app`. A preview URL format alone is not evidence that the deploy exists. See:
- https://docs.netlify.com/deploy/deploy-types/deploy-previews/
- https://docs.netlify.com/deploy/deploy-overview/
- https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/

The Netlify tools available to this session provide project inspection and deploy lookups, but no deploy-trigger action or deploy-list operation that can tie the current staging deployment to this exact commit. A manual CLI deployment also requires an authorised Netlify token. No production deploy, direct main-branch commit, fake deployment identifier or security bypass was used.

## Release checklist

- [ ] New CI run passes on the current PR #317 head, including focused tests, API build and Next.js build.
- [ ] Independent review is completed; overlapping PR #316 is marked superseded only after this consolidated PR is validated.
- [ ] Netlify Deploy Preview for PR #317 exists and its deploy detail confirms the current PR commit.
- [ ] Runtime checks of homepage, package links, login/register routes, Destiny Map API response, candidate dashboard, finance and document preflight are captured at that preview URL.
- [ ] Authenticated Candidate A/B isolation and reviewer-access tests are run in staging using authorised test accounts.
- [ ] Live profile/saved-item persistence, private uploads, PayFast ITN settlement and provider-specific receipt evidence are verified before these functions are represented as operational.

**Release status:** Frontend implementation consolidated for review; deployment commit and authenticated end-to-end runtime verification are pending explicit evidence.


## Verification update — 2026-11-03 17:45 UTC

The consolidated frontend branch was built and tested at commit `3687c2ca8426e55d70a291761ed81e88c6b23b6d`.

- [Kingsmen CI run 41686895818](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41686895818) **passed**. The focused repository test suite and prototype smoke checks passed; the API build and Next.js production build passed.
- [Jarvis Live Runtime run 41686895792](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41686895792) **passed**.
- [Main branch-protection evidence run 41686895894](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41686895894) **failed** with the protection endpoint returning HTTP 404. Protection configuration remains unverified.
- PR #316 is now closed as superseded without merging. PR #317 remains open and requests independent review from `ndabenhlemvelo-arch`.
- Netlify inspection after the build still returned only a branch-version/permalink-shaped URL without a source SHA or deploy ID. The connected deploy-detail operation returned 404 for that surfaced short identifier, and independent HTTP verification was blocked by the current environment's DNS/network resolution. No current-head deployment or authenticated runtime is asserted.

The latest known **build status is green; deployed status is unverified**. To finish release verification, Netlify must expose the Deploy Preview status/link or a successful deploy detail that names the exact PR #317 commit. The expected standard preview URL format is `https://deploy-preview-317--kingsmen-portal-staging.netlify.app`, but that URL remains a hypothesis until Netlify confirms the deploy is ready.
