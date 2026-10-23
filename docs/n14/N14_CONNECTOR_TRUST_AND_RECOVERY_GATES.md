# N14 connector trust and recovery gates

## Scope

This addition makes existing N14 connector doctrine executable in a shared policy module. It does not represent provider activation, successful delivery, or live end-to-end verification.

## Enforced rules

- Inbound webhook envelopes require a verified signature, stable connector/event/idempotency identifiers, an object payload, and a SHA-256-shaped payload hash. Anything else is rejected.
- Authentication, policy, and invalid-payload failures are blocked without retries.
- Transient failures retry only while within the configured attempt budget; exhausted and unclassified failures go to the dead-letter queue (DLQ).
- Workflow results require exactly eight worker nodes, no more than one Airtable mirror write, exactly one backend result POST, an authorised state transition, an idempotency key, and evidence references.
- A portal marked OPEN remains probe-only; it does not grant permission to submit. OTP, CAPTCHA, down, manual-only, unknown, and unrecognised portal states route to MAP/manual review.
- PostgreSQL/backend remain authoritative. Airtable remains a mirror; n8n remains a thin worker. Provider health must not be inferred from the existence of a registry record.

## Commands

- `npm run n14:connectors:validate` checks the manifest, migration and policy contract and writes `reports/validation/n14-connector-contract-latest.json`.
- `npm run n14:connectors:test` runs regression assertions for webhook trust, retry/DLQ, result limits and MAP fallback.

## Release limitation

Passing these checks proves the repository contract only. Live provider credentials, signature verification against real webhook requests, persistence/idempotency under concurrency, provider delivery, deployed SHA matching and candidate journey tests remain separate release gates.
