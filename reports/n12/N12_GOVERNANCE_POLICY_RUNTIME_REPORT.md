# N12 â€” Governance / Policy Runtime

Status: Built and validation-ready.

N12 creates Kingsmen governance as a real runtime layer, not a cosmetic layer.

Purpose:
- evaluate policy gates before dangerous actions
- preserve backend state-machine authority
- enforce AI hard boundaries
- enforce POPIA privacy boundaries
- enforce source confidence
- control official submissions
- control refunds
- control fraud-review boundaries
- prevent silent override
- prevent Phoenix false rescue
- prevent growth-cap increase without quality evidence
- create audit/evidence trails

Created:
- governance runtime manifest
- governance SQL migration
- governance seed config and policies
- non-secret runtime example
- policy registry
- policy gate engine
- state-machine governance
- AI governance guard
- official submission policy
- finance/refund policy
- POPIA privacy policy
- source-confidence governance
- human override policy
- growth-cap governance
- governance audit helper
- governance read model
- governance UI panels
- N12 validator
- N12 migration runner

Locked doctrine:
- Backend state machine controls flow.
- AI may suggest but must not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.
- No silent override.
- No proofless success claims.
- No fake guarantees.
- No Phoenix false rescue.
- No growth cap increase without outcome-quality evidence.
- No official submission without permitted state, evidence, and human/operator approval when required.
- No refund decision without finance boundary and human/operator approval.
- No privacy-sensitive action without POPIA lawful basis, consent or operator approval.
- Source confidence must be attached to official claims and route recommendations.
- All policy decisions must create audit/evidence records.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N12Migration.ps1

Next:
N13 - Observability / Reports / Incident Runtime.