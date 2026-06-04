# N07-AIRTABLE-01 — Airtable Mirror Boundary / Async Sync Doctrine / Provider Proof Gate

Creates the Airtable mirror boundary:
- PostgreSQL remains truth
- Airtable is async mirror only
- Airtable never governs candidate status, payments, outcomes, documents, source confidence, or refunds
- Airtable sync runs through queue/batch discipline
- missing Airtable credentials degrade gracefully
- provider proof gate blocks live claims without proof
- Oracle Lite/free-tier sync limits are enforced
- productionReady remains false