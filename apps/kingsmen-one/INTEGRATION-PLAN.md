# Kingsmen One integration plan

## Existing platform evidence inspected (read-only)
The linked Supabase project `kingsmen-portal-staging` (ref `euhubhhnumtibbyufghm`) reported `ACTIVE_HEALTHY`. Its public schema already includes candidate profiles, applications, private documents/reviews, opportunity listings/saves, preparation items/events, identity-review requests/audit, candidate communications, service orders, payment events, refund requests and audit records. RLS was enabled on the listed tables during inspection. This does not prove each policy is correct or that authenticated runtime flows pass.

## Integration order
1. **Identity boundary:** use Supabase Auth for the session, then resolve the candidate only through a server-verified identity link and authorised identity-review workflow. Never link candidates solely by matching email. Supabase Auth email/password sign-in, account creation and password-reset request UI are now wired through the public publishable key. Account sessions do not unlock candidate records. Identity-link review and candidate-data access remain blocked until an authenticated, policy-backed workflow is verified.
2. **Profile:** read/write only the authenticated candidate's own profile through reviewed RLS policies. Corrections should be explicit review requests, not silent changes to authoritative fields.
3. **Pathway/opportunity catalogue:** staging is now seeded from the repository's idempotent `db/seeds/n06_route_universe_seed.sql`: 10 route categories, 7 official source-authority anchors, 2 provider anchors, 2 route-programme anchors and 2 portal-DNA records. The CAO and NSFAS anchors intentionally remain `MANUAL_CHECK_REQUIRED`; they are not open opportunities and the candidate app must not present them as currently open listings. Programme-specific deadlines, eligibility and availability require current source review. The canonical sixth pathway remains unconfirmed and must not be inferred.
4. **Preparation:** map candidate checklist actions to `candidate_application_preparation_items` and append-only events, with idempotency and ownership checks. Candidate-reported progress remains separate from reviewer evidence.
5. **Documents:** private Supabase Storage only; metadata in the private-document tables; server-issued signed access; reviewer verification must be explicit and auditable. Never expose file bytes publicly.
6. **Applications:** use the application tracker and append-only event/evidence tables. Prepared, authorised, submitted, received and accepted are distinct states. Do not infer a provider submission from a local click.
7. **Outcomes:** preserve candidate-reported outcomes separately from provider evidence and reviewer-confirmed decisions; support correction requests.
8. **Communications:** write to the governed outbox and record provider delivery evidence. SENT is not DELIVERED; DELIVERED is not ACKNOWLEDGED.
9. **Payments and entitlements:** only verified server-side payment events can drive order settlement; entitlement activation requires a separate explicit fulfilment decision. An order existing is not proof of payment or entitlement.
10. **Operations:** reviewer roles are provisioned by authorised operators; never self-enrol reviewers. Audit privileged actions and enforce server-side permissions.

## Deployment gates
- Create and review dedicated Kingsmen One migrations; do not apply migrations to the existing staging database from this branch.
- Verify RLS with authenticated candidate A, candidate B, reviewer and unauthenticated sessions.
- Add integration tests for cross-candidate isolation, private document access, correction-request authorization, application transitions, payment webhook idempotency and entitlement activation.
- Configure secrets only in platform secret stores. No service-role key may appear in client code, source control, build logs or preview URLs.
- Connect Netlify to the intended repository/branch and verify the actual deploy commit, build log and public route before reporting deployment complete.
- Connect Replit through its GitHub UI only after a Replit app is available. The current Replit create-app request failed with `requires_active_subscription`; no app was returned.


## New account capability (implemented in Kingsmen One branch)
- Browser uses the Supabase publishable key only; no service-role credential is shipped to the client.
- Email/password sign-in, account creation and password-reset request use Supabase Auth.
- Auth session changes update the account view and sign-out action.
- Signing in does not match an existing candidate by email and does not unlock or write candidate data.
- Candidate profile fields remain browser-local demo state; preparation task completion and priority pathway now persist through `candidate-workspace-readiness` only after a server-verified `VERIFIED` identity link. The full authenticated browser journey remains unverified.
- The current staging database has no RLS policies on candidate_identity_review_requests in the inspected policy catalogue; Kingsmen One must not submit identity claims directly to that table until the correct policy or server-side RPC is designed, reviewed and tested.


## Verified candidate readiness persistence (implemented)
- Added and deployed Supabase Edge Function `candidate-workspace-readiness` with JWT verification enabled.
- The function validates the caller token using Supabase Auth, resolves the candidate only from a `VERIFIED` identity link with `verified_at`, and reads/writes only that candidate's existing `candidate_workspace_readiness` row.
- Accepted task IDs and pathway IDs are allowlisted server-side; browser-supplied candidate IDs are not accepted.
- Accounts without a verified identity link remain in local preview mode. This batch does not persist profile edits or enable private document uploads.
- Static source-contract test added; CI and authenticated browser E2E must still be inspected before claiming end-to-end verification.


## Persistent application tracker and preparation checklist (implemented; E2E pending)
- Deployed `candidate-application-preparation` with JWT verification on.
- Reads/writes are scoped to a candidate resolved server-side from a verified identity link, never a browser-supplied candidate ID.
- Tracker creation requires a saved `candidate_saved_routes` record owned by the authenticated user and a still-verified catalogue entry with HTTPS source; data is synchronised to `candidate_workspace_saved_opportunities` and `candidate_application_tracker`.
- New trackers receive four default checklist items. Additional task/document items, notes, candidate-reported readiness and evidence-reference strings are supported with field bounds.
- Candidate-reported submission remains separate from independently confirmed provider submission. No provider status or outcome is written by this feature.
- Automated source-contract test added. Still required: authenticated staging browser tests (verified and unverified identities, cross-candidate denial, duplicate tracker, checklist mutations), frontend deploy and runtime/log verification.


## Staging route-universe seed evidence (2026-10-19)
- Applied the existing idempotent `db/seeds/n06_route_universe_seed.sql` after confirming the target tables and constraints existed and the seed's target rows were empty.
- Post-write counts: `route_categories` 10; `source_authorities` 7; `route_providers` 2; `route_programmes` 2; `portal_dna` 2.
- Both programme anchors use official HTTPS source URLs, confidence A and verified provider/source anchors, but remain `MANUAL_CHECK_REQUIRED`. Eligible open/future opportunity count is still zero by design until current programme-specific availability is verified.
- No candidate identities, candidate applications, private documents, payments, or entitlements were created or changed by this seed.

## Candidate profile correction history (2026-10-20)
- The candidate profile screen now renders the latest correction requests returned by the authenticated profile-review endpoint, including field, requested value, candidate-provided reason, request date and current status.
- All database-backed display values are HTML-escaped before rendering. Empty history has an explicit state.
- This is status visibility only: candidate requests do not mutate authoritative profile fields, and a request status is not represented as approval unless the stored review status says so.
- The new smoke test checks that history rendering is connected to the server-returned request list, escapes user/database text, and preserves the read-only authoritative-profile boundary.
- The updated smoke workflow passed on commit `6e268d4be8a95eb6a400ec75e454b885f86654b6`; source-guard and release-evidence runs were still in progress at the time of the change.

## Private document lifecycle — staging function deployed; UI and static checks connected (2026-10-20)
- Deployed `candidate-private-documents` to Supabase staging with JWT verification enabled; staging function reports ACTIVE, version 4.
- The function requires a valid Supabase Auth token and resolves the candidate only from `candidate_auth_identity_links` where `link_status=VERIFIED` and `verified_at` is present. Caller-supplied candidate IDs are never used for scoping.
- Candidate document metadata is listed by resolved candidate; uploads are limited to PDF/JPEG/PNG and 10 MiB; storage is private; signed upload tickets are short-lived; finalization downloads and inspects the stored bytes, checks actual size and MIME signature, computes SHA-256, and downloads use 60-second signed URLs.
- CORS permits the staging site and only HTTPS deploy-preview hostnames belonging to `kingsmen-portal-staging.netlify.app`; it does not wildcard arbitrary Netlify sites. The staging preview origin is therefore not tied to a single stale deploy hash.
- Uploads remain `UPLOADED_CANDIDATE_REPORTED`; this is not independent reviewer verification. The endpoint validates optional checklist-item ownership before linking. Invalid file signatures or sizes are rejected, the object is removed when possible, and an `UPLOAD_FAILED` event is appended.
- Runtime schema inspection confirmed the document table's size/MIME/status/path constraints and the event table's allowed event types. The endpoint uses allowed `UPLOAD_CONFIRMED` and now records `READ_LINK_ISSUED` before returning a download link; audit failure prevents the link from being returned.
- The Kingsmen One document screen is connected to the endpoint for listing, uploading, finalization and downloading. It loads real application-preparation data and presents a dropdown of the candidate's own `DOCUMENT` checklist items rather than requiring a raw UUID.
- GitHub smoke tests passed on commit `0845f936aafdc056c152fe3451b96f470c810ee0`. Additional tests now cover download auditing, checklist linking, file-signature rejection and SHA-256 persistence; those latest CI runs are pending. Source Guard and Release Evidence must be green on the final head before the batch can be marked fully tested. Branch-protection evidence workflow remains failing and must not be bypassed.
- **Not yet end-to-end verified or deployed as a frontend release.** Supabase logs showed no matching runtime requests at the time checked. Still required: invoke the live function with unauthenticated and authenticated sessions; complete a real test upload/download; prove candidate A cannot access candidate B's records or objects; verify reviewer status changes; inspect actual Netlify deploy commit/build; and resolve the branch-protection evidence failure. No production release or database migration was performed by this batch.
