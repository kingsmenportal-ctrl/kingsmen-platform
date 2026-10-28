# API Dependency Lockfile — Reproducibility Gate

Checked against the current RC1 tree on 2026-10-28:
- `apps/api/package.json` exists and declares `pg: ^8.12.0`, TypeScript `^6.0.3`, and `@types/node: ^24.0.0`.
- `apps/api/package-lock.json` is absent (GitHub contents lookup returned NOT_FOUND).
- The existing release-evidence workflow separately installs API dependencies, but without a committed API lock the dependency graph is not reproducibly pinned by this repository.

## Required step before immutable RC1 freeze

On a controlled release workstation in the integrated branch:

```bash
node --version
npm --version
npm install --package-lock-only --prefix apps/api
git status --short
git diff -- apps/api/package.json apps/api/package-lock.json
npm --prefix apps/api ci
npm --prefix apps/api run build
```

Review the generated lock before commit. Expected change: new `apps/api/package-lock.json`; do not alter the API package's declared versions merely to force a green build. Verify package versions, resolved URLs, integrity hashes and Node engine compatibility. Then commit the lock file through an approved PR, rerun exact-head CI, and only then establish the final immutable RC1 SHA.

The combined runner now checks for `apps/api/package-lock.json` before installation and runs `npm --prefix apps/api ci`. It intentionally exits before build if the lock is absent. This gate is new and evidence-based; do not silently replace it with an unpinned `npm install` inside a release certification run.
