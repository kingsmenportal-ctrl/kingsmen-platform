# Document Extraction Smart Intake

This folder contains the Kingsmen-owned review-safe document extraction foundation.

## Main flow

```text
extracted text from Docling or fallback parser
  -> DocumentExtractionService
  -> DocumentFieldMapper
  -> candidate draft review fields
  -> candidate/operator confirmation later
```

## Safety rule

`mayWriteCandidateTruth` must remain false in this layer.

This layer prepares review fields only. It does not update candidate profile truth.
