# Kingsmen Launch Readiness

This document is the real finish-line map for launching Kingsmen. It is intentionally strict: a module can be architecturally present in the repo and still be blocked from public launch until its runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has strong doctrine, contracts, migrations, module manifests, validators, and local proof surfaces. It is not yet safe to open to public candidates because several runtime gates still need evidence.

## How far from launch

| Launch stage | Status | Meaning |
|---|---|---|
| Architecture / doctrine | Mostly complete | N00-N20 concepts and rules are represented in repo files. |
| Database schema | Partially complete | Truth Vault migration exists, but production RLS/security tests are still required. |
| Backend API | Partially complete | API contracts and boundaries exist, but the backend is not yet a complete deployable runtime. |
| Web / control plane | Partially complete | Next app exists, but some API routes still depend on local Windows shell commands. |
| Payments | Blocked | PayFast sandbox and ITN evidence are required before taking money. |
| Communications | Manual required | Email primary and WhatsApp urgent-only doctrine exists; provider proof is still needed. |
| Workflow execution | Partial | Workflow codes and state machine exist; deployed n8n/worker callback proof is still required. |
| Observability | Partial | Audit/evidence patterns exist; live monitoring, DLQ review, and incident SOP need proof. |
| Production operations | Blocked | Branch protection, secrets, backup/restore, and launch runbook are required. |

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** The repository currently warns that the main branch is not protected. Public launch needs branch protection with required validators.
2. **Materialize deployable backend runtime.** `apps/api/src/index.ts` exports modules, but `apps/api/package.json` is not present yet. Add a real API runtime entrypoint and deploy command.
3. **Replace Truth Vault repository stubs with real persistence.** `TruthVaultRepository` currently prepares write results; it does not persist records to PostgreSQL/Supabase.
4. **Lock RLS/security boundaries.** The current migration enables RLS but uses broad service-role `FOR ALL USING (true)` policies. Production needs scoped tests and public/user policies.
5. **Remove public web dependency on local PowerShell and Windows paths.** Web API routes must not shell out to `powershell`, `psql.exe`, or `C:\Kingsmen` in public deployment.
6. **Prove PayFast sandbox + ITN.** No real payments until sandbox success/cancel/return/failure/duplicate/invalid-signature/replay evidence exists.
7. **Prove backup and restore.** No production personal data until a restore drill is completed.
8. **Wire secrets outside git.** No live keys in repo, chat, logs, screenshots, reports, or package artifacts.
9. **Publish privacy, consent, terms, and refund policy.** This is required before collecting personal data and money.

### P1 — Must be fixed before paid pilot

1. Add backend API health route and command intake route backed by PostgreSQL writes.
2. Add workflow result endpoint with idempotency, correlation ID, state transition check, and evidence ledger write.
3. Add real email provider send proof and bounce/failure handling.
4. Add founder/operator dashboard that reads from backend read models, not local shell commands.
5. Add DLQ review and incident workflow.
6. Add staging deploy proof for web + API + database.

### P2 — Must be fixed before scaling

1. Publish internal packages only after strict `files` whitelists and package dry runs.
2. Add SDK package for web/control-plane/workers.
3. Add load tests under the 500 active-candidate cap.
4. Add tenant-scoped founder console views.
5. Add automated regression tests for N00-N20 invariants.

## Launch command

Run this for a report without failing the shell:

```bash
npm run kingsmen:launch:audit
```

Run this as a boot-blocker before release:

```bash
npm run kingsmen:launch:gate
```

The gate must remain blocked until the P0 launch blockers are fixed and evidenced.

## Launch phases

1. **Repo lock:** protect main, require validators, stop accidental package/release mistakes.
2. **Staging runtime:** run API + web + PostgreSQL/Supabase + internal command flow.
3. **Founder private beta:** process a small number of real test candidates manually with evidence.
4. **Paid pilot:** only after PayFast, refunds, support, backup/restore, and incident response pass.
5. **Public launch:** only after every required launch gate opens.
