# Kingsmen API — credential-free deployment foundation

## Local run

Use Node.js 22 (the CI runtime) and install API dependencies from this directory:

```sh
npm install --ignore-scripts
npm run build
npm start
```

The API listens on `KINGSMEN_API_PORT` (default 8080). Its `/health` endpoint is a liveness check only; it must not be interpreted as proof that PostgreSQL, authentication, payments, communications, or candidate isolation are ready.

## Runtime configuration

- `NODE_ENV`: set to `staging` or `production` for deployed environments; these modes now fail startup unless durable PostgreSQL mode is selected.
- `KINGSMEN_RUNTIME_ENV`: optional descriptive label only; it does not replace `NODE_ENV` enforcement.
- `KINGSMEN_TRUTH_VAULT_MODE`: `memory` for local/mock work or `postgres` for persistent staging.
- `KINGSMEN_DATABASE_URL` / `DATABASE_URL`: database connection, set only in protected environment settings.
- `KINGSMEN_DATABASE_SSL`: set to `true` to enable TLS with certificate verification; do not disable verification to work around certificate errors.
- `KINGSMEN_API_PORT`: listening port.
- `KINGSMEN_BACKEND_BASE_URL`: configured on the web runtime to call this API.

Never put credentials in source control, build arguments, test fixtures, or evidence reports. Use the hosting provider's protected environment-variable settings. Reports may record only whether a required variable is present, never its value or a prefix.

## Provider adapters and mocks

Credential-free checks may use deterministic fake providers to test request construction, validation, idempotency, retry rules, and redaction. A fake provider must be labeled `mock` in test output and must never create a report claiming that a real provider call occurred.

PayFast success is accepted only through a verified sandbox ITN. A simulated success cannot mark a real application paid. Email, WhatsApp, SMS, and document-storage adapters remain disabled until their protected credentials are configured and their own staging proofs pass.

## Persistence and launch gate

Memory mode is ephemeral and is not suitable for staging acceptance. Staging persistence must be tested against the isolated staging database, including process restart and duplicate-request behavior. `NODE_ENV=staging` or `NODE_ENV=production` now refuses to start in memory mode, and explicit TLS uses certificate verification. Do not run a restore drill against the source database; the restore target must be a separate disposable database.

The launch-readiness gate intentionally remains blocked until real redacted evidence exists for authenticated candidate/staff isolation, RLS, persistence across restart, PayFast sandbox callbacks, backup/restore, secrets health, provider messaging, observability, legal/privacy publication, and repository branch protection. A successful build or mock test is not runtime evidence.
