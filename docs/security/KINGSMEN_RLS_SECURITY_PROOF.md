# Kingsmen RLS Security Proof

Status: `foundation_built_pending_staging_proof`  
Production ready: `false`

## Purpose

This document records the row-level-security boundary needed before Kingsmen can open to public users.

The original N03 Truth Vault migration correctly created the core tables and enabled RLS, but it used bootstrap-wide service policies. The launch hardening path now adds a second migration:

```txt
 db/migrations/0019_rls_security_boundary.sql
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

## Remaining production constraint

This proof is source-level. It does not replace staging execution.

Before public users, run live SQL isolation tests against staging PostgreSQL/Supabase using two test candidates, an operator context, a founder context, an anonymous context, and a backend service context. Store the report under:

```txt
reports/security/rls-security-staging-proof-latest.json
```

Public launch remains blocked until that staging proof exists and passes.
