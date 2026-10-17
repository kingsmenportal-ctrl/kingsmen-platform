# N00–N20 Evidence-Backed Module Register

**Status:** Initial source inventory; not a validation report.  
**Production ready:** **No**.  
**Companion manifest:** `manifests/architecture/kingsmen-n00-n20-evidence-register.json`

## Purpose

This register starts the next step after the N00–N20 architecture baseline: map each module to repository evidence, routes, validators, blockers, and the next safe action. Unknowns are left explicitly empty or marked unverified instead of guessed.

## Evidence rules

- A listed source path proves only that source is tracked at the referenced repository revision.
- `implemented_unverified` is not a passing test, successful provider integration, or deployed runtime.
- `validated` requires a reproducible validator/test result tied to a commit and environment.
- `production_approved` requires the full target-environment evidence and authorised release approval.
- Never put secret values, personal data, or unredacted provider payloads in this register.
- `productionReady` remains false until N20 evidence gates are met.

## Current evidence-derived blockers

1. **N02/N03 — Truth Vault:** the repository README states that the API storage mode is `memory_development_only`; durable PostgreSQL/Supabase persistence and staging proof are still required.
2. **N05 — Document Vault:** source paths exist, but the previous staging bucket size mismatch, missing runtime service-role configuration, and failed/unverified CI are unresolved in the available context. Authenticated two-candidate upload, private storage, persistence, owner denial, and audit sequence must be proven. Signature validation is not malware scanning; scanning/quarantine and orphan reconciliation remain separate gates.
3. **N10 — Finance:** real PayFast sandbox evidence for success, failure, duplicate, invalid signature, replay, amount mismatch and refund review is required before live payments.
4. **N13 — Operations:** staging health/log/queue/alert/incident and backup/restore evidence remains required.
5. **N20 — Release:** public launch is blocked until the redacted staging runtime proof pack and final assembly evidence bundle are complete and reviewed.

## Register coverage

All 21 identifiers N00–N20 are represented. The machine-readable file contains consistent fields for responsibility, non-responsibilities, dependencies, source paths, routes, migrations, adapters, commands/events, state transitions, idempotency, policy gates, permissions, data classification, audit, validators/tests, latest verification, environment, observability, reconciliation, blockers, next action, release impact, evidence links and last-verified timestamp.

Empty arrays and `null` timestamps mean **not yet inventoried or evidenced**, not “none exist.” The next implementation increment should fill these from actual source/schema/test files and attach dated validator/runtime results, starting with the release-blocking N02/N03/N05/N10/N13/N20 items.

## Status summary

- `defined`: architecture boundary recorded, implementation mapping incomplete.
- `implemented_unverified`: some repository source/docs are identified, but current runtime evidence is not established here.
- `blocked`: known release-critical evidence is outstanding.
- No module is marked `validated` or `production_approved` by this batch.
