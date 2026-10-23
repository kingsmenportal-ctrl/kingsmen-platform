# N15 — Source freshness, duplicate reconciliation and pathway matching

## Scope
This increment hardens the existing N15 opportunity engine. It does not replace the existing schema, scout or review UI and does not claim that any external source has been crawled or verified live.

## Policy
- Accept only HTTPS source URLs without embedded credentials; canonicalise host, path, tracking parameters and fragments.
- A source can receive the registered-authority confidence ceiling only when its hostname is exactly the registered hostname or a true subdomain. Lookalike suffixes do not match.
- Freshness requires valid observation and last-check timestamps plus an explicit stale-after boundary. Missing check/freshness evidence, future timestamps and expired windows fail closed.
- Duplicate fingerprints normalise provider, title, sector, location and qualification. Duplicates are grouped for review, not silently discarded; source observations and provenance must remain available.
- Deadlines require evidence and a confirmed status. Missing, estimated, expired or unsupported dates are not candidate-safe.
- Missing eligibility rules remain UNKNOWN. Unreviewed rules require review; evidence-backed rules still do not replace a human decision.
- Six pathways remain available: higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. Sector-to-pathway mappings are routing hints, not an eligibility decision.
- Candidate-facing opportunity approval is never inferred by this helper alone. Match output always retains human review.

## Commands
- `npm run n15:sources:validate`
- `npm run n15:sources:test`
- `npm run n15:sources:check`

The validator writes `reports/n15/N15_SOURCE_INTELLIGENCE_VALIDATION.json`.

## Evidence boundary
These are deterministic policy and contract tests. They do not crawl DHET, NSFAS, CAO, SAQA, QCTO, CHE, SETAs, employers or provider portals; do not confirm a real opening/deadline; do not write to Supabase; and do not prove the production deployment. Source crawling, durable dedupe transactions, current source review and authenticated candidate journeys remain separate operational gates.
