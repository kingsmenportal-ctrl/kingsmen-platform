# Uploaded Prototype → Kingsmen Portal implementation map

Date: 2026-11-03
Source reviewed: `kingsmen-frontend-prototype.zip` (7 HTML screens + shared CSS)
Product branch: `feat/kingsmen-frontend-product-slice-2026-11-03`
Review pull request: [#316](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/316)

## Integration decision

The uploaded ZIP is a visual and journey reference, not a replacement application. Kingsmen remains the existing Next.js application under `apps/web`, backed by the existing Supabase project and Netlify staging site. The standalone static HTML screens are not published as a second frontend.

## Screen mapping

| Prototype file | Kingsmen route | Implementation boundary |
|---|---|---|
| `index.html` | `/` | Responsive navy/gold public homepage and six pathway navigation. |
| `packages.html` | `/packages/` | Seven paid products, exact ZAR-cent plan codes, priorities and concurrent 30-day managed-route capacity; sandbox checkout is explicit. |
| `destiny-map.html` | `/free-destiny-map/` | Consent-gated intake API boundary. Public intake does not claim that a candidate profile or official provider application was saved. |
| `candidate-dashboard.html` | `/candidate/dashboard` | Candidate overview, six pathways, reusable profile, workbench, verified matches, saved opportunities, documents, tracker and finance navigation. |
| `documents.html` | `/candidate/documents` | Authenticated private storage upload, server-side finalisation, candidate-reported receipt, audited private reads and human-review state. |
| `payment-confirmed.html` | `/payment/return` | Safe return page. A browser redirect is not payment proof and cannot activate entitlements. |
| Payment cancellation state | `/payment/cancel` | Safe cancellation page; it does not mark payment paid or change order state. |
| `staff-review.html` | Not published as a public candidate route | Staff/reviewer decisions remain authenticated, role-authorised backend operations. Synthetic demo controls are not treated as operational actions. |
| `styles.css` | `apps/web/src/app/public-home.css` and route components | Scoped responsive styles, navy/gold identity, keyboard focus and reduced-motion behavior. |

## Integrated candidate journeys

- **Identity and profile:** Supabase Auth sign-in/registration plus an auth callback; reusable profile editing, explicit processing/contact consent, consent revocation and correction requests. New Auth accounts are not automatically linked to an existing candidate by email equality. Identity linking may remain pending until authorised review.
- **Six-pathway discovery:** Higher Education, TVET, SETA programmes/learnerships, Internships, Apprenticeships and Employment remain discoverable across all plans. Current opportunity publication is still constrained by official-source, eligibility, deadline and freshness evidence.
- **Save and prepare:** A verified match can be saved through the candidate-save-verified-opportunity Edge Function. The backend prepares a parent application draft and saved-opportunity record. This is not provider submission or provider receipt.
- **Document Vault:** PDF/JPEG/PNG only, maximum 10 MiB. The authenticated candidate obtains a short-lived upload capability, uploads to the private bucket, and calls server finalisation. The backend re-reads and validates the file signature/type/size and SHA-256 before recording `UPLOADED_CANDIDATE_REPORTED`. Audited signed-read links expire after 60 seconds. Candidate upload is not human verification.
- **Plans and payment:** Seven paid plan codes are wired to the finance catalogue. Checkout calls the PayFast sandbox endpoint with an idempotency key and only accepts the approved HTTPS sandbox checkout host. The Edge Function requires a confirmed email and exactly one verified candidate identity link. The browser return/cancel pages do not settle an order. Entitlements depend on the server accepting a verified PayFast ITN.
- **Public intake:** Free Destiny Map sends a minimum, consent-bound request to the existing intake API. Do not describe this as persistent candidate-profile creation or official provider application submission.

## Deployed backend dependencies inspected

Supabase staging project: `euhubhhnumtibbyufghm`.

The following active Edge Functions were inspected in staging and their UI request/response contracts were matched:

| Function | Observed version | Purpose |
|---|---:|---|
| `candidate-master-profile` | 3 | Identity gate, reusable profile, consent and correction requests |
| `candidate-save-verified-opportunity` | 3 | Verified opportunity save and parent application draft preparation |
| `n15-candidate-opportunities` | 2 | Candidate-specific verified opportunity feed |
| `candidate-private-documents` | 16 | Candidate-owned private upload/list/finalise/read workflow |
| `candidate-application-preparation` | 16 | Application preparation boundary |
| `payfast-sandbox` | 9 | Sandbox checkout intent and verified ITN handling |

The PayFast v9 deployment changed only the CORS allow-list: the configured staging origin and this Netlify site's preview subdomains are accepted. The function's existing manual Supabase user validation, confirmed-email/candidate-identity requirements, signed checkout fields and ITN verification/settlement logic were retained. Its `verify_jwt=false` setting pre-existed because the function validates the bearer token itself; no secret is sent to the browser.

## Product invariants

- One candidate account and reusable profile; one unified application workbench across all six pathways.
- Plans control priority application volume and managed-route capacity, not pathway discovery.
- A directory/source anchor is not an open opportunity without source, deadline, eligibility and freshness evidence.
- Candidate-reported submission, provider-confirmed receipt and provider decision/outcome are different events.
- A package selection or browser return is not an order settlement or entitlement.
- Candidate documents remain private; candidates cannot approve, reject or delete their own evidence records.
- Jarvis/AI support does not autonomously approve identity, documents, applications, provider outcomes or payments.
- No admission, funding, placement, employment or provider outcome is guaranteed.

## Validation and deployment evidence

- **Latest successful code CI:** [run 41691385004](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41691385004), commit `262fb790ed2927b4d7925c43995cdbf0a50feb9a`. The `test-and-build` job completed focused repository tests, API build and the Next.js production build successfully.
- **Branch protection evidence:** [run 41691384976](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41691384976) failed at the read-only GitHub protection query with HTTP 404 and status `BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE`. This is a visibility/verification failure, not proof that branch protection is absent. No protection bypass was performed.
- **Netlify target:** `kingsmen-portal-staging`, site ID `fb27d0db-b116-4890-8f7f-14e654c27dbc`; configured build base `apps/web`, command `npm run build`, publish `.next`.
- **Deploy Preview:** Netlify's documented PR preview URL pattern for PR #316 is `https://deploy-preview-316--kingsmen-portal-staging.netlify.app`. The PR description requests the root entry path using `@netlify /`. The connected Netlify API returned a changing branch-version hostname but did not expose a deploy ID/details for the current commit. The exact published SHA, deploy result and runtime page were therefore **not verified** in this session.
- **Release boundary:** PR #316 remains open and unmerged. No direct `main` commit, production deployment, live payment or entitlement activation was performed. Authenticated Candidate A/B runtime isolation and a full browser upload/checkout/ITN test remain separate runtime verification tasks.

This document is an implementation map and evidence summary. It does not substitute for a successful staging Deploy Preview tied to the exact PR head or authenticated end-to-end browser verification.
