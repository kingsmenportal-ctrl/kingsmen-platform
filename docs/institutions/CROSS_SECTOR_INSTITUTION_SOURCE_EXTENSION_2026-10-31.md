# Cross-sector institution source extension — 31 October 2026

## Purpose

Extend the canonical Kingsmen institution registry beyond education. The source extension covers public administration, municipalities, public entities/state-owned enterprises, schools and skills, health/care, employers/recruitment, funding/social support, finance/insurance, housing, transport, legal/community services, NGOs/NPOs, regulators and technology vendors.

## Implementation added in this batch

- `manifests/institutions/cross-sector-institution-source-extension.json`: 52 official or explicitly provider-specific source anchors, including the 21 SETAs individually, DHET private-college/private-HEI/CET registers, the PSET masterlist, NSFAS institution directory, NSF and Funza Lushaka, plus the GCIS directory and nine major public employers and all 123 individually linked GCIS public-entity profiles, the municipality and Treasury registers, the DBE LURITS school masterlist, the National Health Department MHFL source, and NSFAS accommodation, with institution classes, evidence boundaries, freshness intervals and connector state.
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

The proposed `0101_seed_seta_and_funding_provider_directory.sql` adds 21 SETAs and two official funding providers to the existing `route_providers` table as `NEEDS_REVIEW`, confidence D, `public_safe=false`; it never marks a provider as connected or verified. The proposed `0102_seed_gcis_public_employer_directory.sql` adds nine major GCIS-listed public employers with the same review-only boundaries. The proposed `0104_seed_nsfas_accommodation_portal_provider.sql` registers the official NSFAS accommodation platform as a non-public, review-only source route, without importing bed inventory or claiming Kingsmen submission authority. None of these migrations is applied to staging by this change. The GCIS source directory lists 123 public institutions/SOEs; the nine individual employer records are a first batch, not a complete import of those 123 entities. Private college, private higher-education and CET registers remain source anchors only pending safe structured extraction and human review.

The candidate directory links the official NSFAS accommodation listings portal as an external provider journey. Candidates may proceed on the official portal; Kingsmen has not been authorised to submit, reserve beds, accept leases, or confirm placements on their behalf.

No staging or production database mutation, provider-specific API activation, portal automation, partnership declaration, or candidate-facing availability claim is included in this source-manifest batch.


## Reusable application preparation packet — 31 October 2026

- Proposed migration `0103_candidate_application_packet_preparation.sql` adds private candidate application packets and a join table for selected Document Vault references. It reuses the existing candidate identity, consent, master application target and private document records; it does not create another candidate profile or another application workflow.
- The Edge action `prepare_application_packet` requires a verified candidate identity link and active `PROFILE_PROCESSING` consent. It copies only the allowed existing profile fields into a candidate-owned snapshot and validates document IDs against the same candidate's private Document Vault. Binary files and storage paths are not copied or returned.
- Packets remain `PROVIDER_REQUIREMENTS_PENDING`, `NO_VERIFIED_PROVIDER_TEMPLATE`, `NOT_VERIFIED`, `NOT_CONNECTED`, with provider submission and provider receipt explicitly false. Only a later, independently verified provider-specific template/route and authorised submission adapter could advance beyond generic preparation.
- Candidate workbench adds application-specific answer fields and a Document Vault selection step. A refresh reloads persisted packet state; candidate-entered unsaved packet fields are preserved during tracker reloads. The UI directs candidates to the same Document Vault and application tracker.
- Migration 0103 is proposed only. It has not been applied to staging, and no candidate packet has been persisted in the staging database by this batch.


## GCIS 123-profile reconciliation and import — 31 October 2026

- The current official GCIS public-entity list states that it contains 123 organisations. Kingsmen's source manifest now contains 123 distinct individual GCIS profile URLs and 123 unique canonical provider keys, including existing employer and SETA identities that are reused rather than duplicated.
- Proposed migration `0105_seed_gcis_public_entity_profiles.sql` imports those 123 provider identities into the existing `route_providers` table. It uses `ON CONFLICT DO NOTHING` so existing provider and reviewer states are not overwritten. Newly inserted records are confidence D, `NEEDS_REVIEW`, `public_safe=false`; vacancies/programmes/intake/eligibility and application routes remain unknown or unverified; partnership, integration, automation, submission and receipt are explicitly false/not connected.
- The candidate institution directory maps public-entity provider records to the Employment pathway for application planning. It does not claim that a vacancy is currently open or that the organisation accepts Kingsmen submissions.
- The migration and a dedicated validator are included in `npm test`. This import remains proposed; Supabase staging still needs independent review and authorized migration application before provider rows become live.


## DPSA and private-sector employer portals — 31 October 2026

- The source manifest now also includes the official DPSA Public Service Vacancy Circular and ten major private-employer careers destinations: Pepkor Group (including PEP/Ackermans brands), Sasol, Woolworths, Mr Price Group, Vodafone/Vodacom, PepsiCo South Africa, Nedbank, Clicks Group, TFG and Standard Bank.
- Proposed migration `0106_seed_dpsa_and_private_employer_career_providers.sql` imports these 11 sources into the existing provider registry as confidence D, `NEEDS_REVIEW`, `public_safe=false`, `NOT_CONNECTED`; it never seeds a live vacancy or claims a Kingsmen submission/receipt. Candidate directory cards map them to the Employment pathway and the existing one-workbench planning action.
- DPSA's official circular instructs candidates to use the Z83 form, quote the vacancy reference, attach the required CV/qualifications and send the application to the department advertising the post. Kingsmen can help prepare the candidate packet and direct them to the correct department; the department's advert controls the actual submission destination and deadline.
- The private employer career portals are direct external destinations. Kingsmen has no authorised credentials, API or portal automation for those organisations in this batch. The candidate must complete the final external application and keep the provider acknowledgement; Kingsmen must not mark it submitted or received without evidence.
- A dedicated migration validator is included in `npm test`. Migration 0106 is proposed only and has not been applied to staging.
