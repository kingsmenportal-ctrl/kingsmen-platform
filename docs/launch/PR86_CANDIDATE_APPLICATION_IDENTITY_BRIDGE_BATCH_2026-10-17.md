# PR #86 — Candidate application identity bridge

Date: 2026-10-17

## Delivered
- The Next.js application route continues to validate the Supabase Auth session server-side, then calls the API service over a server-to-server POST.
- The API service has a dedicated internal endpoint guarded by `KINGSMEN_WEB_INTERNAL_API_KEY`; it does not accept browser calls as trusted internal requests.
- The API resolves the supplied server-verified Supabase UUID only through `candidate_auth_identity_links` where `link_status = 'VERIFIED'` and the candidate is active. It never matches by email.
- The identity-link query runs on one checked-out database connection in a transaction with transaction-local backend context, and rolls back on error.
- A verified profile with no applications returns an authenticated empty list; an account with no verified link receives a distinct blocked response.
- Results are bounded to 200 application rows and are returned with no-store response headers.

## Required server configuration
- Next.js server: `KINGSMEN_API_BASE_URL` and `KINGSMEN_WEB_INTERNAL_API_KEY`.
- API server: the same `KINGSMEN_WEB_INTERNAL_API_KEY`, plus durable PostgreSQL Truth Vault configuration.
- The API base URL must use HTTPS outside localhost.

Use a high-entropy secret from the deployment secret manager. Do not expose it through any `NEXT_PUBLIC_*` variable or return it to the browser. Rotate the secret if it is ever exposed.

## Deployment and verification limits
- Migration `0018_n20_candidate_auth_identity_link.sql` must be applied before this bridge can return records.
- A verified identity link must be created through the trusted operator workflow; this batch does not create links or authorize self-linking.
- The source validator is added but has not been run here. No build, database integration test, or HTTP smoke test is claimed.
- The internal route uses the API's existing request-body size limit and service credential check. Production deployment should restrict network access to the API service in addition to the shared secret.
