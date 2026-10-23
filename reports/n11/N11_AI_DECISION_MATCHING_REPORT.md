# N11 â€” AI Decision / Matching Engine

Status: Built and validation-ready.

N11 creates the Kingsmen AI Decision and Matching foundation.

AI recommends and explains. It does not govern:
- money
- refunds
- official status
- official submissions
- fraud
- privacy
- hard blockers

Created:
- candidate decision signals
- eligibility screen results
- route match candidates
- placement scores
- route recommendations
- destiny maps
- Phoenix fallback plans
- AI decision events
- AI learning signals
- AI runtime config
- AI boundary policy
- route matching engine
- placement scoring engine
- recommendation explainer
- Destiny Map builder
- Phoenix fallback planner
- learning signal ledger
- Oracle Lite AI budget guard
- AI Decision UI panels
- N11 validator
- N11 migration runner

Locked doctrine:
- AI may suggest but must not govern hard decisions.
- No fake guarantees.
- No silent learning.
- No uncontrolled reinforcement learning.
- No Phoenix false rescue.
- Recommendations require evidence and source confidence.
- Free Destiny Map does not expose exact targets, application links, or manual route plans.
- Candidate success signals may improve aggregate quality only with evidence and governance.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N11Migration.ps1

Next:
N12 - Governance / Policy Runtime.

## N11 safety hardening — 2026-10-23

- Added a shared fail-closed input guard for candidate/route references, score ranges, source-confidence and portal-health enums, and evidence references.
- Integrated the guard into route matching, placement scoring, and eligibility screening.
- Added automated regression tests for valid scoring, invalid/NaN/out-of-range inputs, missing evidence, invalid enums, and AI action prohibitions.
- Added migration 0095 to enforce non-empty evidence references on all nine N11 evidence-bearing tables and require human review for recommendations not marked OFFICIAL_VERIFIED.
- Staging migration application returned success. Runtime database constraint verification and CI execution are tracked separately; this report does not claim live candidate journey verification.
- AI remains advisory only. It cannot submit official applications, approve refunds, or confirm fraud. No candidate records or official submissions were created by this batch.
