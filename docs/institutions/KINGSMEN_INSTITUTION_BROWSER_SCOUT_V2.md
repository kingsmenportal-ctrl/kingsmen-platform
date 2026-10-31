# Kingsmen Institution Browser Scout v2

This is the executable public-source probe extension to the existing Jarvis Browser Scout, not a replacement application platform. It preserves one candidate identity, one canonical profile and the existing Application Workbench.

## Operating boundary

The tool remains TRUST_2_DRY_RUN with LEVEL_3_TEST_VALIDATE ceiling, no candidate-data capability and no secret capability. The worker uses a fresh browser context for each target, an explicit HTTPS host allowlist, GET-only network policy, a per-origin concurrency limit of one and a global origin concurrency limit of two. Example targets are disabled by default.

The worker inspects public page structure, headings, field labels, required flags, select option labels and document accept metadata. It does not read field values, click, fill, type, upload, submit, log in, persist cookies/storage state or capture request/response bodies, authentication headers or tokens. Query strings and fragments are removed from evidence URLs; likely identifier/token path segments are redacted. CAPTCHA, OTP/MFA, login, payment, rate limits, write forms, navigation failures and mapping drift are surfaced as blockers requiring review.

Reports are local review artefacts. The browser worker has no Supabase credential and no ability to write the Truth Vault, N15 serving tables or candidate records. A separate authenticated evidence-import workflow must be designed and reviewed before browser evidence is persisted centrally.

## Mapping lifecycle

DISCOVERED -> PROBE_CAPTURED -> MAPPING_PROPOSED -> HUMAN_REVIEW -> APPROVED_MAPPING_VERSION -> STAGING_PROOF -> CANDIDATE_READY.

A structural fingerprint mismatch creates a new proposal. It never self-heals into a promoted mapping. Structure confidence, source authority, claim evidence, freshness and human approval remain separate.

## Candidate final mile

The single candidate profile and Document Vault are reused across all routes. For a blocked institution, Kingsmen can later route to candidate-controlled hand-off, guided completion or Manual Application Packet (MAP). A one-time expiring browser hand-off session is a separate future feature requiring threat modelling, candidate consent, encrypted ephemeral state, candidate/session isolation, audit, revocation and founder approval. It is not implemented by the probe.

The candidate solves CAPTCHA/OTP directly with the institution. Kingsmen does not solve a CAPTCHA, inject tokens, intercept OTPs, bypass limits, pay fees or accept legal declarations. The candidate may report a submission, but that remains SUBMITTED_CANDIDATE_REPORTED until institution receipt evidence confirms it. Provider-confirmed receipt and outcome are separate states.

## N15 and candidate-facing listings

The institution register is a discovery directory, not an open-opportunity catalogue. A Browser Scout observation does not prove programme availability, an intake, a deadline, eligibility, accreditation, provider partnership or submission. The N15 adapter must separately reconcile reviewed official-source observations into provider/programme/deadline serving rows with evidence and freshness. Candidate matches require source confidence, current confirmed deadlines, evidence-backed eligibility, provider approval and human review. All six pathways remain available; pricing packages do not hide opportunity listings.

## Monitoring and national coverage

Institution coverage is counted separately at DIRECTORY_LISTED, SOURCE_VERIFIED, PORTAL_PROBED, MAPPING_APPROVED, SANDBOX_PROVEN and CANDIDATE_READY. A probe is a timestamped observation, not lifetime uptime. Scheduled probes, cooldowns, per-origin concurrency, stop switches and health trends are future orchestration layers requiring source-owner/terms review.

Tier 1 prioritises public universities, universities of technology, major TVET networks and high-volume national bursary/NSFAS sources. Tier 2 adds remaining TVET/CET, verified private providers, SETA/QCTO and learnership sources. Tier 3 uses MAP/guided completion by default for niche or highly protected portals.

## Current implementation scope

This increment adds the typed capability contract, policy helpers and tests, inactive example targets, a local Playwright probe worker, source validation and this operating note. It does not crawl live institutions, persist data to Supabase, promote mappings, create live hand-off sessions, populate N15 candidate matches, activate institution routes or change migration history. Platform Playwright Test remains a separate candidate/reviewer QA engine.
