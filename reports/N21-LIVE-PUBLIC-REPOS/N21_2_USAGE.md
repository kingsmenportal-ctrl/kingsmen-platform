# N21.2 Usage — Docling Smart Intake

## Route 1: raw document extraction review

```text
POST /api/documents/extract
```

Use this when a document parser has produced text and Kingsmen needs candidate draft fields.

## Route 2: Jarvis public repo adapter surface

```text
POST /api/jarvis/public-repos/docling-smart-intake
```

Use this when Jarvis is operating through the public repo integration board.

## Safety guarantee

Both routes return draft fields only.
Both routes keep `mayWriteCandidateTruth` false.
Both routes require candidate/operator review before any profile update.
