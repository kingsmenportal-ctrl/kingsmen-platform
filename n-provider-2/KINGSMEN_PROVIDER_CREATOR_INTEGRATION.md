# N_PROVIDER.2 — Provider Registry Integration into KINGSMEN_CREATOR.ps1

## Purpose

N_PROVIDER.2 integrates the N_PROVIDER.1 provider registry into the Kingsmen Creator command surface without replacing PowerShell Creator.

The goal is to let the founder run provider commands through a Creator-facing interface while keeping all optional providers safely disabled until validators pass.

## Commands introduced

```powershell
.\n-provider-2\Invoke-KingsmenProvider.ps1 provider:check
.\nn-provider-2\Invoke-KingsmenProvider.ps1 provider:doctor
.\nn-provider-2\Invoke-KingsmenProvider.ps1 provider:report
.\nn-provider-2\Invoke-KingsmenProvider.ps1 provider:install -Install
```

These are designed to be bridged into `scripts/KINGSMEN_CREATOR.ps1` as:

```powershell
.\scripts\KINGSMEN_CREATOR.ps1 provider:check
.\scripts\KINGSMEN_CREATOR.ps1 provider:doctor
.\scripts\KINGSMEN_CREATOR.ps1 provider:report
.\scripts\KINGSMEN_CREATOR.ps1 provider:install
```

## Safety rules preserved

- PostgreSQL remains the truth source.
- Airtable remains mirror-only.
- Email remains the primary communication channel.
- WhatsApp remains urgent-only.
- SMS remains backup-only.
- Oracle Lite remains the default deployment constraint.
- No raw secrets are printed or committed.
- Optional providers remain disabled until activation gates pass.

## Integration model

N_PROVIDER.2 does not invent a second provider registry. It uses:

- `n-provider-1/provider-registry.json`
- `n-provider-1/validate-provider-registry.mjs`
- `n-provider-1/validate-local-tools.mjs`
- `n-provider-1/install-windows-tools.ps1`

N_PROVIDER.2 adds:

- Creator-facing provider command wrapper.
- Integration validator.
- Integration report.
- Clear commands for local proof.

## Proof commands

From repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\n-provider-2\Invoke-KingsmenProvider.ps1 provider:check
powershell -ExecutionPolicy Bypass -File .\n-provider-2\Invoke-KingsmenProvider.ps1 provider:doctor
node .\n-provider-2\validate-provider-creator-integration.mjs
```

Reports are written to:

```text
reports/provider/provider-creator-integration-report.json
reports/provider/provider-command-report.json
```
