# Authenticated Staging Test Identity Preparation

Status: preparation only. No users or staging rows were created. Execute only after a demonstrated isolated restore and owner/operator authorization.

## Roles and permissions

| Alias | Intended scope | Explicitly forbidden |
|---|---|---|
| Candidate A | Own profile/workspace, identity-review request/evidence, applications, preparation items, documents, orders and entitlements | Access to Candidate B data; reviewer queue/decision APIs |
| Candidate B | Same candidate scope as A, but separate Auth subject and separate fixtures | Access to Candidate A data; reviewer APIs |
| Reviewer | Authorized review queue and permitted decisions with immutable actor/audit evidence | Candidate impersonation, cross-owner writes, service-role token exposure, broad admin rights unless explicitly justified/approved |

Identity linking must use the authenticated Supabase user UUID / auth subject, not email-only linking. Reviewer authorization must be server-checked against an active reviewer record tied to that UUID, with assignment/revocation included.

**Important integration warning:** an older reviewer route found on a non-RC1 branch checks `platform_reviewers.role_code='PLATFORM_ADMIN'`. Do not grant a broad platform-admin role just to make an older route pass. Confirm the final integrated PR #190 reviewer authorization contract and dedicated least-privilege identity-review role before provision. If the route and schema role disagree, block reviewer testing rather than elevate privileges.

## Safe preparation sequence

1. **Recover first:** obtain approved isolated restore report and operator sign-off. No new test identities or rows before this gate.
2. **Inspect existing Auth Users:** use Supabase Dashboard → Authentication → Users. Reuse only accounts expressly labelled/registered as synthetic test accounts and verify their auth UUID and active/revoked status.
3. **No duplicate creation by default:** do not create new users simply because the reviewer account was hard to find. Ask the project owner to identify the approved test reviewer.
4. **Create candidates only after approval:** if none suitable, create Candidate A and Candidate B through the normal staging sign-up flow with distinct controlled test inboxes. Complete email verification through the supported flow. Do not fabricate direct rows in candidate tables.
5. **Create/authorize reviewer only through approved workflow:** use the reviewed admin path and minimum approved reviewer role. A second operator verifies the auth UUID-to-reviewer record/assignment. Never insert a guessed reviewer row or link by email alone.
6. **Authenticate through the actual app:** sign in separately as A, B and reviewer. Obtain short-lived test access tokens through the approved test/secret-manager process. Do not use the Supabase service-role key as a candidate/reviewer session.
7. Inject tokens only into environment variables: `KINGSMEN_E2E_CANDIDATE_A_TOKEN`, `KINGSMEN_E2E_CANDIDATE_B_TOKEN` and `KINGSMEN_E2E_REVIEWER_TOKEN`. Never store tokens in a JSON plan, source file, GitHub comments or log output.

## Minimum test matrix

| Case | Actor | Expected |
|---|---|---|
| Candidate workspace with no bearer token | anonymous | Denied (confirmed route contract: 401 or 403) |
| A reads own workspace/applications/documents | A | Authorized, only A-owned data |
| B reads own workspace/applications/documents | B | Authorized, only B-owned data |
| A requests B's fixture IDs | A | 404/denied, no row or metadata leakage |
| B requests A's fixture IDs | B | 404/denied, no row or metadata leakage |
| Candidate requests reviewer queue | A or B | Denied |
| Authenticated non-reviewer requests reviewer queue | designated negative-test account | 403 |
| Least-privilege reviewer accesses authorized queue | reviewer | Authorized only for review scope |
| Reviewer decision on a synthetic request | reviewer | Allowed transition persisted, actor and audit evidence present |
| Candidate reload after save/update | A/B | Persisted state belongs to the matching auth subject |
| Private document read | A/B | Own document only; signed URL expires; other candidate denied |
| Order/entitlement retrieval | A/B | Own orders/entitlements only; no entitlement before verified payment |

## Runner

`scripts/staging/run-kingsmen-authenticated-e2e.mjs` requires an HTTPS staging origin, a checked JSON plan, role-specific bearer tokens, safe in-origin paths, and explicit `KINGSMEN_E2E_ALLOW_MUTATIONS=true` for POST/PUT/PATCH/DELETE.

```bash
npm run staging:e2e:validate
export KINGSMEN_STAGING_BASE_URL='https://<verified-staging-origin>'
export KINGSMEN_E2E_PLAN='manifests/staging/authenticated-e2e-plan-v1.json'
export KINGSMEN_E2E_SUPABASE_URL='https://euhubhhnumtibbyufghm.supabase.co'
# Inject KINGSMEN_E2E_SUPABASE_ANON_KEY and role-specific tokens through the secret manager; never paste values in the shell command.
npm run staging:e2e
```

The included plan is a read-only preflight template. Extend with approved disposable fixture IDs and mutation/cleanup cases only after the final routes and data shape are verified. The generic runner does not create identities or automatically carry response IDs between calls; a read-only smoke is not full authenticated E2E.

## Evidence and cleanup

Store sanitized case IDs/status/durations, plan SHA-256, full RC1 SHA, published deploy ID and UTC timestamp. Never save response bodies, access tokens, passwords, candidate PII or private files. Verify cleanup counts for disposable fixtures after the run; preserve durable reviewer decision audit events under approved retention policy.
