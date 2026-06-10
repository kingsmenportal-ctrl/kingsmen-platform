# N06 - Route Universe / Application Workbench

Status: Prepared and validated.

Created:
- manifests/n06/route-universe-workbench.json
- db/migrations/0004_n06_route_universe.sql
- db/seeds/n06_route_universe_seed.sql
- apps/api/src/routes/route-types.ts
- apps/api/src/routes/source-confidence.ts
- apps/api/src/routes/portal-health.ts
- apps/api/src/routes/route-readiness.ts
- apps/api/src/routes/application-workbench.ts
- apps/api/src/routes/cao-boundary.ts
- apps/api/src/routes/nsfas-support.ts
- apps/api/src/routes/map-fallback.ts
- apps/api/src/routes/route-universe-repository.ts
- apps/api/src/routes/index.ts
- apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx
- apps/web/src/application-workbench/RouteReadinessPanel.tsx
- scripts/db/Run-N06Migration.ps1
- scripts/validators/Validate-N06.ps1
- reports/n06/N06_VALIDATION_RESULT.json

Coverage:
- Route categories.
- Route providers.
- Route programmes.
- Route requirements.
- Route deadlines.
- Route fees.
- Portal DNA.
- Portal health checks.
- Application workbench items.
- Route readiness snapshots.
- CAO child choices.
- NSFAS support cases.
- Manual Application Package fallback.
- Source confidence engine.
- Portal health engine.
- Route readiness engine.
- CAO boundary.
- NSFAS no-guarantee boundary.
- Application workbench UI.
- Route readiness UI.

Doctrine enforced:
- All national sectors remain open from day one.
- Caps limit volume, not capability.
- Source confidence required for candidate-facing route facts.
- CAO is one Kingsmen application with internal child choices.
- NSFAS support is not a funding approval guarantee.
- OTP/CAPTCHA/down/manual-only portals route to MAP fallback.
- Private provider accreditation check is required.
- No fake links, fake deadlines, fake requirements, or fake acceptance claims.

Seed source anchors:
- South African Government education overview.
- DHET universities page.
- CAO official portal.
- NSFAS how-to-apply page.
- SAQA, CHE, and QCTO authority anchors.

Next:
N07 - Airtable Sync.