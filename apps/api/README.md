# Kingsmen API

The API is a Node.js 22 + TypeScript HTTP service. Its health endpoint is `GET /health`; `GET /api/system/health` is an alias. The endpoint reports the selected Truth Vault storage mode, but a healthy HTTP response alone does not prove candidate isolation, durable writes, or production readiness.

## Local development

From the repository root:

```sh
npm --prefix apps/api install
npm --prefix apps/api run build
npm --prefix apps/api start
```

Local development may use the in-memory adapter. It is process-local, non-durable, and must not be used for a production release.

## Container build

Build context must be the repository root because the image copies the API package:

```sh
docker build --file apps/api/Dockerfile --tag kingsmen-api:local .
``

The container runs as the unprivileged `node` user, exposes port 8080, includes a health check, and forces `KINGSMEN_TRUTH_VAULT_MODE=postgres`. It intentionally uses `npm ci` in both stages. **The image cannot build until `apps/api/package-lock.json` is committed.** Do not replace `npm ci` with an unpinned install to get a green build.

## Required runtime configuration

- `KINGSMEN_DATABASE_URL` (or `DATABASE_URL`) must point to the approved PostgreSQL/Supabase database.
- `KINGSMEN_TRUTH_VAULT_MODE=postgres` is required for durable production persistence.
- `KINGSMEN_DATABASE_POOL_MAX` should be sized against the database's connection limits.
- `KINGSMEN_API_CORS_ORIGIN` must be set to the exact trusted frontend origin; avoid wildcard CORS in deployed environments.
- Store database credentials in the deployment secret manager. Never put them in this repository, an image layer, or a committed environment file.

## Release gates not replaced by container health

Before staging or production release, independently prove clean lockfile installation and build, migration compatibility, a timestamped logical backup and isolated restore, RLS isolation with separately provisioned test users, authenticated runtime journeys, monitoring/incident handling, and sandbox payment callback behavior. This container definition does not run migrations, seed data, deploy itself, enable live payments, or claim those checks have passed. Keep `PAYMENTS_LIVE=false` until the separate payment approval gate is satisfied.
