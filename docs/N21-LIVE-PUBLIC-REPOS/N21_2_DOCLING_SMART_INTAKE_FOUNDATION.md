# N21.2 — Docling Smart Intake Foundation

Status: built on branch `n21-live-public-repo-adapters`  
Purpose: make candidate document smart intake real, review-safe, and ready for Docling sidecar installation.

## What this phase builds

This phase creates the Kingsmen-owned document intake foundation for public repo `DS4SD/docling`.

It does **not** claim Docling is installed.
It does **not** write candidate profile truth directly.
It does **not** send raw documents to an LLM.
It does **not** bypass Document Vault.

It adds a review-safe extraction pipeline:

```text
Document Vault record
  -> Docling/local extraction text
  -> DocumentExtractionService
  -> DocumentFieldMapper
  -> Draft candidate fields
  -> Candidate/operator review
  -> Approved profile update later
```

## New files

| File | Purpose |
|---|---|
| `apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts` | Maps extracted text into candidate draft fields with confidence and evidence snippets. |
| `apps/web/src/lib/documents/extraction/DocumentExtractionService.ts` | Review-safe extraction service. Never writes candidate truth. |
| `apps/web/src/app/api/documents/extract/route.ts` | API endpoint for draft extraction review. |
| `apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts` | Docling adapter contract and request safety checks. |

## API usage

```text
POST /api/documents/extract
```

Example body:

```json
{
  "documentId": "doc_cv_001",
  "candidateId": "candidate_001",
  "filename": "cv.pdf",
  "mimeType": "application/pdf",
  "engine": "plain_text_fallback",
  "extractedText": "Full Name: Example Candidate\nEmail: example@email.com\nPhone: 071 234 5678\nSkills: communication, computer literacy"
}
```

Expected result:

- `mode`: `candidate_draft_review`
- `fields`: extracted draft fields;
- `reviewRequired`: `true`;
- `mayWriteCandidateTruth`: `false`;
- `evidence`: extraction evidence id and warnings.

## Review boundary

Every extracted value is a **draft**.

High-confidence fields like email/phone may still be shown for confirmation.
Identity, address, qualification, school, certificates, experience, skills, and driver licence fields require review before profile truth update.

## Supported first draft fields

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

## Next phase

N21.3 should connect an actual parser sidecar/local script:

```text
Docling installed locally
  -> parse PDF/DOCX/image
  -> return extracted text/tables
  -> POST to /api/documents/extract
  -> candidate review page
```

The current phase is intentionally safe and truthful: it makes the extraction and mapping pipeline live without pretending the external parser has already been installed.
