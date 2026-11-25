# Kingsmen Repository Agent Instructions

Before editing anything for Kingsmen, read:

1. `docs/rebuild/KINGSMEN_CHAT_STATUS_PROTOCOL.md`
2. `docs/rebuild/KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md`
3. `manifests/rebuild/kingsmen-simplified-status-v1.json`
4. The relevant locked product specification and release-gate evidence.

Every Kingsmen response and implementation batch must report the whole project at a glance and separately identify frontend, backend/API, database/security, integrations/Jarvis and CI/deployment status. Use the layer tags and evidence vocabulary defined in `KINGSMEN_CHAT_STATUS_PROTOCOL.md`. The user must be told what code was actually changed, where it lives, what test passed, what did not run, what is missing, the current phase timeline and the next acceptance test.

Continue the selected rebuild lane; do not start a parallel product or rebuild from memory. Preserve existing useful code, branch history and migration evidence. Source existence is not end-to-end acceptance. Do not call an opportunity live without current source evidence, a provider submission sent without a real response, a payment successful without verified provider evidence, or a feature production-ready without exact-commit runtime proof.

At the end of each meaningful batch, update the roadmap and machine-readable manifest together and run `npm run kingsmen:status:validate`. Do not claim a PR, test, deployment, runtime or database change succeeded until its result is verified.

Do not perform destructive database work, apply unreviewed migrations, change live candidate records, activate real payments, submit real applications, reveal secrets, change production configuration or deploy production without the explicit approval and evidence required by the project doctrine.
