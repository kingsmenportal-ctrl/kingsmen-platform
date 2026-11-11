# Staging Launch Readiness Snapshot — 2026-10-17

Environment: Supabase staging project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
Capture method: read-only SQL aggregates and connected GitHub/Netlify metadata.  
Scope: this is a point-in-time snapshot, not a production certification.

## Marketplace and identity data

| Metric | Count |
|---|---:|
| Organisations | 0 |
| Organisation listings | 0 |
| Route programmes | 0 |
| Candidate saved listings | 0 |
| Candidate saved routes | 0 |
| Candidate route applications | 0 |
| Candidate account rows | 0 |
| Candidate account rows with Auth UUID | 0 |
| Candidate identity links | 0 |
| VERIFIED identity links | 0 |
| PENDING identity links | 0 |
| REVOKED identity links | 0 |

No fake listing, candidate, organisation, or identity-link rows were seeded. The empty staging dataset cannot demonstrate a real verified public opportunity, end-to-end candidate journey, or cross-candidate isolation. Those remain acceptance tests, not inferred passes.

## Finance and recovery data

| Metric | Count |
|---|---:|
| Finance invoices | 0 |
| Finance payments | 0 |
| Finance ledger entries | 0 |
| PayFast payment intents | 0 |
| Payment evidence ledger records | 0 |
| Backup/restore drill records | 0 |

Zero payment rows are not evidence of successful payment processing. Zero backup/restore drill rows are not evidence that backups are available or restorable. A timestamped logical backup, SHA-256 verification, isolated restore, and schema/data validation remain required before applying further schema changes or authorizing launch.

## Migration and security posture

The connected staging migration inventory is applied through migration version `20261017085438`, named `marketplace_public_dns_url_constraints_0058`. Do not reuse the legacy numeric migration slots 0056–0058. The Supabase security advisor returned zero lint findings in the inspection; this is not proof of RLS isolation or a clean performance posture.

No migration was applied during this snapshot.

## CI evidence

For commit `347c24b0a4fe505a630cb2ba87b8618608834a42`, connected GitHub Actions returned:
- Kingsmen API Build and Smoke Tests — failed.
- Kingsmen Source Guard — failed.

The connector returned completed failed jobs with empty step lists and unavailable job logs. Therefore the failing step/root cause is not evidenced here and no successful build/test is claimed. The API lockfile remains absent from the inspected main-branch manifest context; the new CI workflow was corrected to fail closed and require a committed `apps/api/package-lock.json` rather than using an unpinned install.

## Netlify reviewer access

Staging project `kingsmen-portal-staging` remains configured with SSO team login required for non-production access. No visitor-access control was weakened and no deploy was initiated. Reviewer access must be verified through the authorized team login flow.

## Release disposition

**NOT READY / NOT CERTIFIED.** Outstanding gates include:
1. Generate and review the API lockfile in a trusted network-enabled environment.
2. Obtain runner/job diagnostic evidence and pass API build, smoke tests, and source validators on the current PR head.
3. Create founder-approved, real verified listing evidence through the approved workflow.
4. Run two-authenticated-user candidate RLS integration tests with isolated synthetic fixtures.
5. Verify finance ITN signature, exact cents, idempotency, and balanced ledger behavior in PayFast sandbox.
6. Perform a timestamped logical backup and successful isolated restore with integrity checks.
7. Confirm the authorized reviewer can access the intended preview without weakening security controls.

No deployment, live payment, production mutation, migration application, or public launch is authorized by this snapshot.
