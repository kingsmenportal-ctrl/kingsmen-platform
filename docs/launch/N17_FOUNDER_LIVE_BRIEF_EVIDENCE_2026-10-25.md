# N17 Founder Live Brief — evidence integrity batch (2026-10-25)

## What this batch changes

Adds `apps/api/src/founder-ops/founder-live-brief.ts`, an evidence-aware brief assembler for the existing N17 Founder Command Ops foundation. It is deliberately a pure transformation over observations supplied by an authorised persisted read model; it does not query databases itself, mutate queues, approve commands, or execute candidate/provider actions.

The brief includes nine mandatory operational domains:
- system health
- queue
- finance
- documents
- matching
- Playwright/MAP
- incidents
- capacity
- urgent candidates (aggregate summary only)

## Evidence and freshness behavior

Each observation must include a domain, source reference, timestamp, state, and explanatory summary. Per-domain freshness budgets are 5 minutes for system health, queue, incidents and urgent candidates; 10 minutes for documents and Playwright/MAP; 15 minutes for finance, matching and capacity. These thresholds are conservative defaults in code, not a substitute for source-specific service-level policy.

- Missing feeds are marked `MISSING` and `UNKNOWN`, never healthy or zero.
- Old feeds are marked `STALE`; their effective severity becomes `UNKNOWN`.
- Invalid source refs/timestamps or implausibly future-dated evidence are marked `DEGRADED`.
- Overall status becomes `DEGRADED` when any domain is missing, stale, degraded, or unknown; a fresh critical signal remains `CRITICAL`.
- The builder preserves source references and produces explicit remediation actions for missing/stale/untrusted feeds.
- Metrics are restricted to scalar values and safe key formats. Candidate-level personal data is not part of this contract; urgent candidates are an aggregate domain.
- Candidate capacity defaults to 500. At or above cap, the brief explicitly preserves national route access and directs capacity/queue review; it must not turn a volume limit into a capability restriction.
- Output always has `productionReady: false`. The brief is not launch authorization.

## Governance

The brief recommends routing intervention through N12 governance and N16 execution. It is not a command endpoint and does not allow direct application submission, refund settlement, or final fraud/privacy decisions. Founder commands and human approvals remain subject to the existing N17 command policy.

## Validation

`scripts/staging/test-n17-founder-live-brief-contract.mjs` checks the required domains, freshness rules, missing/stale behavior, capacity doctrine, and governance boundaries. Root command: `npm run n17:founder-brief:check`; it is included in the root `npm test` chain.

## Not yet proven

This batch adds a source-level read-model transformation and static contract assertions. It does **not** claim a live founder-authenticated API endpoint, database-backed brief persistence, mobile UI wiring, runtime freshness measurements, staging deployment, or end-to-end founder workflow verification. Those require integration with the authenticated N17 read path and real staging source observations.
