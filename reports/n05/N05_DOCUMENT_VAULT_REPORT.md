# N05 - Document Vault

Status: Prepared and validated.

Created:
- manifests/n05/document-vault.json
- db/migrations/0003_n05_document_vault.sql
- db/seeds/n05_runtime_config_seed.sql
- apps/api/src/documents/document-types.ts
- apps/api/src/documents/document-policy.ts
- apps/api/src/documents/document-readiness.ts
- apps/api/src/documents/document-request-engine.ts
- apps/api/src/documents/document-verification.ts
- apps/api/src/documents/document-fraud.ts
- apps/api/src/documents/document-extraction-bridge.ts
- apps/api/src/documents/document-storage.ts
- apps/api/src/documents/document-vault-repository.ts
- apps/api/src/documents/index.ts
- apps/web/src/document-vault/DocumentVaultPanel.tsx
- apps/web/src/document-vault/DocumentUploadChecklist.tsx
- scripts/db/Run-N05Migration.ps1
- scripts/validators/Validate-N05.ps1
- reports/n05/N05_VALIDATION_RESULT.json

Coverage:
- Candidate document records.
- Document requests with reason and priority.
- Document analysis records.
- Document verification records.
- Fraud-signal records.
- Storage event monitoring.
- Document readiness snapshots.
- Upload policy.
- MIME and size enforcement.
- Smart-intake extraction bridge.
- Candidate portal document vault panel.
- Candidate upload checklist.

Doctrine enforced:
- Documents are private by default.
- Extracted fields do not silently become trusted profile data.
- Candidate confirmation remains required.
- Sensitive conflicts require operator review.
- Fraud flags are not final decisions.
- WhatsApp document intake remains urgent-only and review-bound.

Next:
N06 - Route Universe / Application Workbench.