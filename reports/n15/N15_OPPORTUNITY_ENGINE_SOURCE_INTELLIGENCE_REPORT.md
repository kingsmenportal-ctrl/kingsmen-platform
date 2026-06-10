# N15 â€” Opportunity Engine / External Source Intelligence

Status: Built and validation-ready.

N15 creates Kingsmen's verified opportunity intelligence layer.

Purpose:
- collect source observations
- classify source authorities
- track provider/programme/deadline/eligibility/fee intelligence
- route low-confidence or stale observations to review
- build evidence-backed opportunity matches
- protect Free Destiny Map sealed exact targets
- prevent fake opportunity claims

Created:
- opportunity source authorities
- external source observations
- opportunity providers
- opportunity programmes
- opportunity deadlines
- opportunity eligibility rules
- opportunity fee records
- opportunity signal queue
- opportunity verification reviews
- candidate opportunity matches
- opportunity alerts
- source intelligence runtime example
- opportunity API module
- opportunity UI panels
- N15 validator
- N15 DB migration runner

Locked doctrine:
- No fake deadlines.
- No fake links.
- No fake programme availability.
- No fake eligibility claims.
- No fake acceptance or placement guarantees.
- Every opportunity claim requires source confidence and evidence references.
- Official claims require official verified source confidence.
- Stale observations must be reviewed before candidate-facing use.
- Private colleges require CHE, DHET, SAQA, or QCTO verification before safe recommendation.
- SETA, QCTO, learnership, and employer routes require provider evidence before promotion.
- Opportunity intelligence may recommend and route; it must not submit official applications by itself.
- All sectors remain open from day one; packages control campaign weight and managed execution count.

Seeded authority anchors:
- DHET
- NSFAS
- CAO
- SAQA
- QCTO
- CHE

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N15Migration.ps1

Next:
N16 - Orchestrator / Execution Runtime.