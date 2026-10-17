# Candidate Identity Link — implementation batch (2026-10-17)

## Added

- `db/migrations/0040_candidate_auth_identity_link.sql`
  - Adds a one-to-one mapping from Supabase Auth user UUID to candidate UUID.
  - Requires explicit `VERIFIED` status and verification metadata.
  - Uses unique constraints on both IDs, so one Auth identity cannot point to multiple candidates and one candidate cannot silently be linked to multiple Auth identities.
  - Enables RLS and permits table access only when the existing trusted backend context is established.
  - Does not permit candidate self-linking and does not use email equality for ownership.

- `apps/api/src/candidate/candidate-identity-link.ts`
  - Resolves only a server-verified UUID against an explicit verified mapping.
  - Requires the candidate record to remain active.
  - Returns no mapping for malformed IDs, missing/pending/revoked mappings, inactive candidates, or unexpected multiple results.
  - Does not accept email or candidate-provided IDs as identity proof.

- `apps/api/src/candidate/candidate-identity-link.test.ts`
  - Tests verified mapping, missing mappings, malformed IDs, and fail-closed duplicate results.
  - Asserts the query does not use email as a matching key.

## Integration boundary — still required

Migration sequence correction: this identity-link migration is numbered 0040, after the existing 0039 migration; it no longer collides with the unrelated 0018 migration. This batch does not claim that the migration has been applied, that RLS has been proven against a live database, or that the web candidate applications route is enabled. The resolver is a backend building block, not an endpoint and not a substitute for a trusted database connection.

Before connecting the web route:
1. Run and review the migration through the repository's normal migration process; do not apply it to production from this change.
2. Ensure the API database connection establishes the trusted `app.kingsmen_role=service_role` and `app.service_context=backend_api` context inside a transaction, not via client-controlled input.
3. Add a backend-only verified-link creation/revocation workflow with audit events and explicit proof of account ownership; never link accounts by email equality.
4. Add an API endpoint/read model that resolves the mapping and fetches applications scoped by the resolved candidate UUID.
5. Add integration tests against PostgreSQL/RLS using two test identities, including cross-candidate denial, pending/revoked mapping denial, inactive candidate denial, and transaction-context isolation.
6. Only then replace the web route's fail-closed response with a call to that backend boundary.

The candidate applications and document routes must remain fail-closed until the full integration and runtime proof are complete.
