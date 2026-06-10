# N19 â€” Candidate Mobile / Public-to-Portal Experience

N19 adds the candidate-facing mobile experience as a responsive portal layer, not a separate native app that would add unnecessary Oracle Lite complexity.

## What N19 adds

- Mobile web-first candidate shell.
- Public website lead claim into secure portal session.
- Mobile smart intake that does not ask candidates to retype fields already extracted from CVs and documents.
- Device trust boundary for sensitive actions.
- Candidate mobile status cards.
- Notification preferences that preserve email primary, WhatsApp urgent-only, and SMS backup-only.
- Activity events and resume tokens for public-to-portal continuity.

## Doctrine locked

- MOBILE_WEB_FIRST
- PUBLIC_TO_PORTAL_HANDOFF
- EMAIL_PRIMARY
- WHATSAPP_URGENT_ONLY
- SMS_BACKUP_ONLY
- NO_FAKE_STATUS
- SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA
- DEVICE_TRUST_REQUIRED
- POPIA_MINIMIZATION

## Boundary

Candidates can submit missing information, upload documents, view status, and follow verified manual route packages.

Candidates cannot override backend state, official source confidence, finance/refund decisions, admissions results, NSFAS decisions, employer outcomes, or governance gates.

## Optional database apply

```powershell
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N19Migration.ps1
```

## Next

N20 â€” Final Assembly / System Lock / Production Readiness.