# N_PROVIDER.1 — Kingsmen Tool & Provider Registry

This module installs the first provider governance layer for Kingsmen.

## Purpose

N_PROVIDER.1 makes every external tool known, installable, checkable, and safely gated.

It does not make optional tools live by default. It preserves the Kingsmen doctrine:

- PostgreSQL is truth.
- Backend is authority.
- Airtable is mirror/control only.
- Email is primary communication.
- WhatsApp is urgent-only.
- SMS is backup-only.
- Oracle Lite is the default deployment constraint.
- Secrets are never committed.
- Optional tools can be installed but remain disabled until validators pass.

## Files

- `provider-registry.json` — full provider registry.
- `provider-states.schema.json` — schema for provider registry/state structure.
- `install-windows-tools.ps1` — Windows installer and local tool reporter.
- `validate-provider-registry.mjs` — doctrine and provider registry validator.
- `validate-local-tools.mjs` — local tool doctor.
- `connected-tools-status-template.json` — ChatGPT/GitHub/Airtable/Gmail/Netlify status template.

## Safe default states

| Provider | Default |
| --- | --- |
| GitHub | enabled |
| PostgreSQL | enabled |
| Redis | enabled |
| Airtable | disabled until alignment validator passes |
| Gmail | disabled until template/send policy passes |
| Netlify | preview-only until UI proof passes |
| Supabase | disabled until signed upload/RLS validator passes |
| n8n | disabled until backend relay contract passes |
| Playwright | disabled until CAPTCHA/OTP/MAP fallback gate passes |
| WhatsApp | disabled except urgent approved templates |
| SMS | disabled except backup policy |
| Payments | disabled until official pricing/refund/webhook gate passes |
| Oracle Cloud | disabled until deploy/security/backup gate passes |
| Monitoring | disabled until core health endpoints exist |

## Windows usage

From repo root:

```powershell
pwsh ./n-provider-1/install-windows-tools.ps1 -ReportOnly
pwsh ./n-provider-1/install-windows-tools.ps1 -Install
node ./n-provider-1/validate-provider-registry.mjs
node ./n-provider-1/validate-local-tools.mjs
```

Reports are written to:

```text
reports/provider/
```

## Proof rule

A provider is not considered live because it is listed. It becomes live only when:

1. local tool exists where needed,
2. credentials are present without being exposed,
3. connected-tool check passes,
4. provider-specific validator passes,
5. activation gate passes,
6. report is generated,
7. Git commit preserves the proof.
