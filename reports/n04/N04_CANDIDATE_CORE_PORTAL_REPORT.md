# N04 - Candidate Core & Portal

Status: Prepared and validated.

Created:
- manifests/n04/candidate-core-portal.json
- db/migrations/0002_n04_candidate_core.sql
- db/seeds/n04_runtime_config_seed.sql
- apps/api/src/candidate/candidate-types.ts
- apps/api/src/candidate/smart-intake.ts
- apps/api/src/candidate/candidate-auth.ts
- apps/api/src/candidate/profile-review.ts
- apps/api/src/candidate/candidate-portal-read-model.ts
- apps/api/src/candidate/candidate-messages.ts
- apps/api/src/candidate/candidate-success-loop.ts
- apps/api/src/candidate/index.ts
- apps/web/src/candidate-portal/CandidatePortalShell.tsx
- apps/web/src/candidate-portal/SmartIntakeReview.tsx
- scripts/db/Run-N04Migration.ps1
- scripts/validators/Validate-N04.ps1
- reports/n04/N04_VALIDATION_RESULT.json

Also repaired:
- db/migrations/0001_n03_truth_vault.sql
  - Removed invalid CREATE POLICY IF NOT EXISTS syntax.
  - Replaced with DROP POLICY IF EXISTS + CREATE POLICY.

N04 coverage:
- Candidate identity account foundation.
- Candidate sessions and device trust.
- Smart intake prefill from CV/document-backed sources.
- Missing-field-only candidate questions.
- Candidate confirmation boundary.
- Operator approval boundary for sensitive edits.
- Candidate messages with email-first and WhatsApp urgent-only rules.
- Candidate support tickets.
- Candidate financial view foundation.
- Candidate success-loop foundation.
- Candidate portal shell.
- Smart intake review UI.

Next:
N05 - Document Vault.