# N10 â€” Finance / PayFast Runtime

Status: Built and validation-ready.

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
- ACCOMMODATION_SUPPORT_R179 = R179.00

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