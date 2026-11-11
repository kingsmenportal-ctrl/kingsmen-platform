# Phase B — Aggregate Identity Mapping Snapshot

Inspection date: 2026-10-17  
Environment: connected Supabase staging project `kingsmen-portal-staging`  
Method: read-only aggregate SQL; no candidate identifiers, emails, or row contents exported.

| Metric | Count |
|---|---:|
| `candidate_accounts` rows | 0 |
| `candidate_accounts` rows with `auth_user_id` | 0 |
| `candidate_auth_identity_links` rows | 0 |
| VERIFIED identity links | 0 |
| PENDING identity links | 0 |
| REVOKED identity links | 0 |
| Same Auth UUID mapped to differing candidate IDs across both mechanisms | 0 |
| Same candidate ID mapped to differing Auth UUIDs across both mechanisms | 0 |

## Interpretation

The zero counts mean the two mechanisms cannot currently be reconciled by comparing live mapping rows in this staging project: there are no rows to compare. This does **not** prove that a future production dataset will be consistent, that account provisioning works, or that RLS is correct.

The identity resolver proposal therefore fails closed and no backfill or verified link was fabricated. Before accepting Phase B:
1. Establish the intended candidate-account provisioning source of truth.
2. In an isolated restored test database, seed two synthetic candidates and two synthetic Auth identities.
3. Exercise verified, pending, revoked, inactive, missing-link, and conflicting-link scenarios.
4. Run API/PostgREST requests with separate authenticated JWTs and assert cross-candidate reads and writes are denied.
5. Confirm any necessary production backfill with an approved conflict-resolution and rollback plan.

This evidence is staging-only, time-bounded, and should be refreshed before promotion.
