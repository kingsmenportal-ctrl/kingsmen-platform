# N21.2 Limitations

This build did not install Docling itself.

This build did not parse binary PDF/DOCX files directly inside the web app.

This build did not write candidate profile truth.

This build did not create the candidate review UI yet.

What it did create:

- the review-safe extraction service;
- the draft field mapper;
- the API surface;
- the Docling adapter contract;
- the Jarvis-facing adapter wrapper;
- validators and examples;
- documentation and status records.

Next required implementation for real file parsing:

- local Docling sidecar or parser script;
- file upload handoff from Document Vault to parser;
- parser output handoff into `/api/documents/extract`;
- candidate/operator review screen.
