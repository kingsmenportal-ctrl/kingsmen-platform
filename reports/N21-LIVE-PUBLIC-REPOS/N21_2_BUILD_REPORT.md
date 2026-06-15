# N21.2 Build Report — Docling Smart Intake Foundation

Branch: `n21-live-public-repo-adapters`  
Status: committed  
Result: Kingsmen now has a live review-safe smart-intake foundation for document text extracted by Docling or a fallback extractor.

## Built files

1. `apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts`
2. `apps/web/src/lib/documents/extraction/DocumentExtractionService.ts`
3. `apps/web/src/app/api/documents/extract/route.ts`
4. `apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts`
5. `apps/web/src/lib/documents/extraction/DocumentExtractionService.test-sample.json`
6. `docs/N21-LIVE-PUBLIC-REPOS/N21_2_DOCLING_SMART_INTAKE_FOUNDATION.md`
7. `scripts/validators/validate-n21-docling-smart-intake.mjs`
8. `scripts/validators/validate-n21-docling-smart-intake-sample.mjs`
9. `docs/N21-LIVE-PUBLIC-REPOS/N21_3_NEXT_PLAYWRIGHT_SCOUT_GATEWAY.md`

## What is live

- POST endpoint: `/api/documents/extract`
- Field mapper: converts extracted document text into candidate draft fields.
- Service: returns draft fields, warnings, review flags, and evidence id.
- Safety: `mayWriteCandidateTruth` is always `false`.
- Contract: Docling adapter contract exists for sidecar/local parser wiring.
- Validators: repo checks for required files, content, sample payload, and safety boundaries.

## Fields supported

- full name;
- South African ID-like number;
- phone number;
- email address;
- address;
- highest qualification;
- school name;
- work experience;
- skills;
- certificates/training;
- driver licence.

## Safety result

This phase does not pretend Docling is installed. It makes the Kingsmen-owned review pipeline live first. Docling can now be connected as a sidecar/local parser in the next document phase without allowing raw external code to write candidate truth.

## Next build

N21.3 — Playwright Scout Gateway.
