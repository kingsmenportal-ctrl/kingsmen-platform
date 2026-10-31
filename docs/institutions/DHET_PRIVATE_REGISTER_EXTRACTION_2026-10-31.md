# DHET private-register extraction and controlled import

## Official snapshots
- Private higher education register, updated **6 July 2026**: https://www.dhet.gov.za/Registers_DocLib/Annexure%20A%20Register%20%20Private%20Higher%20Education%20Institutions%2006%20July%202026.pdf
- Private college register, updated **15 July 2026**: https://www.dhet.gov.za/Registers_DocLib/Register%20of%20Private%20Colleges%20%2015%20July%202026.pdf

The private-college register separates Section A cancelled registrations from Section B registered NC(V)/AET colleges. It does not cover all occupational/N4–N6 or SETA skills providers; those require the relevant QCTO/delegated accreditation checks. The private higher-education register distinguishes registered, provisional, cancelled and lapsed status. Never collapse those categories into one active flag.

## Reproducible extraction
Download the two exact official PDFs, then run Poppler's layout-preserving text conversion:
```sh
pdftotext -layout "Annexure A Register Private Higher Education Institutions 06 July 2026.pdf" /tmp/dhet-private-hei.txt
pdftotext -layout "Register of Private Colleges 15 July 2026.pdf" /tmp/dhet-private-colleges.txt
node scripts/institutions/extract-dhet-private-registers.mjs \
  --higher-education-text /tmp/dhet-private-hei.txt \
  --private-colleges-text /tmp/dhet-private-colleges.txt \
  --out manifests/institutions/seed/dhet-private-register-candidates-2026-10-31.json
```

The extractor creates review candidates with normalized names, registration IDs, status-section evidence, province candidates, alias candidates and bounded source excerpts. It retains raw entry text. Campus locations are explicitly marked for manual review because the PDF's multi-line address layout can otherwise incorrectly associate campuses and provinces.

## Import controls
The output is not an import authorization. Every row is `import_eligible=false`, `official_route_status=NOT_VERIFIED`, `integration_status=NOT_CONNECTED`, and `automation_authorized=false`. No SQL is generated or applied. The next migration must reconcile registration identifiers and aliases against existing canonical `route_providers.provider_key` identities, reject conflicting status/identity, merge provenance idempotently, and retain cancelled/lapsed entries as non-active historical evidence. A directory entry never proves a current intake, deadline, eligibility, live application route, partnership, submission receipt, or outcome.

Run `node scripts/validators/validate-dhet-private-register-extractor.mjs` for the contract self-test. Full extraction is only complete once the JSON generated from both official PDFs is committed with record counts and reviewed. Staging imports remain gated on protected encrypted backup, isolated restore validation, independent review and formal change approval.
