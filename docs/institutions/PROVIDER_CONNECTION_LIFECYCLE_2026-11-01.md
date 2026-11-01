# Provider connection lifecycle — 1 November 2026

## Purpose

Add an evidence-backed control boundary between an institution directory record and a usable provider integration. A listed provider is not a connected provider. A verified application URL is not permission to automate. A passing integration test is not permission to submit real candidate data.

## Lifecycle

| State | Required evidence |
|---|---|
| C0_NOT_CONNECTED | Default. No connector capability is advertised. |
| C1_AUTHORIZATION_VERIFIED | Current provider-issued grant, named authority, official-domain evidence, approved scope allowlist, expiry and revocation state. |
| C2_TERMS_APPROVED | Current provider terms reviewed by an identified reviewer and covering every authorised scope. |
| C3_CONNECTOR_CONFIGURED | Approved privacy review, candidate-consent enforcement, data minimisation, scope intersection, secure official target, opaque credential reference where needed, configuration evidence and human handoff. |
| C4_ROUTE_TESTED | Fresh passing SANDBOX/STAGING test using synthetic data, all configured scopes and no external side effects. |
| C5_MONITORED | Fresh healthy check, evidence reference, named failure owner and failure-handoff evidence. |

## Security and operating rules

- Provider authority, current terms, privacy review and route configuration are separate evidence records.
- Configured scopes must be a subset of both provider-approved and terms-approved scopes.
- API and authorised-browser credentials are referenced by an opaque vault identifier. Raw keys, passwords or tokens do not belong in application data, logs or manifests.
- The connector keeps a human fallback. Browser automation is not implied by a directory record or official portal URL.
- Test runs use synthetic data in sandbox or staging and must not create provider-side effects.
- Automated submission is false by default. It requires an explicit provider SUBMIT grant, terms coverage, a passing scope-specific test, monitored connector state and a per-candidate authorisation gate.
- Provider receipts and outcomes remain separate evidence events. A Kingsmen-side request or candidate-reported submission is not provider acknowledgement.
- Missing, stale, future-dated, expired, revoked, conflicting or out-of-scope evidence blocks progression.

## Implementation boundary

This workstream adds a pure lifecycle evaluator, a machine-readable contract and a regression validator. It does not add a parallel provider registry, issue credentials, contact provider systems, submit applications, write to Supabase, apply migrations, create partnerships or claim any live connector is activated.

## Release status

The code and contract are submitted for CI and review as a dependent pull request on the institution directory/readiness branch. Staging database and provider runtime activation remain gated on approved migration provenance, backup/restore evidence, provider-specific authorisation and authenticated runtime tests.
