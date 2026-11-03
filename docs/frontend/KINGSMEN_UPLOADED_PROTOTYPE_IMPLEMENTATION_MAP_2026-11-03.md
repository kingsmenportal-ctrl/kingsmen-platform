# Uploaded Prototype → Kingsmen Portal implementation map

**Date:** 2026-11-03  
**Reference:** `kingsmen-frontend-prototype.zip` (seven HTML screens plus shared CSS)  
**Application:** existing Next.js app at `apps/web`, not a second microsite.

## Screen mapping

| Prototype reference | Kingsmen route | Current implementation and boundary |
|---|---|---|
| `index.html` | `/` | Responsive navy/gold homepage and six pathway links. |
| `packages.html` | `/packages/` | Canonical seven paid products plus the separate free Destiny Map. Paid products expose guarded PayFast sandbox checkout; sandbox is not production charging. |
| `destiny-map.html` | `/free-destiny-map/` | Consent-checked intake uses the existing public API command boundary. An intake response does not prove production persistence or an official provider application. |
| `candidate-dashboard.html` | `/candidate/dashboard/` | Candidate navigation for six pathways and connected workspace routes. Authenticated identity still gates candidate-private services. |
| `documents.html` | `/candidate/documents/` | PDF/JPEG/PNG preflight, local SHA-256, signed private upload, server finalisation and server-recorded document status; all require an authenticated session and a reviewer-verified candidate identity. |
| `payment-confirmed.html` | `/payment/return/` and `/preview/payment-confirmed/` | Return page only tells the candidate that status is being verified. The preview receipt is explicitly synthetic. Neither grants entitlements. |
| `staff-review.html` | `/preview/staff-review/` | Synthetic visual example only. It is not a live reviewer queue or decision surface. |
| `styles.css` | `apps/web/src/app/public-home.css` and route components | Preserve responsive behavior, keyboard focus states and navy/gold styling inside the real app router. |

## Core product contract

- One reusable candidate profile and one application workbench cover Higher Education, TVET, SETA programmes and learnerships, Internships, Apprenticeships, and Employment.
- Paid plans control priority application allowance and concurrent managed-route capacity, not access to pathway discovery.
- Canonical ZAR prices/capacities: Foundational Accord R169.99 (5/4; 8 accommodation routes); Collegiate Ordinance R299.99 (10/8); Chancellor’s Writ R399.99 (15/10); Regency Mandate R469.99 (15/12); Artisan Charter R149.99 (5/3); Guildmasters Charter R199.99 (8/5); CV Revamp R49.99 (standalone, 0 routes, 15 CV versions and 15 motivation letters target 3 business days). CV Revamp’s +2 route bonus requires verified ownership and an eligible upgrade. Free Destiny Map is separate.
- An opportunity is not called open without current authority/source, deadline, eligibility and freshness evidence.
- Candidate-reported progress, provider-confirmed receipt and outcome remain different states.
- Browser return is not payment proof; a verified, idempotent PayFast ITN is the payment authority.

## Service integration state

- Candidate sign-in, registration and callback use the configured Supabase Auth REST endpoints.
- Candidate profile uses the active `candidate-master-profile` Edge Function; candidate preferences, consent, correction requests and profile status are not inferred from browser state.
- Opportunity matching is source/eligibility-gated. Saving a verified opportunity calls `candidate-save-verified-opportunity`; saved records are identity-gated and read from the RLS-protected table.
- The application workbench calls `candidate-application-preparation` for saved targets, parent applications and preparation trackers. Preparing a parent application does not submit it to a provider.
- The Document Vault requests signed upload capabilities from `candidate-private-documents`, uploads only after explicit user action, finalises server-side size/content/hash checks, and requests temporary private read links. A local preflight alone is not a document receipt.
- The PayFast checkout component calls `payfast-sandbox`, uses an idempotency key, checks the returned destination is exactly the approved PayFast sandbox process endpoint and restricts launch to the primary staging origin / permitted staging preview hosts. No production checkout is enabled. Orders/entitlements remain settlement-evidence dependent.

## Release proof still required

A green source CI build is not a deployment. The latest staging publish remains blocked because repository Actions secret `NETLIFY_AUTH_TOKEN` is empty. No deploy command ran, so no deployment URL/ID or exact deployed SHA is available. After an authorised repository administrator configures that secret, the draft-only workflow can build and publish a non-production preview, then smoke-test the public routes.

Authenticated runtime evidence is still required for candidate A/B isolation, profile save/reload/re-login, saved-opportunity persistence, private upload/download and review isolation, checkout/ITN idempotency, and provider-specific receipt. No admission, employment, funding, or provider outcome is guaranteed.
