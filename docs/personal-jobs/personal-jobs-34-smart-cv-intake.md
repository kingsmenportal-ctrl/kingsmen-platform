# PJ34 — Smart CV Intake / Autofill

Kingsmen Apply Desk must not force the candidate to retype information already present in their CV and documents.

## Built behaviour

- Upload CV/documents first.
- The local API stores the document under `data/personal-job-desk/uploads`.
- Text is extracted from TXT/MD/CSV/JSON, DOCX and PDF where possible.
- Kingsmen extracts candidate profile hints:
  - full name
  - ID/passport where visible
  - phone
  - email
  - location
  - highest education
  - skills
  - work experience
- Extracted fields fill only blank profile fields.
- User must still review and correct before applying.
- Kingsmen must not invent qualifications, work history, certificates, references or outcomes.

## Reality boundary

This is smart intake, not fraud automation. OCR for scanned image-only PDFs or photos is not guaranteed in this local build. If a document cannot be read, the system stores it and asks the user to type the missing fields.