# Kingsmen RLS Security Proof

Status: `foundation_built_pending_staging_proof`  
Production ready: `false`

## Purpose

This document records the row-level-security boundary needed before Kingsmen can open to public users.

The original N03 Truth Vault migration correctly created the core tables and enabled RLS, but it used bootstrap-wide service policies. The launch hardening path now adds a second migration:

```txt
 db/migrations/0009_rls_security_boundary.sql
```

That migration replaces broad bootstrap policies with runtime-claim policies based on explicit backend settings.

## Runtime claims

The API/backend must set these PostgreSQL settings per request/session before touching candidate data:

```sql
SET LOCAL app.kingsmen_role = 'service_role';
SET LOCAL app.service_context = 'backend_api';
```

For candidate scoped read sessions, the backend must set:

```sql
SET LOCAL app.kingsmen_role = 'candidate';
SET LOCAL app.candidate_public_ref = 'KM-EXAMPLE-0001';
```

Founder/operator read contexts use:

```sql
SET LOCAL app.kingsmen_role = 'founder';
-- or
SET LOCAL app.kingsmen_role = 'operator';
```

## Boundaries enforced by the migration

- Backend service writes require both `service_role` and `backend_api` context.
- Candidate reads are limited to their own `public_ref` mapping.
- Candidate application/evidence reads are limited to their own candidate id.
- Protected evidence is hidden from candidate read policies.
- Founder/operator policies are read-oriented where possible.
- Audit events are founder-readable only.
- Verified public source rows are limited to status `VERIFIED` and confidence bands `A` or `B`.
- The hardening migration must not contain `FOR ALL USING (true) WITH CHECK (true)` policies.

## Proof scenarios

The source-level proof covers:

1. candidate can read own candidate row
2. candidate cannot read another candidate row
3. candidate can read own applications
4. candidate cannot read protected evidence
5. operator can read candidate workbench
6. founder can read audit events
7. service role without backend context is denied
8. service role with backend context can write
9. anonymous cannot read candidate data
10. public can read verified route sources only

## Commands

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

## Supabase security review — live staging snapshot (2026-10-22)

The following read-only checks were executed against the connected staging database on 2026-10-22; they are database observations, not source-only assertions:

- Public base tables inspected: **225**.
- Tables with RLS enabled: **225**; tables with RLS disabled: **0**.
- RLS-enabled tables with no policies: **3** — `candidate_identity_review_audit`, `candidate_identity_review_requests`, and `candidate_private_document_reviews`.
- Forced RLS is enabled on **1** public table.
- For each of those three backend-only review/audit tables, `anon` and `authenticated` have no SELECT privilege; `service_role` retains SELECT. Do not add broad client policies merely to silence an informational advisor finding.
- The verified-candidate helper resides in the non-exposed `private` schema; the public-schema copy is absent. It is SECURITY DEFINER with an empty `search_path`; `anon` cannot execute it and `authenticated` can execute it for existing RLS policy evaluation.
- Privilege checks confirm the legacy identity-review submission RPC and the service-only submission/decision RPCs cannot be executed by `anon` or `authenticated`; service-role execution is retained where required.
- Supabase Security Advisor reports three INFO notices for the intentionally backend-only tables and a separate leaked-password-protection WARN. The current Free plan does not expose the setting required to enable leaked-password protection; this is a platform-plan constraint, not a reason to weaken database policy.
- Current staging readiness counts are zero active platform reviewers, zero identity-review requests, zero verified identity links, and zero private documents. No reviewer or candidate fixtures were fabricated.

## Remaining production constraint

The checks above prove RLS is enabled across the inspected public tables and validate selected grants/functions. They do **not** prove policy correctness for every table, candidate A/B isolation through authenticated HTTP, private object isolation, signed URL expiry, or the reviewer decision lifecycle. A real authenticated candidate and reviewer test remains a release gate. No reviewer was provisioned, no candidate data was written, and no production migration was applied during this check.

The full isolation test must use two authorised candidate sessions, an authorised reviewer session, anonymous access, and backend service context; preserve only redacted evidence. Store the reviewed result under:

```txt
reports/security/rls-security-staging-proof-latest.json
```

Public launch remains blocked until those runtime isolation checks pass and the founder reviews the release evidence.
