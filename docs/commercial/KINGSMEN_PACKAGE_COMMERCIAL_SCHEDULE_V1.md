# Kingsmen Portal — Commercial Schedule v1.0

**Decision status:** Proposed schedule for explicit founder approval; not yet approved.  
**Release status:** Not approved for public sale. Checkout remains blocked until the founder's final release review, legal/privacy publication review, staging proof, and payment verification are complete.

All prices are in South African rand (ZAR). Package response targets are service targets during South African business hours, not guarantees of an application outcome, provider decision, funding, job placement, admission, or accommodation.

## 1. Package entitlements

| Package | Price | Active managed route slots | Service term | First-response target | Primary service depth |
|---|---:|---:|---|---|---|
| CV Revamp | R49.99 | 0 | One CV pack, delivered within 3 business days after complete intake | Acknowledge within 2 business days | 15 personalised truthful CV versions and 15 matching motivation letters |
| Artisan Charter | R149.99 | 3 | 30 calendar days from verified activation | 2 business days | Work, skills, learnership, internship, apprenticeship and employment readiness |
| Foundational Accord | R169.99 | 4 | 30 calendar days from verified activation | 2 business days | Broad education and opportunity routes across the six core gates |
| Guildmaster's Charter | R199.99 | 5 | 30 calendar days from verified activation | 2 business days | Work/skills focus with increased monitoring and follow-up |
| Collegiate Ordinance | R299.99 | 8 | 30 calendar days from verified activation | 1 business day | Higher managed volume and monitoring priority |
| Chancellor's Writ | R399.99 | 10 | 30 calendar days from verified activation | 1 business day | Priority queue, deeper human review and stronger fallback support |
| Regency Mandate | R469.99 | 12 | 30 calendar days from verified activation | Acknowledge same business day for requests received during business hours; substantive first response within 1 business day | Highest queue priority, monitoring intensity and escalation depth |

The target clock starts only after the candidate has supplied the required intake and evidence for the specific request. Business hours are Monday–Friday, 09:00–17:00 South Africa time, excluding South African public holidays. A response target is not a promise that an application will be completed within that period.

## 2. What counts as a managed route

A managed route is one distinct, source-verified opportunity/application pathway for which Kingsmen has prepared a candidate-specific requirements checklist, evidence/readiness steps, deadline/source checks where available, status tracking, and the next appropriate human-step handoff.

- A preview, search result, duplicate listing for the same opportunity, or generic guidance alone does not consume a managed slot.
- A route becomes active when the candidate confirms the target and the route is activated with its checklist and tracking record.
- Active slots are a concurrency limit, not a lifetime total. A slot may be reused during the package term once its route is completed, withdrawn, or closed.
- If a verified target becomes unavailable before the candidate begins the required action, support may replace it with one suitable route where a verified alternative exists; no alternative is guaranteed.
- The candidate remains responsible for reviewing and submitting applications, providing truthful information, consent, and attending any official appointments. Kingsmen does not impersonate a candidate or claim that a submission occurred without evidence.
- Accommodation support, where relevant and available, is included as a privilege within the same managed-route allowance. It does not create extra route slots or an extra accommodation fee. Kingsmen does not receive, hold, or pay rent/deposits on a candidate's behalf.

## 3. CV Revamp upgrade rule

If a candidate first purchases CV Revamp and later upgrades to any Kingsmen package, the selected package receives **two additional concurrent active managed route slots** on top of its normal allowance. The 30-day managed-service term starts at the verified activation of the Kingsmen package. This is an additive route entitlement, not a cash discount or price credit unless a separately approved promotion says otherwise.

CV Revamp content must remain truthful. It must never invent experience, qualifications, references, certificates, skills, or results.

## 4. Refunds, cancellation, and failed payments

- No AI system may approve a refund. A named human reviewer must record the decision and evidence.
- Before service work begins, cancellation/refund requests are eligible for human review for a full refund, subject to applicable law and payment-provider settlement.
- After work has begun or a deliverable has been provided, requests are reviewed individually against the published terms, actual work/deliverables, payment evidence, and applicable South African consumer law. Do not publish a blanket “no refunds” claim.
- Duplicate charges, failed/abandoned checkout, invalid ITNs, signature/amount mismatches, and unverified payments must not activate entitlements.
- A return-page redirect is not payment proof. Only a valid, accepted, idempotently recorded PayFast ITN and matching finance evidence can change an order to paid and activate the package.
- The final customer-facing terms must be reviewed and published before checkout is enabled. This schedule does not replace legal advice or statutory rights.

## 5. Claims allowed in candidate-facing surfaces

Candidate-facing surfaces may display the package names, prices, route-slot allowances, service term, CV Revamp deliverables, response targets with the “business-day target, not guarantee” qualification, and the accommodation privilege language above.

They must not promise admission, funding, employment, accommodation, provider partnerships, guaranteed deadlines, or outcomes. Current deadlines, fees, and eligibility must be source-verified. Do not imply that Kingsmen submits an application unless a real submission workflow and evidence prove that claim.

## 6. Implementation and release controls

- The seven package definitions must match this schedule in the business manifest, API pricing catalogue, database seed, checkout/order validation, and candidate-facing UI. The numbers in this proposal are not approved commercial terms until the founder explicitly approves this version.
- The finance schema must store the term, route entitlement, response target, upgrade bonus, and refund-policy version used for each order, so a later catalogue change cannot silently alter an existing purchase.
- Review the migration and seed in code review before any staging write. Staging seeding is a separate, explicit step and must be followed by row-count/value verification.
- Live checkout, real candidate charges, and a paid pilot remain blocked until separate-identity RLS tests, full staging journey, real PayFast sandbox/ITN matrix, backup/restore, runtime secret checks, observability/incident proof, legal/privacy publication, branch protection, evidence review, and founder release approval pass.
