# Phase B Identity Hardening — Batch Implementation Notes

Date: 2026-10-17  
Status: **Implementation proposal; not applied to a database**

## Why this batch is necessary

Read-only inspection of staging found two identity mapping concepts that must be reconciled before a safe migration:

1. `public.candidate_accounts` is already used by `kingsmen_security.current_authenticated_candidate_id()`, whose current implementation selects `candidate_id` by `auth_user_id = auth.uid()`.
2. `public.candidate_auth_identity_links` separately stores `supabase_user_id`, `candidate_id`, `link_status`, `verified_at`, `verified_by`, and revocation metadata. Its live constraints require link status PENDING/VERIFIED/REVOKED, verified metadata for VERIFIED, and a reason for REVOKED. Both Auth user and candidate are unique.

These are not safe to treat as interchangeable without examining row contents, provisioning flows, revocation semantics, and all consumers. The staging snapshot reported zero verified identity links and zero verified/public marketplace listings in the PR #86 status notes. That means candidate mapping must remain fail-closed; no synthetic verified identity or listing should be inserted just to turn a gate green.

## Observed ownership contracts

| Table | Existing owner contract | Phase B treatment |
|---|---|---|
| `candidate_saved_listings` | `user_id = auth.uid()` | Preserve until a candidate-ID backfill and caller migration are designed |
| `candidate_saved_routes` | `user_id = auth.uid()` | Preserve until a candidate-ID backfill and caller migration are designed |
| `candidate_route_applications` | `user_id = auth.uid()` | Preserve; this is the actual application tracker table found in staging |
| `document_files` | `candidate_id = kingsmen_security.current_authenticated_candidate_id()` | Compare resolver and mapping sources; do not replace blindly |
| `candidates` | Has multiple permissive SELECT policies | Review effective OR-combined policy set; add no redundant policy that leaves a broad path open |

Saved-listing, saved-route, and application records currently use the Auth user UUID, not the legacy candidate UUID. A policy-only switch to candidate IDs would break ownership or strand rows. The application table's existing insert policy also enforces verified public source and a planning-only initial status; preserve that product integrity contract.

## Resolver proposal

`docs/launch/sql/phase-b-own-candidate-id-proposal.sql` is a review-only SQL proposal. It:
- derives the Auth identity only from `auth.uid()`;
- accepts only an explicitly VERIFIED link with a verification timestamp;
- requires an active candidate;
- has no email, public reference, or client-provided ID fallback;
- returns NULL when the link is absent, pending, revoked, or candidate inactive;
- restricts function execution grants.

It is intentionally outside the active migration directory and has **not** been applied. It is not ready to promote until the function owner, private schema grants, RLS interactions, mapping conflicts, and rollback have been reviewed.

## Required data reconciliation (read-only first)

Run and retain results for the following checks in a controlled staging session:

1. Count active/inactive candidates.
2. Count Auth identity links grouped by status; inspect no PII in general logs.
3. Compare candidate IDs in `candidate_accounts` with `candidate_auth_identity_links`.
4. Identify Auth UUIDs mapped to different candidate IDs across the two mechanisms.
5. Identify candidate IDs with duplicate or orphan mappings (including FK integrity).
6. Inspect whether identity provisioning/revocation is implemented in trusted server code, and whether candidates can self-write either mapping.
7. Confirm function owner, `search_path`, execute grants, schema USAGE, RLS enablement, and table grants.
8. Inventory every API/web consumer of both identity helpers and every policy depending on them.
9. Confirm organisation profile table name and actual document-to-organisation relationship before adding any foreign key. Candidate ownership and organisation association are separate relationships.

## Two-candidate RLS acceptance matrix

Execute with two distinct authenticated JWTs against an isolated staging fixture after a verified backup/restore. Do not rely on the SQL editor alone, because `auth.uid()` is often NULL there.

| Scenario | Expected result |
|---|---|
| A reads A's saved listing / route / application | Allowed |
| A reads B's row by ID or guessed UUID | No row returned |
| A inserts a row with B's owner ID | Denied |
| A changes owner ID on A's existing row to B | Denied |
| A deletes B's row | No effect / denied |
| No verified link | No candidate identity; private document access denied |
| PENDING or REVOKED link | No candidate identity |
| Inactive candidate | No candidate identity |
| Authenticated anonymous/no JWT | Denied |
| Candidate attempts to write link table directly | Denied |
| Existing service-role API path | Works only via reviewed backend grants and authenticated service context |

For each mutation denial, verify B's source row is unchanged. Test both PostgREST/API calls and direct RLS-enforced SQL sessions where possible. Never run negative tests against production data.

## Migration and release gates

- The connected staging history includes migrations through 0058. Do not reuse 0056–0058.
- Repository has an older numbered `db/migrations` stream and the staging environment also has timestamped migration history. Reconcile the canonical source-of-truth and deploy path before choosing a filename or version.
- No migration until the mandatory logical backup is restored and validated in an isolated database.
- Preserve existing `user_id` semantics until data backfill, dual-read/dual-write strategy (if needed), app compatibility, and rollback are designed.
- Run API build, API tests, all candidate source validators, and database RLS integration tests in CI.
- Phase B cannot be marked green merely because the security advisor reports zero lint findings.
- Phase A stays uncertified until a genuine founder-approved public listing, current-head green build/tests, and safe reviewer preview evidence are retained.

## Current decision

**Not ready to apply.** The safest next action is to reconcile the two live identity mapping systems and build real two-user isolation tests in an isolated restored environment. The proposal exists in GitHub for review; no staging or production schema, data, or Netlify access controls were changed.
