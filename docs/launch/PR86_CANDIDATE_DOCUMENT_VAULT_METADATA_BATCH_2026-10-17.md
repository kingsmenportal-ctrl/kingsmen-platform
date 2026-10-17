# PR #86 — Candidate private document vault metadata

Date: 2026-10-17

## Included
- Migration 0019 adds private document metadata with bounded file size, content-type allowlist, document type/status constraints, opaque unique storage object keys, and backend-only RLS.
- Added owner-scoped document metadata listing by server-verified Supabase Auth UUID through the verified identity-link table and active candidate row.
- Added an exact-document locator lookup for use by a future trusted storage signer; it excludes archived documents and never performs email matching.
- Added transaction-bound runtime methods, unit tests, and a source validator.

## Safety and launch limits
- No storage provider is configured by this batch. No upload URL or read URL is generated, and no document route is enabled.
- The storage locator is an internal-only value and must never be returned to the browser. A real adapter must enforce private bucket access, opaque server-generated keys, short-lived signed URLs, content scanning, and size/type verification.
- Migration 0019 is committed only; it has not been applied to a database. Tests and validators have not been executed in this environment.
- Candidate document endpoints remain fail-closed until verified identity mapping, PostgreSQL runtime/RLS, and a real private storage adapter are proven in staging.
