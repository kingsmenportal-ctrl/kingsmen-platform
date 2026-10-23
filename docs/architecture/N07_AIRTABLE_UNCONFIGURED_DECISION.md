# N07 decision: keep Airtable unconfigured

Date: 2026-10-23  
Status: Active operational decision pending integration readiness review.

## Decision

Keep Airtable unconfigured in staging while Kingsmen core candidate services proceed independently. Do not create a placeholder target just to make an integration test pass. PostgreSQL remains authoritative. Candidate registration, opportunity discovery, application preparation, private-document workflows and tracking must not depend on Airtable availability or successful mirror delivery.

This decision is not evidence that N07 delivery or recovery has passed.

## Live staging observations

A direct database query on 2026-10-23 returned:

- Airtable targets: 0.
- Active outbound-only, PostgreSQL-authoritative targets: 0.
- N07 outbox rows: 0.
- Active PLATFORM_ADMIN reviewer grants: 0.
- N07 enqueue function: active, version 2, JWT verification enabled.
- N08 founder-health function: active, version 3, JWT verification enabled.

No reviewer/admin grant was created or assumed. Existing Auth accounts do not by themselves prove founder-admin authority.

## Operating rules

1. Do not configure Airtable until the real base/table mapping, outbound-only direction, credential owner, least-privilege access and data minimisation are approved.
2. Core candidate services must not wait for a mirror call or roll back their PostgreSQL transaction because Airtable is unavailable.
3. Mirror payloads must exclude candidate PII, raw CV text, identity numbers, documents and secrets.
4. Missing target configuration must be reported as degraded integration readiness. Production readiness stays false.
5. When configured, use a dedicated non-candidate test target and trusted runner environment. Do not log secrets.
6. Reviewer and founder-admin access must be explicitly authorised and identity-verified.

## Gates before enabling Airtable

- Approved real target mapping and credential ownership.
- Active outbound-only target with PostgreSQL-authoritative semantics.
- Authenticated duplicate enqueue proves same job ID and one durable row.
- Live claim, transient failure, retry/backoff, expired-lease recovery, dead-letter and success tests pass.
- N08 unauthenticated rejection and authorised founder-admin probe pass.
- Fault injection proves registration, opportunity discovery, application preparation, private documents and tracking remain available when Airtable is unavailable.
- Secret-safe logs, no PII leakage and all release gates remain satisfied.

## Execution blockers

The runner does not currently have authorised reviewer/founder-admin sessions or a service-role credential in its trusted environment. A direct HTTP attempt also failed because the runner could not resolve the Supabase host. These blockers do not justify weakening access controls. Keep production readiness false.
