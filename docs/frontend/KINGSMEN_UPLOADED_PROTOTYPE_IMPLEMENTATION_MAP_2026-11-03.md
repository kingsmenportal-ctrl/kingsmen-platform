# Uploaded Prototype → Kingsmen Portal implementation map

Date: 2026-11-03
Source reviewed: `kingsmen-frontend-prototype.zip` (7 HTML screens + shared CSS)

## Integration decision

Use the ZIP as a visual and journey reference, not as a replacement application. The real Netlify site builds the Next.js application under `apps/web`; standalone HTML under the repository root would not become the deployed product and would risk splitting candidate state across two frontends.

## Screen mapping

| Prototype file | Intended product route | Integration boundary |
|---|---|---|
| `index.html` | `/` | Public homepage; links into the six core pathways, Destiny Map and plans. |
| `packages.html` | `/packages/` | Canonical plan catalogue. Prices are ZAR and must match the product contract; payment selection is not payment settlement. |
| `destiny-map.html` | `/free-destiny-map/` | Free intake may call the existing public API boundary. A response from that boundary is not proof that answers were persisted or an official application submitted. |
| `candidate-dashboard.html` | `/candidate/dashboard` | Authenticated candidate workspace; all six pathways remain discoverable regardless of plan. |
| `documents.html` | `/candidate/documents` | PDF/JPEG/PNG preflight and 10 MiB per-file limit. Local hashing is not upload, private storage, verification, or reviewer approval. |
| `payment-confirmed.html` | No live-success route from the ZIP alone | A confirmation page must only display verified PayFast ITN/settlement-backed status and a matching order. A static page must never activate entitlements. |
| `staff-review.html` | Authenticated, role-authorised staff surface only | Never publish the standalone review queue as a public route. Demo controls and synthetic rows are not real review actions; decisions require server-side authorisation and audit evidence. |
| `styles.css` | Existing shared Next.js styling/tokens and responsive components | Preserve navy/gold visual identity, mobile layout, keyboard focus and reduced-motion support while using the actual app router. |

## Product invariants to preserve

- One candidate account and reusable profile; one unified application workbench across Higher Education, TVET, SETA programmes/learnerships, Internships, Apprenticeships and Employment.
- Plans affect priority application volume and managed-route capacity, not access to the six pathways.
- Opportunity discovery must not label an item open without official source, deadline, eligibility and freshness evidence.
- Candidate-reported submission, provider-confirmed receipt and provider decision/outcome remain distinct.
- A plan selection is not an order, payment, settlement or entitlement. Entitlements require verified payment handling.
- File selection/preflight is not a private upload. Private signed access, ownership checks and reviewer events must be enforced by the backend.
- No guarantee of admission, funding, placement, employment or provider outcome.

## Current integration state

The associated frontend PR integrates the reference journeys into the existing Next.js application rather than serving the standalone HTML as the product. Authentication screens call the configured Supabase Auth REST boundary. The free intake is wired to the existing public intake boundary. Document preflight computes a local SHA-256 and validates format/size, but document upload/read signer endpoints remain incomplete. Paid checkout/PayFast settlement and candidate profile persistence are not claimed complete.

## Verification and deployment status

- The latest observed Kingsmen CI run for PR #316, run `41685131453`, completed successfully at the time of review (focused repository tests, API build and Next.js web build).
- The separate branch-protection evidence run `41685131620` failed because the protection query returned HTTP 404 / protection was not visible. This does not prove that a deployment succeeded and must not be bypassed.
- Netlify site metadata identifies `kingsmen-portal-staging` (site ID `fb27d0db-b116-4890-8f7f-14e654c27dbc`) and a Next.js build based at `apps/web`. The available Netlify connector cannot trigger or enumerate deployments, and no exact published commit/deploy ID has been verified here.
- A PR Deploy Preview should be checked in Netlify/GitHub before describing this commit as deployed. A production publish requires the approved merge and the resulting Netlify deploy to be confirmed against the exact commit.

This document records the source mapping and current boundaries; it is not itself runtime or deployment evidence.


## Latest visual integration update

The responsive public homepage markup and scoped navy/gold styles from the companion preview branch have now been integrated into this product branch. The integrated candidate workbench, plan catalogue, authentication entry points, intake API boundary and document preflight remain the source of functional route behavior. This update does not turn the payment receipt or staff-review mockup into production features.

Netlify Deploy Preview entry path: `/` (requested via the pull request description). The preview must still be checked against the exact current PR head before any deployment claim.
