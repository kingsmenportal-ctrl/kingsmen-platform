# Kingsmen Staging Runtime Proof Pack

Production ready: **false**  
Public launch allowed: **false**  
Status: `foundation_built_pending_staging_evidence_capture`  
Validator token: Staging runtime proof pack

This pack collects the remaining staging evidence required before Kingsmen can move from source-ready to runtime-proven.

## What this pack proves at source level

The source-level pack proves that every required staging evidence report is named, guarded, and launch-gated.

Run:

```bash
npm run staging:prove:pack
npm run staging:validate:pack
```

These commands do not prove live runtime safety. They only prove the pack exists and is connected to the launch gate.

## Required staging evidence reports

The runtime pack requires these redacted evidence files:

```txt
reports/staging/truth-vault-persistence-staging-latest.json
reports/staging/web-backend-boundary-staging-latest.json
reports/staging/rls-sql-isolation-staging-latest.json
reports/staging/payfast-provider-sandbox-staging-latest.json
reports/staging/backup-restore-drill-staging-latest.json
reports/security/secrets-wiring-runtime-health-latest.json
reports/staging/communications-provider-staging-latest.json
reports/staging/observability-incident-staging-latest.json
reports/staging/legal-privacy-publication-staging-latest.json
reports/repo/main-branch-protection-apply-latest.json
```

## Evidence redaction rule

Reports may include:

```txt
pass/fail
timestamp
environment label
hashes
counts
correlationId
redacted internal ids
```

Reports must not include:

```txt
database URLs
provider tokens
secret prefixes
private keys
raw candidate names
raw candidate contact details
document contents
payment card data
provider passphrases
```

## Required runtime proofs

1. **Truth Vault persistence staging proof**  
   API writes command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ records to staging PostgreSQL/Supabase.

2. **Web/backend boundary staging proof**  
   Web routes call backend API only with `KINGSMEN_BACKEND_BASE_URL` configured.

3. **RLS SQL isolation proof**  
   Candidate A cannot read Candidate B, anonymous cannot read candidate data, candidate cannot read protected evidence, and backend service role requires backend context.

4. **PayFast provider sandbox proof**  
   Sandbox checkout, return/cancel, ITN success, failed payment, duplicate ITN, invalid signature, replay, amount mismatch, refund human-review, and redaction evidence.

5. **Backup/restore drill proof**  
   Backup checksum, restore target/source separation, counts-only verification, RPO/RTO, and redaction proof.

6. **Secrets runtime health proof**  
   Real env vars configured outside Git with masked status-only report.

7. **Communications provider staging proof**  
   Email send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, and redacted evidence.

8. **Observability/incident staging proof**  
   API health, database health, queue/DLQ, structured logs, alerts, SEV drill, founder escalation, and log redaction proof.

9. **Legal/privacy publication proof**  
   Published Terms, Privacy Notice, Consent Notice, Refund and Payment Policy, Data Subject Request Path, founder/legal review, consent timestamp/policy version, and refund display proof.

10. **Branch protection applied proof**  
     GitHub `main` protection active with `source-guard` required, deletion/force-push disabled, PR review required, and admins included.

## Final assembly rule

Do not change final assembly checks from pending to passed until the matching runtime evidence file exists and has been reviewed.
