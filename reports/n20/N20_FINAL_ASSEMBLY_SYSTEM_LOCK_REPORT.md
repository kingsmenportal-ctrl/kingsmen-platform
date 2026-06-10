# N20 â€” Final Assembly / System Lock / Production Readiness

N20 assembles the Kingsmen N00-N19 repo-materialized foundation into one locked release map.

This does **not** claim Kingsmen is live in production. It means the repository foundation is assembled, validated, and ready for controlled deployment wiring, database application, environment configuration, and final operational checks.

## Release name

Kingsmen Meta Ultra National â€” Oracle Lite Founder Release.

## Locked launch scope

- 500 active operational candidates.
- All route sectors remain open from day 1.
- Caps limit volume and throughput, not dignity, sector access, or national capability.
- Oracle Lite discipline remains the launch boundary.

## Core doctrine locked

- POSTGRES_TRUTH
- AIRTABLE_MIRROR_ONLY
- BACKEND_CONTROLS_STATE
- N8N_STATELESS_THIN_WORKERS
- EMAIL_PRIMARY
- WHATSAPP_URGENT_ONLY
- SMS_BACKUP_ONLY
- PAYFAST_PROVIDER_BOUNDARY
- NO_FAKE_STATUS
- NO_FAKE_DEADLINES
- NO_FAKE_ACCEPTANCE_CLAIMS
- NO_FAKE_PAYMENT_SUCCESS
- NO_FAKE_REFUND_DECISION
- NO_FAKE_AI_GOVERNANCE
- MAP_FALLBACK_REQUIRED
- PHOENIX_FALLBACK_CONTROLLED
- CAPS_LIMIT_VOLUME_NOT_SCOPE
- ORACLE_LITE_DISCIPLINE
- POPIA_MINIMIZATION
- FOUNDER_FINAL_AUTHORITY

## What N20 added

- Release module registry for N00-N20.
- System release locks.
- Production readiness checks.
- Launch gate decisions.
- Deployment environment registry.
- Release artifact evidence table.
- Backup/restore drill registry.
- Operational runbooks.
- Final system manifest snapshots.
- API modules for release doctrine, readiness, runbooks, deployment checklist, system map, and final read model.
- Control-plane UI panels for readiness, system lock, module map, launch gates, and founder launch brief.

## Live launch gates still closed

The repo is locked, but public launch remains closed until:

1. Database migrations are applied to the intended database.
2. Secrets are wired outside git.
3. Secret scan passes.
4. PayFast sandbox checkout/return/cancel/ITN evidence is tested.
5. Email provider test passes.
6. Backup and restore drill passes.
7. RLS/security review passes.
8. Deployment routing is connected.

## Optional database apply

```powershell
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N20Migration.ps1
```

## Future work after N20

Future work should not add useless layers. It must be one of:

- Apply database migrations.
- Wire environment variables and secrets.
- Connect UI routing.
- Add CI/build validation.
- Deploy staging.
- Configure production domain.
- Run PayFast sandbox/live transition.
- Run email provider tests.
- Run backup/restore drills.
- Tighten RLS/security policies.
- Add real source-data imports.
- Repair failed validators or broken build steps.
- Improve existing modules only where repo-materialized, validator-provable, Oracle Lite realistic, and directly useful.