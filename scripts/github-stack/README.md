# Kingsmen GitHub Stack Scripts

This folder contains scripts for working with external open-source repositories that can assist Kingsmen and Kingsmen Jarvis.

## Main command

```powershell
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group all
```

This clones selected repositories into:

```text
external/github-stack/
```

That directory is ignored by Git. It is for local inspection, testing, and adapter research only.

## Clone smaller groups

```powershell
# Immediate priorities only
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group p0

# Jarvis voice tools only
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group voice

# Browser scout tools only
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group browser

# Document intake tools only
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group document

# Agent/Jarvis brain references only
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group agent
```

## Dry run

```powershell
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group all -DryRun
```

## Safety rule

Do not commit `external/github-stack/` into Kingsmen. Do not copy third-party code into Kingsmen core until the license/security checklist is complete.

## Key documents

- `docs/N21-GITHUB-STACK/KINGSMEN-GITHUB-STACK-MANIFEST.md`
- `docs/N21-GITHUB-STACK/KINGSMEN-ADAPTER-ARCHITECTURE.md`
- `docs/N21-GITHUB-STACK/LICENSE-SECURITY-REVIEW-CHECKLIST.md`

## First production target

Build **Candidate Smart Form from CV/Documents** using Docling through a Kingsmen adapter.

Target result:

1. Candidate uploads CV/document.
2. Document Vault stores original.
3. Adapter extracts draft fields.
4. Candidate/operator confirms.
5. Backend command commits approved truth.
6. Evidence ledger stores extraction confidence and source.
