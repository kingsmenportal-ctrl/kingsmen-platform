# Kingsmen Legal + Privacy + Consent + Refund Proof

Production ready: **false**
Public launch allowed: **false**

This document is a source-level launch proof, not final legal advice.

## Required legal/public surfaces

Kingsmen must publish and version these surfaces before collecting personal data or taking payments:

- Terms of Service
- Privacy Notice
- Consent Notice
- Refund and Payment Policy
- Data Subject Request Path
- Support and Complaint Path

## South Africa source basis

The proof is designed around the South African privacy and consumer-protection environment:

- POPIA privacy notice and lawful processing boundary.
- Consumer Protection Act refund/payment transparency and consumer information boundary.
- Separate marketing consent from service-processing consent.
- Data-subject access, correction, deletion, objection, and complaint path.

## Non-negotiable runtime rules

- No personal data collection before Privacy Notice and Consent Notice are visible.
- No payment or invoice before Refund and Payment Policy is visible.
- No marketing consent bundled with service processing consent.
- No raw secrets, raw payment credentials, or raw candidate recipient data in legal proof reports.
- No final public launch until attorney/founder review records exist.
- No child/minor route without guardian/parent consent boundary where applicable.

## Consent evidence contract

Each consent event must record:

- candidate or actor reference
- policy surface
- policy version
- timestamp
- route/screen surface
- correlationId
- IP/device metadata only when lawful and disclosed
- consent purpose
- consent source

## Refund evidence contract

Each refund review must record:

- order reference
- payment reference
- package/service purchased
- service delivery status
- reason code
- decision owner
- decision timestamp
- refund outcome
- human review evidence

## Validation commands

```bash
npm run legal:prove
npm run legal:validate
npm run kingsmen:launch:audit
```

## Remaining before launch

- Publish draft legal policy routes or URLs.
- Capture founder/legal review record.
- Capture consent smoke proof.
- Capture refund/payment display proof before checkout.
- Capture data-subject request intake proof.
- Confirm no intake/payment screen bypasses the legal surfaces.
