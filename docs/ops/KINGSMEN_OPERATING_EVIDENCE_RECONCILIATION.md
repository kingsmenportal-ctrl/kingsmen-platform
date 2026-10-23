# N13 — Operating evidence freshness reconciliation

This module reconciles the generated N00–N20 operating inventory with the contents of each declared runtime report. It does not change the canonical launch manifest or promote a module because source files exist.

## What it checks

- Distinguishes source references from runtime evidence reports.
- Marks a runtime report blocked when missing, unreadable, status-less, non-passing, timestamp-less, more than seven days old, dated in the future, not explicitly reviewed, or not explicitly redaction-confirmed.
- Reconciles each launch gate independently and records exact blocker reasons.
- Writes `reports/architecture/kingsmen-operating-evidence-reconciliation-latest.json`.
- Never opens the launch gate. The canonical `npm run kingsmen:launch:gate` remains authoritative.

A report must include a recognized passing status (for example `status: "PASS"`), a valid recent timestamp, an explicit review boolean, and an explicit redaction boolean. A file's presence, a source validator, or a declared module status is not sufficient.

## Run and test

```bash
npm run kingsmen:inventory
node scripts/staging/test-kingsmen-operating-evidence-reconciliation.mjs
npm run kingsmen:launch:audit
```

The report is expected to show blockers while real staging evidence is absent. That is a correct fail-closed result, not a test failure. Runtime proof must be captured by the relevant module's actual staging procedure and reviewed before the canonical launch gate can pass.
