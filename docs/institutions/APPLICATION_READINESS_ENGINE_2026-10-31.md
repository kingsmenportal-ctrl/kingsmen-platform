# Institution application readiness engine — 31 October 2026

## What this delivers

- A reusable, fail-closed evaluator for provider route readiness and opportunity/application readiness.
- A checked-in readiness contract with explicit provider states P0–P5 and opportunity states O0–O6.
- Regression cases covering stale source evidence, HTTP and wrong-domain routes, expired deadlines, candidate preflight, candidate-reported submissions, verified provider receipts and provider-confirmed outcomes.
- A root `npm test` gate so readiness logic cannot drift silently.

## Provider state transitions

- **P0 — Discovered:** a source/provider candidate is known.
- **P1 — Identity verified:** canonical key, recognised/legal name and current authoritative source evidence are present.
- **P2 — Route verified:** the HTTPS destination, scope and route verification timestamp are current.
- **P3 — Connector configured:** a supported connection method is configured and access plus terms review are approved; human handoff remains available.
- **P4 — Route tested:** a recorded test passed within its declared freshness window.
- **P5 — Monitored:** health evidence is fresh and healthy and failure handoff is operational.

A P2 verified handoff can still be useful for candidate preparation without being an automated connector. Provider state never proves that an opportunity is open, that a candidate is eligible, or that a submission has happened.

## Opportunity state transitions

- **O0 — Found:** opportunity lead only.
- **O1 — Source verified:** authoritative evidence is specific to this opportunity.
- **O2 — Current and open:** current status check is fresh, the source says `OPEN`, and any published deadline is still in the future.
- **O3 — Requirements mapped:** required fields and eligibility/document rules have current human-verified review evidence.
- **O4 — Candidate ready:** route is verified, the candidate requirements-match review is verified, preflight passes, required documents are present and consent is confirmed.
- **O5 — Submission evidenced:** a provider receipt record, reference and evidence ID are present.
- **O6 — Outcome verified:** a provider-confirmed outcome and evidence ID are present.

Candidate-reported submission is carried as a separate flag and does not advance O4 to O5. A provider receipt does not imply admission, employment or another outcome. Outcomes remain separately confirmed. Historical receipt and outcome timestamps must be valid and non-future, but are not invalidated by an opportunity's current-source freshness window; that window governs availability/route claims, not whether a recorded past event occurred.

## Integration contract

The evaluator is a pure domain helper in `apps/api/src/institutions/application-readiness.mjs`. It takes structured evidence inputs and an optional evaluation timestamp; it does not query Supabase, mutate records, scrape portals or submit applications. The runtime/API integration must map canonical provider/opportunity rows into this contract after the dependent schema is reviewed and approved.

The caller must provide explicit per-evidence freshness windows; no arbitrary universal freshness interval is invented. Timestamps must include a timezone. Missing, invalid, future-dated, stale or inconsistent evidence fails closed. Date-only closing dates are evaluated in `Africa/Johannesburg`; a date before the local date is expired, while a date equal to today is not advertised as open unless the official cutoff time is known and represented explicitly. The status flag `OPEN` alone never overrides a deadline.

## Security and operational boundaries

- Use the existing canonical provider registry; never introduce a parallel registry.
- Keep public discovery, provider identity, route verification, connector configuration, programme availability, candidate eligibility, submission evidence and provider-confirmed outcome distinct.
- Do not bypass access controls, CAPTCHA, MFA, legal attestations or provider submission terms.
- Candidate-specific authorisation is still required at the time any permitted submission is attempted.
- Maintain RLS, least privilege, private documents, time-limited links, redacted evidence, audit trail, retention controls and Candidate A/B isolation.
- Do not mark a migration applied or alter live staging records through this readiness implementation.

## Verification

Run:

```bash
npm run institutions:readiness:check
npm test
```

The readiness check includes deterministic tests with fixed time. A passing repository test establishes the contract/evaluator logic only; it is not proof of live provider routes, runtime database integration, candidate-specific eligibility, deployed behaviour or national coverage.

## Next integration steps

1. Independently review this implementation along with the institution source and candidate directory PR stack.
2. Map provider and opportunity evidence columns into the contract in a reviewed service layer.
3. Add database-backed fixtures only after approved schema/migration and backup/change-control gates pass.
4. Exercise authenticated Candidate A and B flows, including document access, preflight, handoff/receipt and outcome separation.
5. Record exact deployed commit and route-level runtime evidence before changing release status.
