# Candidate Backend Transaction Boundary — 2026-10-17

## Implemented

- `apps/api/src/candidate/candidate-backend-transaction.ts` acquires one checked-out PostgreSQL client, begins a transaction, sets the fixed `app.kingsmen_role=service_role` and `app.service_context=backend_api` claims using transaction-local `set_config(..., true)`, executes the callback on that same connection, commits on success, rolls back on failure, and always releases the connection.
- The context values are constants inside the backend; callers cannot choose role or service context from request input.
- `apps/api/src/candidate/candidate-application-runtime.ts` composes that transaction boundary with the owner-scoped application read.
- Added transaction tests for trusted context ordering, same-connection execution, commit, rollback, query errors, and connection release.
- Added runtime composition tests for context-before-read and malformed Auth UUID rejection.
- Added `npm run candidate:validate:transaction` static source-contract validation.

## Security and rollout status

This is not yet wired into the web application route. The route remains fail-closed and returns the existing 503 until the full integration is reviewed and exercised. This code does not provision or revoke identity links, and it does not prove the deployed database has migration 0009/0018 applied correctly.

Before enabling candidate application reads:
1. Run `npm --prefix apps/api run validate` in a real checkout.
2. Run both root static gates: `npm run candidate:validate:application-read` and `npm run candidate:validate:transaction`.
3. Add and run PostgreSQL integration tests using the actual database roles and RLS policies, including two candidates, pending/revoked links, inactive candidates, and attempts to read the other candidate's applications.
4. Review pool credentials and confirm no client or other untrusted process can use the backend database credentials.
5. Implement a privileged, auditable identity-link create/verify/revoke workflow; do not auto-link by email.
6. Only after the gates pass, connect the web route to the API runtime using the server-verified Auth UUID.

No database migration was applied. The code/test additions are committed, but local build/tests and CI have not been executed by this integration, so no passing status is claimed.
