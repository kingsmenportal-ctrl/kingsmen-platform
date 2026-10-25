# Identity review least-privilege authorization

## Authorization contract

Identity decisions require an active, non-revoked `IDENTITY_REVIEWER` row in `public.platform_reviewers`. The capability is separate from `PLATFORM_ADMIN`, `APPLICATION_REVIEWER`, and `EVIDENCE_VERIFIER`. The reviewer registry and identity-review request/audit tables remain backend-only.

The `decide_candidate_identity_review` function is callable only by `service_role`. The deployed `candidate-identity-review-decision` Edge Function validates the bearer token with Supabase Auth, derives the reviewer UUID from the verified session (never from the request body), checks the dedicated role, and then calls the transactional RPC.

## Decision safeguards

- Approval requires an exact active candidate `public_ref`; no fuzzy matching or email-based linking.
- Conflicting account/candidate links fail closed.
- A verified identity link is created or promoted only in the `APPROVED` branch.
- Each accepted decision writes an audit event with the actor UUID, `IDENTITY_REVIEWER` role, decision, candidate reference resolution, note, and before/after state.
- Revoked or inactive reviewer grants cannot make decisions.
- Direct `anon` and `authenticated` RPC execution remains denied.

## Source and staging verification

Run the source guard:

```sh
npm run security:validate:identity-review
```

Run the read-only unauthorized decision probes after applying the migration:

```sql
-- scripts/security/test-identity-review-authorization.sql
```

The probes assert that ungranted accounts cannot approve, reject, or request more information; that `PLATFORM_ADMIN` alone is not sufficient; and that only `service_role` can execute the decision RPC.

A separate rollback-only positive SQL integration probe is provided at `scripts/security/test-identity-review-approval-rollback.sql`. It verifies approval, a verified link, and audit persistence inside a temporary transaction fixture, then cleans up the request, audit, and link. This is database integration evidence, not proof of an authenticated candidate submission or browser end-to-end flow.

## Staging observation (2026-10-25)

- The new migration is applied to the Kingsmen staging database.
- The supplied staging Auth account has one active `IDENTITY_REVIEWER` grant.
- The decision Edge Function is ACTIVE version 1 with gateway JWT verification enabled.
- Negative authorization SQL probes passed for ungranted identities and for a temporary `PLATFORM_ADMIN`-only grant.
- The rollback-only approval/audit probe passed and left zero identity-review requests and zero identity links.
- The RPC privilege check returned `anon=false`, `authenticated=false`, `service_role=true`.

## Remaining release gate

No authenticated candidate bearer token was available to submit a genuine request through the candidate submission Edge Function, and the connected tools do not expose a direct Edge Function POST invocation. Therefore a real authenticated candidate submission followed by a reviewer HTTP decision, durable audit inspection, and candidate-owned access verification remain **unverified**. The rollback-only SQL fixture must not be described as that end-to-end proof.
