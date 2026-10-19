# N10 — Finance / PayFast Runtime

Status: Source foundation present; staging runtime validation and founder approval pending.

N10 creates the Kingsmen finance and PayFast runtime foundation.

PayFast is the payment processor. PostgreSQL remains the finance truth vault.

Created:
- plan catalog
- orders
- invoices
- PayFast payment intents
- PayFast ITN receipts
- PayFast signature audit
- payments
- refund requests
- finance ledger entries
- payment evidence ledger
- PayFast runtime example
- finance API modules
- finance UI panels
- N10 migration runner
- N10 validator

Currently approved finance-catalog entries:
- FREE_DESTINY_MAP_R0 = R0.00
- CV_REVAMP_R49_99 = R49.99

The seven canonical Kingsmen packages and prices are defined in
`manifests/business/package-catalogue.json`, but their exact managed quantities,
durations, service limits, and checkout specifications still require completion before
they can be enabled for payment.

Accommodation policy:
- Accommodation support is a package privilege where relevant, subject to verification,
  availability, consent, and no rent/payment handling by Kingsmen.
- The standalone ACCOMMODATION_SUPPORT_R179 plan is not approved for checkout and is
  not seeded as an active plan.
- Do not claim a specific number of included accommodation routes until the canonical
  package specification has been approved.

Finance doctrine:
- No payment secrets committed.
- No AI refund approval.
- No Airtable payment truth.
- Paid status requires verified payment evidence.
- PayFast ITN receipts must be idempotent.
- PayFast signatures must be verified before payment status changes.
- Refunds require human approval.
- CV Revamp must never invent fake experience, certificates, references, skills, or qualifications.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N10Migration.ps1

Next:
N11 - AI Decision / Matching Engine.