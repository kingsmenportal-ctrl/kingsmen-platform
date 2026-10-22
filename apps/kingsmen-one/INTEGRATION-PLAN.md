# Kingsmen One integration plan

## Existing platform evidence inspected (read-only)
The linked Supabase project `kingsmen-portal-staging` (ref `euhubhhnumtibbyufghm`) reported `ACTIVE_HEALTHY`. Its public schema already includes candidate profiles, applications, private documents/reviews, opportunity listings/saves, preparation items/events, identity-review requests/audit, candidate communications, service orders, payment events, refund requests and audit records. RLS was enabled on the listed tables during inspection. This does not prove each policy is correct or that authenticated runtime flows pass.

## Integration order
1. **Identity boundary:** use Supabase Auth for the session, then resolve the candidate only through a server-verified identity link and authorised identity-review workflow. Never link candidates solely by matching email. Supabase Auth email/password sign-in, account creation and password-reset request UI are now wired through the public publishable key. Account sessions do not unlock candidate records. Identity-link review and candidate-data access remain blocked until an authenticated, policy-backed workflow is verified.
2. **Profile:** read/write only the authenticated candidate's own profile through reviewed RLS policies. Corrections should be explicit review requests, not silent changes to authoritative fields.
3. **Pathway/opportunity catalogue:** staging is now seeded from the repository's idempotent `db/seeds/n06_route_universe_seed.sql`: 10 route categories, 7 official source-authority anchors, 2 provider anchors, 2 route-programme anchors and 2 portal-DNA records. The CAO and NSFAS anchors intentionally remain `MANUAL_CHECK_REQUIRED`; they are not open opportunities and the candidate app must not present them as currently open listings. Programme-specific deadlines, eligibility and availability require current source review. The candidate interface explicitly exposes the six required Kingsmen pathways: higher education, TVET, SETA/skills, internships, apprenticeships and employment. Entrepreneurship remains a possible adjacent service category, not a replacement for one of these six pathways.
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


## Reviewer lifecycle implementation — 2026-10-20

- Added the staging migration `20261020031028_n12_candidate_private_document_review.sql` and applied the corresponding transactional PostgreSQL function to Supabase staging. The function runs as invoker, locks the target document row, independently rechecks that the supplied authenticated user has an active, non-revoked `EVIDENCE_VERIFIER` or `PLATFORM_ADMIN` grant, enforces allowed state transitions, and writes status, review decision, and `REVIEW_STATUS_CHANGED` audit event in one transaction.
- The Edge Function now accepts `review_document` for `START_REVIEW`, `VERIFIED`, `CORRECTION_REQUIRED`, and `REJECTED`. It validates the JWT first, resolves the reviewer from `platform_reviewers` (not candidate identity or user-editable metadata), and delegates the mutation to the service-role-only RPC. Final decisions require a reviewer note and evidence reference. `CORRECTION_REQUIRED` is persisted in the decision audit metadata and mapped to the existing constrained `REJECTED` document/review status so schema constraints remain intact.
- Added smoke assertions for reviewer-role checks, revoked/inactive denial, transactional RPC use, audit persistence, and function execute grants.
- **Live tests still blocked:** no authorised test-candidate/reviewer credentials were available in the connected context, and direct outbound DNS/network from the runtime is unavailable. No fake candidate documents or reviewer identities were inserted to manufacture a pass. Must still run the real authenticated candidate-A/candidate-B matrix and reviewer decision journey with approved staging test accounts.
- **Netlify:** the connected project metadata reports the site and a branch preview URL but returns an empty `currentDeploy` object, so there is no verified deploy ID or commit SHA to inspect. Do not infer that the latest branch commit is published. Check the Netlify project deploy history or restore the connector permission/data needed to retrieve the published deploy record.
- **Branch protection:** the evidence workflow requests `administration: read`, but the connected GitHub integration cannot read the protection endpoint and returned HTTP 403. The workflow was not weakened. Rerun through a GitHub Actions identity that has repository administration-read permission; the current connected integration cannot grant itself that permission.


### Latest staging verification results

- Reviewer migration version recorded by Supabase staging: `20261020031028`; repository migration filename aligned to that exact version.
- SQL verification confirms the reviewer RPC is `SECURITY INVOKER`, callable by `service_role` only, and not executable by `anon` or `authenticated`. A database negative test confirmed an unknown reviewer identity is denied before document lookup.
- Staging currently has **zero** verified candidate identity links, **zero** active evidence-reviewer accounts, **zero** private document records and **zero** private document events. Therefore the requested two-account authenticated journey cannot be run against existing staging fixtures; no synthetic account or document data was inserted.
- Latest verified commit before this evidence refresh: `17f2353452ef5e207bb9efbd3eee12e332e7734b`; smoke tests, Source Guard and Release Evidence passed there. This filename correction will trigger a new CI run.
- Branch-protection evidence run `39363092200` now executes and produces an artifact, confirming the workflow syntax is fixed. Its report is `UNVERIFIED_PERMISSION_DENIED`, HTTP 403, because `BRANCH_PROTECTION_READ_TOKEN` is not configured and the fallback Actions token has only Contents: read and Metadata: read. The workflow now emits this explicit warning rather than bypassing the check.
- Netlify still returns `currentDeploy: {}` with no deploy ID/commit SHA, and request-log results are empty. The connected tool does not expose deploy history/listing, and this runtime's browser/network path cannot open the staging URL. The exact deployed commit and rendered build remain unverified.

## Reviewer console UI (2026-10-20)
- Added a Reviewer console navigation view in Kingsmen One, wired to the authenticated `list_review_queue`, `create_reviewer_download_url`, and `review_document` actions.
- Each queue item shows document metadata and offers a 60-second audited download plus a decision form. Final decisions require reviewer notes and evidence references. Decision selection is explicit; no decision is preselected.
- Queue state is scoped to the authenticated user and cleared when the account changes. API permission checks remain authoritative; showing the UI does not grant reviewer access.
- Added smoke coverage for UI wiring and reviewer endpoints. Actual reviewer/candidate journey remains unverified until authorised staging identities and fixture documents exist.


## Identity-review submission route reconciliation — 2026-10-22
- Candidate account UI calls the JWT-verified `candidate-identity-review-request` Edge Function; the browser never calls the privileged submission RPC directly.
- The function validates the Supabase bearer token with Auth, derives the account ID from that validated session, bounds request fields, and calls a service-role-only transactional RPC. Duplicate open requests return HTTP 409 with a stable `IDENTITY_REVIEW_ALREADY_OPEN` code.
- The client now marks the reviewer message as required (minimum 3 characters, matching server/database validation), parses structured Edge Function error responses, gives a specific duplicate-request instruction, and guards against displaying an in-flight response after the active account changes.
- The three applied staging migration sources and deployed Edge Function source are reconciled in this branch: identity-link ledger privilege hardening, server-side transactional submission, and audit-schema compatibility.
- Static regression tests cover endpoint invocation, server JWT validation, privileged RPC use, duplicate error handling and client/server field agreement.
- Live staging duplicate rejection and privilege checks passed on 2026-10-22 in the related identity-review staging batch. GitHub Release Evidence and Source Guard passed on commit `a1fde77489b3eab62ccb65c0f4fcaaaaac8b7440` in the identity-review endpoint branch.
- **Still not proven end-to-end:** no live authenticated HTTP submission was run with a real candidate session; staging has zero active reviewers, so the reviewer decision lifecycle remains blocked. Netlify's current project metadata does not provide a verifiable published deploy ID/commit for these changes. No reviewer was fabricated and no production deploy is claimed.


## Production release gates — current status checked 2026-10-22

This checklist deliberately distinguishes source correctness from a production release. Do not mark Kingsmen One production-ready until every required gate has recorded evidence tied to the exact commit and published deploy.

| Gate | Required evidence | Current disposition |
|---|---|---|
| Canonical pathways | Automated test asserts exact ordered IDs: higher education, TVET, SETA/skills, internships, apprenticeships, employment | Source updated; CI for latest head must be confirmed |
| Source and regression checks | Smoke tests, Source Guard and Release Evidence succeed on the exact proposed release commit | Earlier head passed; latest head pending fresh run evidence |
| Identity boundary | Live authenticated request, invalid-token rejection, duplicate-open-request rejection, and no cross-account disclosure | DB/RPC probes passed; authenticated HTTP proof still outstanding |
| Reviewer workflow | Real authorised reviewer performs approve/correction/reject; each decision and audit row verified | Blocked: staging has zero active reviewers; do not fabricate or self-authorise a reviewer |
| Candidate journey | Two authorised test accounts, candidate-owned tracker/document, signed private download, cross-account denial, reviewer outcome | Not end-to-end verified; requires authorised fixtures and reviewer |
| Database security | RLS/policy and grants reviewed; backend-only tables inaccessible to client roles; security advisor findings triaged | Privilege probes passed for identity RPCs; three backend-only RLS/no-policy INFO findings and leaked-password-protection WARN remain to triage/configure |
| Published frontend | Netlify deploy state is ready and published commit SHA equals approved release commit; render and smoke-test live URL | Blocked: Netlify connector reports no verifiable published deploy ID/commit |
| Release approval | Required PR reviews and repository branch protection pass; no bypass | PR remains open; merge/deploy not claimed |

### Release rule
A green source test is not a live integration proof. A staging migration is not a production deploy. A successful Netlify build is not proof of the published commit. Keep each gate open until its own evidence is available. Never use real candidate data as test fixtures without authorisation and consent.

## Cross-module live staging evidence refresh — 2026-10-22 22:40 SAST

This refresh records only probes actually executed against the connected Supabase staging project. It does not upgrade source-only checks into end-to-end proof.

| Area | Observed staging evidence | Result / still open |
|---|---|---|
| N03 Truth Vault | Inserted a uniquely prefixed synthetic idempotency row and audit event; read both back in a separate SQL call; attempted the same unique keys again; both duplicate inserts were blocked; removed both probe rows and verified cleanup counts. | **DB persistence/readback + unique-key duplicate guard passed.** This did not restart the API process and does not prove API transaction atomicity, worker restart recovery, or backup restore. |
| N04 identity | Three Auth users currently exist; identity request/audit/link tables contain zero rows. Identity submission Edge Function is ACTIVE v3 with JWT verification enabled. | Privileged RPC/grant probes from the earlier identity batch passed; real authenticated candidate submissions, two-candidate isolation, and reviewer decisions remain unproven. No test identities or reviewer roles were invented. |
| N05 Document Vault | Two storage buckets are private and capped at 10 MiB. 'kingsmen-candidate-documents' permits PDF/JPEG/PNG and its object policies use the verified-candidate resolver. The legacy 'candidate-documents' bucket separately permits PDF/DOCX/plain text and scopes object paths to Auth UID. Document/event/review tables currently have zero rows. | Configuration and policy shape observed. Real upload bytes, MIME/signature mismatch rejection, size rejection, signed URL access/expiry, and cross-candidate denial were not exercised. Treat legacy and verified-candidate buckets as separate paths; do not claim a full document E2E pass. |
| N06/N15 opportunities | Staging has 21 source authority anchors, including 14 added official South African source anchors. All 21 require programme-level verification. There are 2 programme anchors and 0 recently verified OPEN/FUTURE opportunities. | Source discovery expanded; no invented open programmes, deadlines, or outcomes. Programme-level crawl/verification and official-source freshness remain open. |
| Applications/outcomes | Tracker, tracker-event, and submission-job tables currently contain zero rows. | Canonical pathway mapping source and regression tests are in the branch. Real preparation → evidence → submission state → provider-confirmed outcome lifecycle remains unproven. |
| N09 communications | Applied migration '20261022202953_n09_communications_backend_only'. Queried actual grants and RLS policies: all checked communications/consent tables have no 'anon' or 'authenticated' table grants; service role grants exist; policies target 'service_role'. | Backend-only database boundary verified. No provider send was performed; consent-based dispatch, email delivery, retries/backoff, bounce evidence, dead-letter recovery and real provider receipts remain unproven. |
| N12/N13/N16 operations | Repository Release Evidence workflow includes health endpoints and readiness checks; exact-head smoke, Source Guard and Release Evidence all succeeded at commit '3954b615e83b5e2061fccf460013d11fb24c1270'. | Source/CI gate green. Live monitoring/pager, worker kill/restart recovery, queue redrive, and incident escalation have not been exercised against a running worker. |
| N17/N18/N19 and deployment | Netlify project metadata still reports an empty 'currentDeploy' object; no published deploy ID/commit is available from the connected project response. | Founder/public/mobile journeys cannot be certified from source/UI alone. Published commit equality and live browser workflow remain release blockers. |

### Exact-head automated checks

- Kingsmen One smoke tests: success, run https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39849762807
- Kingsmen Source Guard: success, run https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39849762828
- Kingsmen Release Evidence: success, run https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39849762760

### Non-negotiable remaining release gates

1. Run the authenticated staging E2E plan with authorised candidate A/B and reviewer sessions; verify 401/403 denials and candidate isolation.
2. Upload controlled synthetic document bytes through the deployed authenticated endpoint; assert MIME/signature/size checks, signed access and expiry, then prove cross-candidate denial and clean fixtures.
3. Run API PostgreSQL integration with restart: persist a command and audit evidence, restart the API process, replay the same idempotency key, and prove one logical command and unchanged response.
4. Exercise notification consent/policy gate, real provider staging delivery evidence, retry/backoff, terminal dead-letter and recovery with non-user test recipients.
5. Execute worker interruption/restart, health failure, incident create/triage/resolve and restore drills with redacted evidence.
6. Verify Netlify deploy ID, published commit SHA, HTTPS rendered route and live smoke tests; merge only through repository-required reviews/protections.

Do not mark these gates complete until their respective runtime evidence is attached. No real candidate data or external provider send was used for the probes above.
