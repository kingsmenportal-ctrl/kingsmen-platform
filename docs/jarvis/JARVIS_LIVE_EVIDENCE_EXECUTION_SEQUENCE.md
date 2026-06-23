# Jarvis Live Evidence Execution Sequence

## Status

Source-ready. Manual operator execution required. Not production-ready.

## Purpose

This sequence shows the ordered path for clearing the final live evidence pack after Jarvis source/design/control has been closed out.

The browser does not execute shell commands. The final Jarvis command room and founder launch pages display the sequence only.

## Sequence

1. Docker / API / Truth Vault runtime evidence.
2. AI + Email provider live evidence.
3. PayFast accepted ITN evidence.
4. n8n + Airtable + GitHub runtime evidence.
5. Branch protection + final launch audit evidence.
6. Final live evidence acceptance pack.

## Validation

Validator path: `scripts/validators/validate-jarvis-live-evidence-execution-sequence.mjs`

Expected status: `JARVIS_LIVE_EVIDENCE_EXECUTION_SEQUENCE_VALIDATED`

The expected validation report keeps `productionReady` and `publicLaunchAllowed` false until real evidence is accepted.

## Launch rule

Do not call Jarvis live until all capture reports are accepted, the final acceptance pack passes, branch/final audit evidence is accepted, and founder approval is recorded.
