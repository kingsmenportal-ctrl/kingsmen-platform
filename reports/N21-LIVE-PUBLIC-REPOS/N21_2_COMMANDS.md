# N21.2 Local Commands

```powershell
git checkout n21-live-public-repo-adapters
cd apps\web
npm run dev
```

Open:

```text
http://127.0.0.1:3000/api/documents/extract
http://127.0.0.1:3000/api/jarvis/public-repos/docling-smart-intake
```

Validators from repo root:

```powershell
node scripts/validators/validate-n21-live-public-repos.mjs
node scripts/validators/validate-n21-docling-smart-intake.mjs
node scripts/validators/validate-n21-docling-smart-intake-sample.mjs
node scripts/validators/validate-n21-docling-smart-intake-runner.mjs
node scripts/validators/validate-n21-docling-adapter-route.mjs
node scripts/validators/validate-n21-docling-adapter-route-exports.mjs
```
