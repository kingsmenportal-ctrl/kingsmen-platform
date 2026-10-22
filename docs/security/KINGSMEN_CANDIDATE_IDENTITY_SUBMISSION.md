# Candidate identity review submission boundary

## Implemented contract

`public.submit_candidate_identity_review(candidate_reference, claimant_name, claimant_message)` is the candidate-facing submission boundary. It derives the account exclusively from `auth.uid()` and does not accept a caller-supplied account ID. It validates bounded inputs, prevents a second open request for the same account, creates a `PENDING` request, and appends the initial `SUBMITTED` audit event in the same transaction.

The function is `SECURITY DEFINER` with an empty `search_path`; execute is revoked from `PUBLIC` and `anon`, and granted to `authenticated` (plus `service_role` for trusted backend orchestration). Direct access to the review queue and audit tables remains denied to client roles.

## Explicit safety limits

- Submitting a request does not verify a candidate or create an identity link.
- Only the existing authorised human-review decision flow can approve and link an account to a candidate record.
- No reviewer role is created or elevated by this change.
- The claimant must provide the exact candidate reference; approval remains gated by reviewer-side validation against an active candidate.
- No real request was inserted during deployment verification, to avoid fabricating candidate data.

## Staging verification

Migration `20261022050000_candidate_identity_review_submission_rpc` was applied to the staging project. Catalog checks confirmed `SECURITY DEFINER`, empty `search_path`, anonymous execution denied, authenticated and service-role execution allowed. The queue remained empty after verification. Authenticated end-to-end submission and human reviewer approval still require real test accounts and authorised reviewer provisioning.

Run `node scripts/validators/validate-candidate-identity-submission-contract.mjs` for static contract checks.
