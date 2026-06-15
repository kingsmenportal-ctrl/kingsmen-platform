# N21.2 Runner Appendix

Status: committed after the main N21.2 build report.

Additional runnable proof file:

```text
scripts/validators/validate-n21-docling-smart-intake-runner.mjs
```

Purpose:

- loads `DocumentExtractionService.test-sample.json`;
- maps the sample extracted CV text into draft field keys;
- verifies expected draft keys are present;
- confirms `mayWriteCandidateTruth` remains false;
- confirms review is required;
- writes `reports/validation/n21-docling-smart-intake-runner-latest.json`.

Local command:

```powershell
node scripts/validators/validate-n21-docling-smart-intake-runner.mjs
```
