# N21.2 Validation Required

The files are committed to GitHub.

Local execution still needs to be run on the founder machine:

```powershell
node scripts/validators/validate-n21-docling-smart-intake.mjs
node scripts/validators/validate-n21-docling-smart-intake-sample.mjs
node scripts/validators/validate-n21-docling-smart-intake-runner.mjs
node scripts/validators/validate-n21-docling-adapter-route.mjs
node scripts/validators/validate-n21-docling-adapter-route-exports.mjs
```

After validation passes, continue to N21.3 Playwright Scout Gateway.
