# Kingsmen Secrets Wiring Proof

Status: **foundation built, runtime secret health proof pending**  
Production ready: **false**  
Public launch allowed: **false**

This document defines the Kingsmen secret wiring boundary. It does not contain real secrets.

## Purpose

Kingsmen must run from environment-managed secrets, not hardcoded repo values. The repo may store names, providers, required status, rotation metadata, and masked health results only.

## Non-negotiable rules

- No raw secrets in Git.
- No raw secrets in chat.
- No raw secrets in reports.
- No raw secrets in screenshots.
- No raw secrets in package artifacts.
- No browser access to service-role credentials.
- No OpenClaw/Jarvis raw secret access.
- No payment, email, database, storage, or provider credential values in frontend code.

## Registry authority

The source of truth for required credential names is:

```text
manifests/credentials/credentials.registry.json
```

The registry stores credential names and metadata only. It must never store credential values.

## Runtime environment example

The local template is:

```text
.env.example
```

It must contain empty placeholders only. Real values belong in local `.env`, GitHub Secrets, Oracle environment variables, or a future vault/KMS.

## Runtime check

Run the masked local/staging check:

```powershell
.\scripts\security\Test-KingsmenSecretWiring.ps1
```

The script writes:

```text
reports/security/secrets-wiring-runtime-health-latest.json
```

The report may show only:

```text
configured_masked
not_configured
not_needed_yet
configured_github_secret_unverified
configured_oracle_env_unverified
```

It must never print secret values, URL values, token prefixes, key lengths, or raw provider credentials.

## Source proof

Run:

```bash
npm run secrets:prove:wiring
npm run secrets:validate:wiring
```

The proof and validator write:

```text
reports/security/secrets-wiring-proof-latest.json
reports/security/secrets-wiring-validation-latest.json
```

## Launch rule

This proof does not make Kingsmen production-ready. Before public launch, real secrets must be configured outside Git and a masked runtime health report must prove required beta/production credentials are present without exposing values.
