# N06 Repair - MAP Fallback Validation

Status: Prepared.

Reason:
- The N06 build created the Route Universe / Application Workbench files and pushed commit `2123ee2`.
- The N06 validator failed because `apps/api/src/routes/map-fallback.ts` did not contain the exact marker text `Manual Application Package`.
- This repair adds the explicit `MAP_FALLBACK_LABEL = "Manual Application Package"` constant and keeps the MAP fallback function intact.

Files repaired:
- apps/api/src/routes/map-fallback.ts

Validation expected:
- scripts/validators/Validate-N06.ps1 should pass.
- KINGSMEN_CREATOR.ps1 -Phase N06 -Mode Validate should pass.

Doctrine preserved:
- OTP, CAPTCHA, portal-down, manual-only, and source-review failures still route to MAP.
- MAP is a manual fallback package, not an automated bypass.
- No fake route submission or portal bypass is introduced.