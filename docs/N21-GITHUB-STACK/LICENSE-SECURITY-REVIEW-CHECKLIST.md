# N21 — External GitHub Stack License and Security Review Checklist

This checklist must be completed before any external GitHub project becomes a Kingsmen production dependency, submodule, service, adapter, or copied implementation.

## Review status values

Use these values in review notes:

- `LOCAL_CLONE_ONLY`
- `REFERENCE_ONLY`
- `APPROVED_ADAPTER`
- `APPROVED_SERVICE`
- `REJECTED`
- `DEFERRED`

## Mandatory review checklist

For each external repository:

- [ ] repository name recorded;
- [ ] repository URL recorded;
- [ ] default branch recorded;
- [ ] latest commit recorded locally;
- [ ] license file found;
- [ ] license type recorded;
- [ ] license is compatible with intended use;
- [ ] no third-party code copied into Kingsmen core without approval;
- [ ] dependency manifests reviewed;
- [ ] container/runtime requirements reviewed;
- [ ] Oracle Lite resource impact reviewed;
- [ ] privacy/POPIA impact reviewed;
- [ ] sensitive-data handling reviewed;
- [ ] security scan completed;
- [ ] adapter boundary documented;
- [ ] human approval boundary documented;
- [ ] rollback plan documented;
- [ ] evidence ledger mapping documented.

## License caution

Kingsmen must be careful with strong copyleft licenses such as GPL and AGPL. These may be acceptable for separate local tools or services in some cases, but they must not be copied into closed Kingsmen core without proper legal review.

## Security caution

Before use, inspect:

- install scripts,
- postinstall hooks,
- Dockerfiles,
- docker compose files,
- package manifests,
- environment variable examples,
- GitHub Actions,
- network calls,
- model download scripts,
- browser automation scripts,
- file upload handlers.

## Kingsmen approval questions

For every tool, answer:

1. What exact Kingsmen problem does this solve?
2. Is it necessary, or is it a useless layer?
3. Can it run within Oracle Lite limits?
4. Does it respect email-first and WhatsApp urgent-only doctrine?
5. Does it keep PostgreSQL as truth?
6. Does it preserve the backend state machine?
7. Does it produce evidence ledger entries?
8. Does it require human approval for sensitive actions?
9. Does it avoid storing unnecessary candidate personal data?
10. Can it be removed without breaking Kingsmen core?

## Immediate approval candidates

These should be reviewed first because they directly improve Kingsmen:

1. `DS4SD/docling` — candidate document smart intake.
2. `microsoft/playwright` — portal/source scout foundation.
3. `langfuse/langfuse` — Jarvis/AI trace evidence.
4. `dscripka/openWakeWord` — local Jarvis wake word.
5. `ggml-org/whisper.cpp` — local Jarvis speech-to-text.
6. `gitleaks/gitleaks` — repo secret-safety gate.
7. `aquasecurity/trivy` — dependency/container scan gate.
8. `pgvector/pgvector` — PostgreSQL-native semantic search.

## Deferred or lab-only candidates

These must not become core until proven necessary:

- browser-use/browser-use,
- Skyvern-AI/skyvern,
- crewAIInc/crewAI,
- OpenHands/OpenHands-Cloud,
- paul-gauthier/aider,
- open-webui/open-webui,
- qdrant/qdrant,
- chroma-core/chroma,
- temporalio/temporal.

## Production promotion record template

```md
### Repository

- Repo:
- URL:
- Local path:
- Commit:
- License:
- Review date:
- Reviewer:

### Kingsmen purpose

### Integration mode

- [ ] local clone only
- [ ] reference only
- [ ] adapter
- [ ] separate service
- [ ] production dependency

### Boundaries

### Evidence ledger mapping

### Risks and mitigations

### Decision

- [ ] approved
- [ ] rejected
- [ ] deferred
```
