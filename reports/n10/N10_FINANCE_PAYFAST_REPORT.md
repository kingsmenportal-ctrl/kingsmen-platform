# N10 â€” Finance / PayFast Runtime

Status: Source foundation built; new checkout remains gated pending commercial catalogue reconciliation and real PayFast sandbox evidence.

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

Locked pricing:
- FREE_DESTINY_MAP_R0 = R0.00
- CV_REVAMP_R49_99 = R49.99
- ACCOMMODATION_SUPPORT_R179 = retired legacy code; not selectable for new checkout; retained only for historical-order reconciliation.

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

## Canonical catalogue reconciliation (2026-10-19)

- The business manifest remains the single advertised package-price catalogue; it contains seven canonical packages.
- The legacy N10 finance catalogue must not expose a standalone R179 accommodation product while accommodation is defined as a package privilege.
- No quantity, service duration, SLA, or route allowance has been invented for the seven packages. Paid checkout remains blocked until the commercial schedule is approved and mapped to the finance plan table, followed by full PayFast sandbox/ITN evidence.
- Migration `0083_retire_legacy_accommodation_checkout.sql` marks any existing standalone plan inactive without deleting historical orders.
- Re-run the seed after review to deactivate the legacy plan in an existing staging database. This change has not been applied to staging by this source-only batch.
