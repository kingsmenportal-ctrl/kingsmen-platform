# Jarvis Branch Final Audit Evidence Capture

Status: source-ready. Not production-ready. Public launch remains blocked.

Runner:

```powershell
node scripts\proof\capture-jarvis-branch-protection-final-launch-audit-evidence.mjs
```

Report:

```text
reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json
```

Required accepted evidence files:

```text
reports/jarvis/jarvis-main-branch-protection-evidence.accepted.json
reports/jarvis/jarvis-rollback-release-evidence.accepted.json
reports/jarvis/jarvis-final-staging-evidence-pack.accepted.json
reports/jarvis/jarvis-final-launch-audit-evidence.accepted.json
reports/jarvis/jarvis-founder-launch-approval.accepted.json
```

Validator:

```powershell
node scripts\validators\validate-jarvis-branch-protection-final-launch-audit-evidence-capture.mjs
```

Expected validation status:

```text
JARVIS_BRANCH_FINAL_AUDIT_EVIDENCE_CAPTURE_SOURCE_VALIDATED
```
