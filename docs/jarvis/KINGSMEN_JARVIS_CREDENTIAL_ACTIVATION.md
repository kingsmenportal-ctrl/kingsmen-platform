# Kingsmen + Jarvis Credential Activation Layer

Jarvis may help Kingsmen activate real providers, but Jarvis is **not** a secret store.

## Rule

Raw credentials must never be committed to Git, pasted into source files, copied into evidence reports, or printed in full terminal output.

Jarvis may only:

1. inventory which credentials are required;
2. reject placeholders such as `...`, `changeme`, `your_value_here`, `example.com`, `REAL_VALUE`, `REAL_BUCKET`, `dummy_*`, or `fake_*`;
3. confirm whether a credential is present in the current process environment;
4. write redacted readiness evidence;
5. tell the operator which staging proof can run next;
6. build a module activation matrix that combines credential readiness with Kingsmen evidence reports.

Jarvis may not:

1. store raw provider credentials;
2. make up provider credentials;
3. mark PayFast, SMTP, storage, Redis, or PostgreSQL live without a real runtime proof;
4. bypass founder approval for production-risk activation;
5. bypass CAPTCHA, OTP, RLS, PayFast ITN, or branch protection gates.

## Credential surfaces

The activation layer covers these Kingsmen modules:

| Module | Main variables | Live status rule |
|---|---|---|
| Truth Vault | `KINGSMEN_DATABASE_URL`, `DATABASE_URL` | Must be present, non-placeholder, and runtime proof must pass. |
| Queue Fabric | `REDIS_URL` | Must be present, non-placeholder, and observability queue/DLQ proof must pass. |
| Web/API Boundary | `KINGSMEN_BACKEND_BASE_URL` | Must be present and backend smoke proof must pass. |
| Communications | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | Must be present and provider staging proof must pass. |
| Payments | `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_NOTIFY_URL`, `PAYMENT_PROVIDER_SECRET` | Must be present and real PayFast sandbox ITN proof must pass. |
| Document Vault | `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` | Must be present and storage/document proof must pass before real document upload. |

## Commands

Scan current process credentials without printing raw values:

```powershell
npm run jarvis:credentials:scan
```

Build the Jarvis module activation matrix:

```powershell
npm run jarvis:activation:matrix
```

Run full Jarvis validation:

```powershell
npm run jarvis:validate
```

## Evidence

Readiness scan report:

```text
reports/jarvis/jarvis-credential-readiness-latest.json
```

Module activation matrix:

```text
reports/jarvis/jarvis-module-activation-matrix-latest.json
```

Document Vault storage proof:

```text
reports/staging/document-vault-storage-staging-latest.json
```

All reports must remain redacted.

## Activation matrix statuses

| Status | Meaning |
|---|---|
| `BLOCKED_CREDENTIALS` | Required environment values are missing or placeholders. |
| `BLOCKED_STAGING_EVIDENCE` | Credentials may be ready, but runtime proof is still missing or failed. |
| `BLOCKED_FOUNDER_REVIEW` | Evidence exists but was not reviewed. |
| `BLOCKED_REDACTION` | Evidence exists but redaction was not proven. |
| `READY_FOR_LIVE_AFTER_APPROVAL` | Credentials and evidence are ready; founder approval is still required before production-risk activation. |

## Activation sequence

1. Operator adds credentials outside Git: local process environment, Oracle environment, GitHub secrets where appropriate, or vault/KMS later.
2. Run `npm run jarvis:credentials:scan`.
3. Replace any `PLACEHOLDER_REJECTED` or missing values.
4. Run the module-specific staging proof.
5. Run `npm run final:collect:evidence`.
6. Run `npm run jarvis:activation:matrix`.
7. Founder approves production-risk activation.

## Dummy value rejection

Values such as `REAL_VALUE`, `REAL_BUCKET`, `REAL_SECRET`, `REAL_KEY`, `REAL_TOKEN`, `dummy_*`, and `fake_*` are treated as placeholders. They must never create a passed staging proof or a ready activation matrix state.

Use actual provider-issued values only in the current process environment, Oracle environment, GitHub secrets, or future vault/KMS.

## Document Vault storage staging proof

Do not enable real candidate document upload just because storage credentials exist. Document Vault also needs a redacted staging proof that confirms:

1. storage credentials are configured outside Git;
2. bucket access was tested;
3. upload, download, and delete smoke test was completed;
4. access-control rules were reviewed;
5. file type, file size, retention, and deletion policy were reviewed;
6. malware-scan boundary was reviewed;
7. founder review was marked.

Run only after setting real storage values in the current process environment:

```powershell
npm run document-vault:staging -- `
  -MarkProviderConfigured `
  -MarkBucketAccessTested `
  -MarkUploadDownloadDeleteTested `
  -MarkAccessControlReviewed `
  -MarkFilePolicyReviewed `
  -MarkMalwareScanBoundaryReviewed `
  -MarkFounderReviewed
```

Then rebuild the Jarvis activation matrix:

```powershell
npm run jarvis:credentials:scan
npm run jarvis:activation:matrix
```

Jarvis can coordinate the above sequence, but Kingsmen launch gates remain the authority.
