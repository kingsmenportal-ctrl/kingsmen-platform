# PR #86 — Transaction-bound candidate identity-link admin runtime

Date: 2026-10-17

## Included
- Added `CandidateIdentityLinkAdminRuntime` as the intended application entry point for create, verify and revoke operations.
- Resolves a principal from an injected trusted server-side session resolver; the actor is not accepted from command payloads.
- Enforces action-specific permissions for create, verify and revoke.
- Owns the PostgreSQL transaction and establishes the fixed backend RLS context before running state mutation and audit insert.
- Added tests for trusted principal resolution, action-specific permissions, transaction ordering, audit failure rollback and connection release.

## Still intentionally not live-wired
There is no confirmed, production-ready founder/operator session resolver in the current candidate API. The runtime therefore requires a trusted resolver to be injected by a real server-side authorization system. Do not implement that resolver by trusting request body, query parameters, unsigned headers, client-supplied role names, or decoded-but-unverified JWT claims.

No public/admin HTTP route is enabled by this batch. Migration 0040 is not confirmed applied to staging; no live database/RLS integration result is claimed. Unit tests are committed but not executed in this environment.
