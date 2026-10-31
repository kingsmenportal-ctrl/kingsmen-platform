# N15 current-opportunity freshness closeout

## Current staging evidence (read-only, 2026-10-31)

The audit found:
- 3 route-provider directory records and 8 route-programme records.
- 0 route programmes marked OPEN; 6 are CLOSED with 2026-10-30 closing dates and 2 remain route anchors requiring manual availability checks.
- 0 N15 opportunity providers, 0 opportunity programmes, 0 verified source observations, 0 candidate matches and 0 opportunity deadlines.

The machine-readable snapshot is `reports/n15/N15_STAGING_OPPORTUNITY_FRESHNESS_AUDIT_2026-10-31.json`. It is an audit snapshot, not proof that no opportunities exist nationally.

## Operator diagnostic

Run `db/diagnostics/n15_opportunity_freshness_audit.sql` as a read-only query. It emits a summary row and record-level findings for unsafe open records, stale/expired verified observations, missing official evidence, invalid timestamps and unsafe approved candidate matches. The query contains SELECT statements only.

## Candidate-facing contract

The current candidate feed requires an authenticated candidate with an authorised verified identity link, an approved human-reviewed match, a candidate-safe OPEN programme, an officially verified and safe provider, HTTPS exact link, evidence on programme/provider/observation, source freshness within 24 hours, consistent non-future timestamps, and an evidenced future deadline if one is claimed. The ingestion function only creates review-needed observations; it must never create a published/open opportunity directly.

## Remaining work

1. Individually verify current official sources across all six pathways.
2. Populate the canonical N15 provider/programme/observation/deadline data through reviewed imports.
3. Add source-specific parsers and idempotent ingestion with retry/dead-letter and evidence provenance.
4. Run authenticated Candidate A/B isolation and feed tests against actual staging identities.
5. Capture the exact deployed Netlify commit and prove the live candidate feed end-to-end.

No staging write or migration was performed during this audit. Do not bypass the protected backup/restore, independent review, or formal approval gates.
