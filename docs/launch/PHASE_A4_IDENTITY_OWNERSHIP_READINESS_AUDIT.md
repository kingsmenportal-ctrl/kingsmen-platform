# Phase A.4 — Server-side identity and ownership readiness audit

**Decision: BLOCKED — do not re-enable candidate data APIs.**  
**Audit date:** 2026-10-16  
**Branch:** `feat/phase-a1-public-destiny-auth-foundation`  
**Scope:** Source-level audit and implementation prerequisites only. No migrations or live data access performed.

## Executive finding

The branch now contains a server-side Supabase Auth REST integration scaffold: password login, registration, recovery, refresh, logout, HttpOnly cookie storage, and a server-verified session endpoint. The candidate login/registration/recovery UI is connected to these routes. This is **implemented in source but not yet verified operational**: staging environment variables and provider URL/redirect/email configuration have not been confirmed, and no live sign-in/build/test run is evidenced. Candidate profile/onboarding data remains browser-local draft data. The legacy application-tracker endpoint and the four document/founder endpoints remain deliberately fail-closed. No candidate data route was enabled merely because authentication routes now exist.

This is a source audit of paths fetched on the named branch, not proof that no auth implementation exists anywhere in every branch or deployment. GitHub code search is default-branch scoped, so it was not treated as proof about this feature branch. Paths that returned 404 at the exact branch ref are listed as absent from that ref at audit time.

## Source inventory

| Capability | Evidence inspected | Finding | Status |
|---|---|---|---|
| Web identity-provider SDK | `apps/web/package.json`; `apps/web/src/lib/auth/supabase-rest.ts` | No SDK dependency is required by the new source: it calls Supabase Auth REST endpoints using native fetch. This reduces package changes but means cookie/session behaviour needs actual integration testing. | **REST integration scaffold implemented; runtime unverified** |
| API authentication runtime | `apps/api/package.json` | Runtime dependency is `pg`; no JWT/JWKS verifier, identity SDK, cookie/session store, or auth framework is declared. | **Missing in declared API dependencies** |
| Web server middleware | `apps/web/src/middleware.ts` at this ref | GitHub contents API returned 404. Session validation is exposed as a server route/helper, but protected-page middleware is not present. | **Not present; protected-page routing not implemented** |
| Server-side Supabase helper | `apps/web/src/lib/supabase/server.ts` at this ref | GitHub contents API returned 404. | **Not present at inspected path/ref** |
| Web login/session APIs | `apps/web/src/app/api/auth/{login,register,recovery,refresh,logout,session}/route.ts` | Added native-fetch Supabase Auth REST handlers. Access and refresh tokens are set as HttpOnly, SameSite=Lax cookies; session route asks Supabase Auth to validate the access token. | **Implemented in source; environment and runtime verification pending** |
| Separate API auth service | `apps/api/src/routes/auth.routes.ts`, `apps/api/src/auth/magic-link.service.ts` at this ref | GitHub contents API returned 404. Web auth is implemented in Next route handlers; the separate API service has no verified auth integration. | **Not present in API; web auth is separate** |
| API candidate profile route/service | `apps/api/src/routes/candidate.routes.ts`, `apps/api/src/candidate/candidate-profile.service.ts` at this ref | GitHub contents API returned 404. | **Not present at inspected paths/ref** |
| Candidate login/registration/recovery | `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/auth/passwordless/page.tsx` | UI now calls the server-side auth routes. Provider configuration, email confirmation, redirects and runtime behaviour are not yet verified. | **Connected in source; runtime unverified** |
| Candidate profile/onboarding | `apps/web/src/app/candidate/profile/page.tsx`, `apps/web/src/app/candidate/onboarding/page.tsx` | LocalStorage draft only; no verified server owner or authoritative profile. | **Browser-local only** |
| Application tracker API | `apps/web/src/app/api/personal-jobs/application-tracker/route.ts` | GET/POST intentionally return 503 `CANDIDATE_AUTHORIZATION_NOT_CONFIGURED`; no shared-file read/write. | **Fail-closed mitigation** |
| Candidate document upload URL | `apps/web/src/app/api/candidate/documents/upload-url/route.ts` | POST intentionally returns 503; no signer or fake signed URL. | **Fail-closed mitigation** |
| Candidate document read URL | `apps/web/src/app/api/candidate/documents/read-url/route.ts` | POST intentionally returns 503; no ownership-derived signing. | **Fail-closed mitigation** |
| Candidate document status | `apps/web/src/app/api/candidate/documents/status/route.ts` | GET intentionally returns 503; no unscoped status. | **Fail-closed mitigation** |
| Founder document review | `apps/web/src/app/api/founder/documents/review/route.ts` | POST intentionally returns 503; caller-supplied proof IDs are not accepted as authority. | **Fail-closed mitigation** |
| Private object storage | Web dependencies and inspected document routes | No configured private bucket, storage client, object policy, real signer or verified upload/read flow evidenced by this audit. | **Not integrated / blocked** |
| Candidate A/B tests | `e2e/candidate-security.spec.ts`; `e2e/kingsmen-auth-boundary.spec.ts` | Synthetic negative requests cover fail-closed candidate endpoints plus malformed login, password policy, no-cookie session/refresh and logout contracts. They do not log in as real provider-backed synthetic accounts or prove authenticated row-level isolation. | **Tests authored; execution pending; auth isolation not tested** |

## Security contract for the replacement

Any future candidate data handler must follow this order:

1. Validate the session/token on the server using the approved identity provider's supported verification method. Never infer identity from a request body, query string, URL, localStorage, arbitrary header, or unverified JWT claims.
2. Derive the immutable provider subject/user ID from that verified session. Do not accept `candidateId` from the caller as the authority for data scope.
3. Resolve the candidate record through an explicit, unique identity mapping. If there is no mapping, fail closed; do not create an identity mapping from a caller-supplied candidate ID.
4. Perform reads and writes with the derived owner ID in the database predicate and/or database-enforced row-level security. Confirm grants, RLS policies, function execute privileges and service-role bypass behaviour against the actual schema before relying on RLS.
5. Validate input and authorize each resource action. A document ID, application ID, proof ID or audit ID is a locator, not authorization.
6. Record security-sensitive mutations in a durable audit trail. Client-supplied audit metadata is not evidence of a server-side audit event.
7. Return no-store responses for private data and keep object storage private. Generate short-lived signed URLs only after verified identity + owner-scoped metadata lookup; bind URL permissions to one object and operation.
8. Keep endpoints disabled until the real implementation and negative tests pass. A 503 fail-closed response is the current safe behaviour, not a completed product workflow.

## Required synthetic security test matrix

Use only isolated staging/test accounts and non-real data. Provider credentials must come from the approved secret store and must not be committed.

| Test | Expected outcome after real auth is integrated |
|---|---|
| No session calls profile, tracker, document status/read/upload, or founder review | 401/403 or explicit unavailable response; no data or signed URL |
| Invalid, expired, revoked, or wrong-audience token | Rejected; no data access |
| Candidate A reads own profile/application/document metadata | Only A-owned rows returned |
| Candidate A supplies Candidate B ID while reading/writing profile or tracker | Rejected (403/404); B unchanged |
| Candidate A supplies B's application ID | Rejected; no existence leakage beyond approved response policy |
| Candidate A requests read URL for B's document ID | Rejected; no URL emitted |
| Candidate A requests upload URL with B's candidate ID | Server ignores caller owner claim and scopes to A, or rejects malformed request; cannot create B-owned metadata |
| Candidate session attempts founder review | Rejected unless independently authorized founder role exists |
| Founder review with caller-provided audit/proof IDs only | Rejected; server creates durable audit event only after verified authorization and valid state transition |
| RLS/grant negative probes for anon/authenticated roles | No unauthorized candidate rows/mutations; test actual grants and policies |
| Logout, expiry, session rotation and CSRF (if cookie session) | Invalidated/mitigated according to provider/session design |
| Storage URL expiry and method/object scope | Expired URL fails; URL cannot access other objects or perform other operations |

The existing Playwright file covers only the fail-closed shutdown contract. Convert the matrix above into executed integration tests after the provider and isolated synthetic accounts exist. Do not call the current tests authenticated isolation coverage.

## Exact external prerequisites

1. **Identity provider configuration:** the source is now wired to Supabase Auth REST. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the deployment secret/environment settings; confirm the approved staging project, email confirmation behaviour, site URL and redirect URLs. Do not share secrets in chat, commits, screenshots, or this document.
2. **Session model:** select the supported server session pattern (provider-managed cookie/session or verified bearer token), define expiry/logout/revocation, CSRF controls if cookie-based, and trusted origins.
3. **Identity mapping:** approve the mapping between provider subject and the existing candidate primary key. This requires schema review; do not assume email is immutable or unique enough to be the sole authorization key.
4. **Database owner-scoped access:** after Phase 1 recovery gate is closed, review existing tables, grants, RLS policies and functions. Add no migration until backup/restore and migration rehearsal gates are satisfied.
5. **Private storage:** identify/approve the storage provider and private bucket, configure staging-only secrets and policies, establish object-key ownership convention, size/type limits, malware-scanning expectations, and a real short-lived URL signer.
6. **Synthetic test environment:** create Candidate A/B test identities and separate profile/application/document fixtures in isolated staging. Test fixtures must contain no real candidate PII.
7. **Execution evidence:** a clean deterministic dependency install, web build, and Playwright integration run on the exact commit, with run IDs and test output retained.

If the owner does not authorize or configure these prerequisites, the safe deliverable remains the current disabled endpoints plus explicit user-facing unavailable states.

## Build and test evidence

- Source inspection completed through GitHub file contents API on the branch above. Added `apps/web/src/lib/auth/supabase-rest.ts`, six auth route handlers (login/register/recovery/refresh/logout/session), connected the three candidate auth UI pages, added `apps/web/.env.example`, and added `e2e/kingsmen-auth-boundary.spec.ts`.
- `apps/web/package.json` declares a `build` script (`next build`) but this audit did not execute it.
- `e2e/candidate-security.spec.ts` exists and contains synthetic fail-closed regression cases; this audit did not execute Playwright.
- No successful web build, browser run, authenticated Candidate A/B isolation test, storage test, or RLS test is claimed.
- No database migrations were applied and no database data was read by this audit.
- Phase 0 remains **OPEN**: `apps/api/package-lock.json` and demonstrated reproducible `npm ci --prefix apps/api` remain outstanding.
- Phase 1 remains **OPEN / BLOCKED**: verified logical backup, checksum, isolated restore and migration rehearsal remain outstanding.

## Decision

**Phase A.4 remains OPEN. Do not close Phase A and do not move to Phase B yet.** A Supabase Auth REST integration is now implemented in source, but provider configuration and runtime behaviour are not verified. Owner-scoped profile/application access, private document storage, founder authorization, durable audit records and authenticated Candidate A/B isolation are not implemented or verified. The next action is to obtain the identity/session, database recovery, storage and synthetic-test prerequisites, then implement and execute the complete owner-scoped boundary as one integrated workstream.
