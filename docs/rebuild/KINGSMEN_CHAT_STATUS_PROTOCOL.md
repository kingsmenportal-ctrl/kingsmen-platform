# Mandatory Kingsmen Status Report Protocol

**Applies to:** Every Kingsmen-related conversation, implementation batch, review, or handoff.  
**Canonical status record:** [Simplified Rebuild Status and Completion Roadmap](KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md) and [machine-readable manifest](../../manifests/rebuild/kingsmen-simplified-status-v1.json).

## Non-negotiable rule

Do not make the Commander reconstruct the project from old chats. Begin every Kingsmen response with the current overall status and a compact, separate report for the frontend, backend/API, database/security, integrations/Jarvis, and CI/deployment. Then explain the actual work and continue the current milestone. Do not ask the Commander to restate decisions already captured in the status record.

If a layer has not changed, still show its current status and say that no new verification has been recorded. Do not omit a layer just because the current task only touches another layer.

## Required report at the start of each Kingsmen response

Use this structure; keep the first summary compact and expand only where useful:

1. **Overall:** current release state, active phase, implementation branch, current PR/commit.
2. **Frontend:** routes/components affected, working interactions, browser-test status, and what remains unverified.
3. **Backend/API:** endpoints, authorization, business rules, persistence and integration tests; identify what is source-only vs runtime-verified.
4. **Database/security:** schema/migration provenance, RLS/auth roles, sensitive-data handling and advisor findings. State whether staging was read-only or changed.
5. **Integrations/Jarvis/operations:** provider connection/runtime status, policy gates, approvals, audit and manual fallback.
6. **CI/deployment:** latest applicable workflow run, test/build results, deployed commit/URL if verified, and production-vs-staging boundary.
7. **Last completed batch:** exactly what files/code/reports changed, tagged by layer.
8. **Open blockers:** P0/P1/P2, owner/dependency, and consequence.
9. **Timeline:** active phase target window, remaining phase estimates, dependencies, and revised end-to-end completion range.
10. **Next deliverable:** one bounded task and its pass/fail acceptance test.

## Layer tags for every implementation task

Every task, change summary, pull request and test record must identify its layer:

- **[FRONTEND]** Next.js pages, React components, styling, accessibility and browser journeys.
- **[BACKEND/API]** HTTP endpoints, business logic, policy enforcement, queues, workers and server-side orchestration.
- **[DATABASE/SECURITY]** PostgreSQL/Supabase schema, migrations, RPCs, RLS, grants, Auth, storage and backup/restore.
- **[INTEGRATION/JARVIS]** external providers, AI/agent/tool registry, evidence ledger, connector runtime and approvals.
- **[INFRA/CI/DEPLOY]** Git governance, test/build automation, Netlify, secrets wiring, observability, release gates and deployed artefacts.
- **[SHARED]** a change that genuinely crosses layers; list each impacted layer and its verification separately.

## Evidence vocabulary

Use explicit states. A source file or route is not runtime proof.

- **SOURCE PRESENT** — relevant code/configuration exists.
- **IMPLEMENTED, TEST PENDING** — code changed, but the acceptance check has not passed.
- **SOURCE TEST PASSED** — named automated tests or build passed; runtime is not implied.
- **STAGING VERIFIED** — real staging browser/API/database/provider evidence passed and is linked.
- **RELEASE BLOCKED** — one or more required release gates remain open.
- **PRODUCTION VERIFIED** — the exact deployed commit and production smoke tests have been checked. Never infer this from a historical “ready” deployment.

Always include test names and workflow links where available. Say “not run” or “pending” for checks that did not run. Never convert “unknown” into “passed.”

## Completion and continuity

- Work forward from the selected implementation branch and the next open milestone in the status record. “Next” means continue from that milestone, not create a new architecture or another disconnected prototype.
- After each meaningful batch, update the status document and manifest, keep the two consistent, and pass `npm run kingsmen:status:validate`.
- Keep a dated changelog of completed batches and the latest verified CI/runtime evidence.
- Never say a whole module is complete based only on a mock, route, source file, successful compile, or old deploy.
- Never apply staging migrations, modify candidate data, enable live payments, submit provider applications, change production settings, or deploy production without the documented review/approval required for that action.
- When a new Kingsmen chat has the project/repository context, read this protocol and the canonical status record first. When it does not have repository context, be explicit about the verification boundary and link the canonical record instead of inventing a fresh status.

## Release horizon

The current master plan estimates **12–21 engineering working days**, with **3–10 additional working days** possible for provider access, credentials, security remediation, legal review and retesting. The planning window is **3–6 calendar weeks from 25 November 2026** (provisional target window: **16 December 2026–6 January 2027**). Treat this as a planning estimate, not as permission to bypass a release gate. Reforecast after database/security and the first authenticated candidate journey have passed.

