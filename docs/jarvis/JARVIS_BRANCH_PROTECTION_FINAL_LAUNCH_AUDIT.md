# Jarvis Branch Protection Final Launch Audit Gate

## Status

Source gate built. Real security evidence not accepted yet.

## Purpose

This gate controls the final live-launch security boundary for Jarvis.

Jarvis may not be called production-ready until the following evidence exists:

- Main branch protection.
- Required PR reviews.
- Required build and validator checks.
- Rollback procedure and restore evidence.
- Final staging evidence pack.
- Final launch audit.
- Founder launch approval.

## Route

```text
/api/jarvis/branch-protection-final-launch-audit
```

## Founder page

```text
/founder/launch-control/jarvis-branch-final-audit
```

## Validation

```powershell
node scripts\validators\validate-jarvis-branch-protection-final-launch-audit.mjs
```

Expected result:

```text
JARVIS_BRANCH_PROTECTION_FINAL_LAUNCH_AUDIT_SOURCE_VALIDATED
productionReady: false
publicLaunchAllowed: false
```

## Rejection rules

Reject launch when:

- Main branch can be pushed without review.
- Force push is allowed.
- Required checks are missing.
- Rollback evidence is absent.
- Final staging evidence pack is missing or unredacted.
- Founder launch approval is absent.
- Any live proof gate remains blocked or pending.

## Doctrine

This gate does not replace runtime/provider proof. It is the final release control after Docker/API/Truth Vault, AI, Email, PayFast, n8n, Airtable, and GitHub proof gates are accepted.
