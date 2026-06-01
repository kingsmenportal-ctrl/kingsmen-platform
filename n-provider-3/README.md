# N_PROVIDER.3 — Direct Creator Provider Commands

This module wires provider commands into the canonical Creator command surface.

Target command:

```powershell
.\scripts\KINGSMEN_CREATOR.ps1 provider:doctor
```

Provider commands to support:

- `provider:check`
- `provider:doctor`
- `provider:report`
- `provider:install`

Dispatch target:

```powershell
.\n-provider-2\Invoke-KingsmenProvider.ps1 <provider-command>
```

Safety:

- Preserve existing Creator commands.
- Preserve PowerShell 5.1 compatibility where possible.
- Do not print or commit raw secrets.
- Keep optional providers disabled until gates pass.
- Keep PostgreSQL truth, Airtable mirror-only, email-first, WhatsApp urgent-only, SMS backup-only, Oracle Lite default.
