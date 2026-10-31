# Cross-sector institution source extension — 31 October 2026

## Purpose

Extend the canonical Kingsmen institution registry beyond education. The source extension covers public administration, municipalities, public entities/state-owned enterprises, schools and skills, health/care, employers/recruitment, funding/social support, finance/insurance, housing, transport, legal/community services, NGOs/NPOs, regulators and technology vendors.

## Implementation added in this batch

- `manifests/institutions/cross-sector-institution-source-extension.json`: 52 official or explicitly provider-specific source anchors, including the 21 SETAs individually, DHET private-college/private-HEI/CET registers, the PSET masterlist, NSFAS institution directory, NSF and Funza Lushaka, with institution classes, evidence boundaries, freshness intervals and connector state.
- `scripts/validators/validate-cross-sector-institution-source-extension.mjs`: structural and safety validator. It requires all 15 institution classes, unique source IDs, source claim boundaries, human review and `NOT_CONNECTED` defaults.
- The extension is designed to be consumed by the existing canonical registry. It explicitly prohibits a parallel registry and does not insert rows into Supabase.

## Official source examples

- South African Government / GCIS directory covers national and provincial/local government, SOEs and selected public institutions: https://www.gov.za/about-government/contact-directory
- Government national directory: https://www.gov.za/about-government/contact-directory/national-government
- Local government context: https://www.gov.za/about-government/government-system/local-government
- DHET and relevant skills authorities: https://www.dhet.gov.za/
- Department of Basic Education: https://www.education.gov.za/Programmes/EMIS.aspx
- CIPC: https://www.cipc.co.za/
- SASSA: https://www.sassa.gov.za/
- NYDA: https://www.nyda.gov.za/
- FSCA: https://www.fsca.co.za/
- Legal Aid South Africa: https://legal-aid.co.za/

These are discovery/verification anchors only. A source directory does not prove a current service, job, programme, deadline, candidate eligibility, partnership, live API, application submission or outcome.

## Release and safety boundary

All sources require review and all connectors remain `NOT_CONNECTED`. Source URLs and scope must be checked at ingestion time. Existing source-authority rows must be reconciled before insert/update to prevent duplicate authority anchors. Rows are idempotently imported into the existing registry only after independent review and approved migration/change control. The importer must record retrieval time, evidence, verifier, confidence and expiry. Stale or conflicting claims must be suppressed and queued for human review.

The proposed `0101_seed_seta_and_funding_provider_directory.sql` adds 21 SETAs and two official funding providers to the existing `route_providers` table as `NEEDS_REVIEW`, confidence D, `public_safe=false`; it never marks a provider as connected or verified. The migration is not applied to staging by this change. Private college, private higher-education and CET registers remain source anchors only pending safe structured extraction and human review.

No staging or production database mutation, provider-specific API activation, portal automation, partnership declaration, or candidate-facing availability claim is included in this source-manifest batch.
