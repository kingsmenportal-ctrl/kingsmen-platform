# Kingsmen One integration plan

## Existing platform evidence inspected (read-only)
The linked Supabase project `kingsmen-portal-staging` (ref `euhubhhnumtibbyufghm`) reported `ACTIVE_HEALTHY`. Its public schema already includes candidate profiles, applications, private documents/reviews, opportunity listings/saves, preparation items/events, identity-review requests/audit, candidate communications, service orders, payment events, refund requests and audit records. RLS was enabled on the listed tables during inspection. This does not prove each policy is correct or that authenticated runtime flows pass.

## Integration order
1. **Identity boundary:** use Supabase Auth for the session, then resolve the candidate only through a server-verified identity link and authorised identity-review workflow. Never link candidates solely by matching email. Supabase Auth email/password sign-in, account creation and password-reset request UI are now wired through the public publishable key. Account sessions do not unlock candidate records. Identity-link review and candidate-data access remain blocked until an authenticated, policy-backed workflow is verified.
2. **Profile:** read/write only the authenticated candidate's own profile through reviewed RLS policies. Corrections should be explicit review requests, not silent changes to authoritative fields.
3. **Pathway/opportunity catalogue:** use authoritative provider/source records, source confidence and verification status. The staging `route_categories` query returned no rows, so Kingsmen One must not infer the canonical sixth pathway or advertise sample records as live.
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
- Candidate profile/preparation controls remain browser-local demo state until an identity-link workflow and owner-scoped persistence are implemented and tested.
- The current staging database has no RLS policies on candidate_identity_review_requests in the inspected policy catalogue; Kingsmen One must not submit identity claims directly to that table until the correct policy or server-side RPC is designed, reviewed and tested.
