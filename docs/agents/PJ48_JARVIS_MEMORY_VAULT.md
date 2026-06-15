# PJ48 — Jarvis Memory Vault

Status: Founder-locked build doctrine
Parent: PJ47 — Jarvis Tool Adapters and Live Connectors
Issue: #28

## Purpose

PJ48 creates the Jarvis Memory Vault.

Jarvis needs continuity. It must remember Kingsmen doctrine, build decisions, phase outcomes, safe source summaries, incident summaries, and Commander-approved preferences. But Jarvis memory must never become a raw private data store.

## Core Law

Jarvis memory is summary memory, not raw private storage.

Allowed memory supports continuity.
Forbidden memory remains outside Jarvis memory.
Current facts still require live verification.
Memory may guide, but memory may not override source confidence.

## What Jarvis May Remember

- Locked doctrine summaries
- Build decisions
- Phase completion summaries
- Command outcome summaries
- Source confidence summaries
- Public opportunity intelligence summaries
- Incident summaries
- Visual product decisions
- Commander-approved preferences

## What Jarvis Must Not Remember

- Raw candidate records
- Raw payment records
- Private document contents
- Authentication material
- Browser session material
- Private banking/card details
- Raw secret logs
- Unapproved personal data
- Unsupported official-status claims

## Memory Flow

```text
Memory Candidate
  -> Policy Check
  -> Redaction Check
  -> Domain Classification
  -> Source Confidence Link
  -> Summary Record
  -> Retention Rule
  -> Memory Vault
```

## Read Flow

```text
Commander Question
  -> Intent Router
  -> Knowledge Brain
  -> Memory Vault Search
  -> Source Confidence
  -> Evidence Ledger
  -> Answer Composer
```

## Final Rule

Jarvis may remember what helps Kingsmen operate, but Jarvis must forget or reject what would make Kingsmen unsafe.