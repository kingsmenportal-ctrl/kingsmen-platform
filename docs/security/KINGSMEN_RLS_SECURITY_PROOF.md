# Kingsmen RLS Security Proof

Status: `foundation_built_pending_staging_proof`  
Production ready: `false`

## Purpose

This document records the row-level-security boundary needed before Kingsmen can open to public users. The migration set is being hardened so broad bootstrap policies cannot be used by `anon` or ordinary `authenticated` clients.

The final RLS boundary migration is:

```txt
db/migrations/0019_rls_security_boundary.sql
```

## Trusted identity claims

Candidate and founder/operator policies use claims obtained from `auth.jwt()`. The `kingsmen_role`, `candidate_public_ref`, and `service_context` values must be server-managed `app_metadata` claims populated by a trusted Auth hook/admin path. Do not use `user_metadata`, request parameters, or client-settable PostgreSQL custom GUCs for authorization.

The migration pins `search_path` for its `SECURITY DEFINER` candidate lookup and qualifies the candidate table as `public.candidates`. Security helper functions are not executable by `PUBLIC`.

## Important service-role boundary

The service-role key bypasses RLS by design in Supabase. A policy predicate cannot be treated as a restriction on that key. Therefore:

- Never expose a service-role key to a browser, mobile app, public build artifact, or candidate.
- Keep the service-role key in backend-only secret storage.
- Enforce user authorization and service-context checks in the backend before database calls.
- Prove the web/backend boundary separately from database RLS.
- Test candidate isolation with authenticated non-service-role sessions and two distinct synthetic candidates.

## Boundaries enforced by the migration

- Broad `USING (true)` / `WITH CHECK (true)` policies in schema migrations are explicitly scoped to `service_role`, not the default PUBLIC audience.
- Candidate reads use trusted candidate claims and are limited to the candidate's own public reference and candidate id.
- Protected evidence is hidden from candidate read policies.
- Founder/operator policies are read-oriented where possible and use trusted server-managed claims.
- Audit events are founder-readable only.
- Public route-source reads are limited to rows with status `VERIFIED` and confidence bands `A` or `B`.
- The hardening migration itself must not contain broad tenant-blind true policies.

## Required staging proof

Source checks are not live security proof. On the isolated staging project, test with two synthetic candidates, ordinary authenticated sessions, an operator claim, a founder claim, an anonymous session, and backend API calls. Confirm that one candidate cannot read another candidate's data, that unauthenticated writes fail, and that service-role credentials never appear in client artifacts. Capture redacted SQL/API evidence.

Run source proof:

```bash
npm run security:prove:rls
```

Run validator:

```bash
npm run security:validate:rls
```

Then run the launch audit:

```bash
npm run kingsmen:launch:audit
```

Store staging proof under:

```txt
reports/security/rls-security-staging-proof-latest.json
```

Public launch remains blocked until staging proof exists, passes, is reviewed, and is included in the final evidence bundle.
