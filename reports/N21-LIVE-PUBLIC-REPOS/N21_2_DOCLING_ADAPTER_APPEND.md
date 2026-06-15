# N21.2 Docling Adapter Route Appendix

Additional live adapter wrapper files:

```text
apps/web/src/lib/public-repos/live/adapters/DoclingSmartIntakeAdapter.ts
apps/web/src/app/api/jarvis/public-repos/docling-smart-intake/route.ts
```

Purpose:

- expose Docling smart intake through the public repo adapter surface;
- call the Kingsmen-owned document extraction service;
- return candidate draft fields for review;
- keep `mayWriteCandidateTruth` false;
- keep candidate/operator review required.

Local route:

```text
GET /api/jarvis/public-repos/docling-smart-intake
POST /api/jarvis/public-repos/docling-smart-intake
```

Example POST body:

```json
{
  "documentId": "doc_cv_001",
  "candidateId": "candidate_001",
  "filename": "cv.txt",
  "mimeType": "text/plain",
  "purpose": "candidate_smart_intake",
  "engine": "plain_text_fallback",
  "extractedText": "Full Name: Example Candidate\nEmail: example@email.com\nPhone: 071 234 5678\nSkills: communication, computer literacy"
}
```

Expected safety result:

```json
{
  "adapterId": "DoclingAdapter",
  "repository": "DS4SD/docling",
  "extraction": {
    "mode": "candidate_draft_review",
    "mayWriteCandidateTruth": false,
    "reviewRequired": true
  }
}
```
