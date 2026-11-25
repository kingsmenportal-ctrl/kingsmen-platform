# Kingsmen Master Project Status

Last updated: 25 November 2026  
Repository: `kingsmenportal-ctrl/kingsmen-platform`  
Current implementation branch: `feat/free-destiny-map-interactive-preview-20261125`  
Current pull request: [#340 — Interactive Free Destiny Map preview](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/340)

## Status language

- **Source verified** — the repository file or code path exists and has been inspected.
- **Implemented, runtime unverified** — implementation exists, but no successful runtime proof has been observed in this status update.
- **Verified passing** — the relevant command/test/build or staging evidence actually ran and passed.
- **Blocked** — a required dependency or launch gate remains incomplete.
- **Not audited** — there is not enough evidence to assign a more specific status.

Do not report a source file, script, design, or planned workflow as proof that the running service works.

## Current project position

Kingsmen is a South African admissions, education, skills, opportunities, employment, funding, document, finance, communications and automation platform. Jarvis is a controlled founder/operator interface, not the authority for candidate records or production actions.

The GitHub repository is accessible. The default branch at the start of this batch was `main`, commit `cb1b98243d46c9a790030af041f78113558e3f30`. Batch 01 is being developed in a separate branch and is **not merged into main**. Public launch remains **blocked** under `docs/launch/KINGSMEN_LAUNCH_READINESS.md`.

## Layer-by-layer inventory

| Layer | Current evidence | Status | Remaining work |
|---|---|---|---|
| Public frontend | Next.js app in `apps/web`; public homepage, six pathway cards and candidate dashboard source exist | Source verified; runtime unverified | Run browser journeys and verify every link, route, mobile layout and form |
| Free Destiny Map | Form and fields existed but the preview button had no submit handler | Interactive local-only preview implemented; clean install/build/browser E2E passed in focused workflow #24 | Keep preview local-only; design a separate safe, consented intake flow after privacy/backend prerequisites |
| Candidate dashboard | Six pathways and five workspace links exist in `apps/web/src/app/candidate/dashboard/page.tsx` | Source verified; full user journey unverified | Verify authentication, data loading, navigation and persistence |
| Backend API | HTTP server, command intake, workflow-result intake, policy evaluation and read-model code in `apps/api` | Source verified; runtime unverified | Build, start and smoke-test all required routes |
| Database / Truth Vault | PostgreSQL repository implementation and persistence validator exist | Implemented, runtime unverified | Prove staging writes, reads, idempotency, audit, evidence, approvals, heartbeat and dead-letter queue |
| Authentication | Not established by this batch's evidence | Not audited | Audit sign-in, session lifecycle, recovery and identity-to-candidate linking |
| Authorization / tenant isolation | RLS and role-isolation source contracts exist | Implemented at source level; staging proof blocked | Verify candidate, operator, founder, anonymous and backend-service separation in staging |
| Application/workflow engine | Command envelope, state machine, workflow result and read-model foundations exist | Partially source verified | Execute complete candidate journeys and verify allowed state transitions |
| Documents | Document module routes/contracts are referenced by source-proof files | Runtime unverified | Test upload, private storage, access control, malware/size constraints and deletion lifecycle |
| Finance/payments | PayFast sandbox proof and validator scripts are present | Source foundation; provider proof blocked | Execute real PayFast sandbox and ITN scenarios in staging |
| Communications | Provider boundaries and proof scripts are present | Source foundation; provider proof blocked | Verify email, bounce, opt-out and the urgent-only WhatsApp rule in staging |
| Jarvis / AI | Command contracts, policy gate, tool registry and evidence-ledger foundations exist | Source verified; end-to-end capability unverified | Verify allowed SAFE_READ operations, backend authority, approvals and evidence recording |
| Automation | Workflow APIs and worker/heartbeat/DLQ foundations exist | Runtime unverified | Prove worker runs, retries, idempotency and failure recovery |
| Infrastructure / Netlify | A connected Netlify project named `kingsmen-jarvis-command-zungu` was found; its last listed ready production deploy is dated 8 July 2026 | Connection found; Kingsmen public-portal mapping unconfirmed | Confirm the intended production site, repository/build settings, current deployed commit and preview deployment |
| CI / tests | Existing Kingsmen CI plus focused preview workflow | Focused workflow #24 passed strict root/web `npm ci`, root regression suite, Chromium install, Next.js production build, and Free Destiny Map browser E2E; Kingsmen CI #647 also passed. Expanded dashboard/workspace route E2E is in workflow #25 | Confirm workflow #25 passes six dashboard pathway checks and five workspace routes; retain strict install/build/E2E gates |
| Privacy, legal and launch controls | Launch-readiness document defines required evidence gates | Launch blocked | Complete legal review/publication and the required redacted staging evidence |

## Batch log

### Batch 01 — Free Destiny Map local route preview

**Branch:** `feat/free-destiny-map-interactive-preview-20261125`  
**Pull request:** [#340](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/340)  
**Base branch:** `main`  
**Latest PR head:** `8ef4cd53e8fb80b06dc453021f4221bceccd04a1`  
**Focused workflow:** [Run #24 — passed](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45647547967)  
**Kingsmen CI:** [Run #647 — passed](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45647548413)  
**Expanded candidate-navigation workflow:** [Run #25 — failed on an overly strict duplicate-link assertion](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45649631829); fix committed as `8ef4cd53e8fb80b06dc453021f4221bceccd04a1`, rerun not yet verified.

Implemented in the branch:

- `apps/web/src/app/free-destiny-map/page.tsx` — made the page a client component; wired form submission; required the core selections; added a result panel; supplied distinct next-step guidance for university, TVET, SETA/learnership, internship/apprenticeship, employment, funding and undecided routes.
- `scripts/staging/test-free-destiny-map-local-preview.mjs` — added a source-level regression contract for required fields, handler wiring, accessible output, seven guidance branches and the no-send/no-persist boundary.
- `scripts/staging/e2e-free-destiny-map-preview.mjs` — Playwright browser E2E fills the form, generates university and funding previews, checks the visible result, verifies the local-only disclosure, and asserts that previewing does not issue app write requests or change browser storage. The latest change also smoke-tests the candidate dashboard's six pathway cards and checks that its five workspace destinations return HTTP 200.
- `package.json` — registered `test:free-destiny-map-preview` and included the test in the root `npm test` command.
- `.github/workflows/free-destiny-map-preview-check.yml` — added a GitHub Actions workflow to run the root regression suite, build Next.js, start the production build, and run Playwright browser E2E on relevant push and PR changes.

**Data boundary:** This preview only reads the current form values in the page and renders recommendations. It makes no backend request and does not write to localStorage or sessionStorage. It does not create a candidate profile, save an application, or claim that a real opportunity is open.

**Validation actually performed:** The source-level structural inspection passed 16/16 checks. Root `npm test` passed, including the candidate dashboard contract and Free Destiny Map local-preview contract. Focused preview workflow #24 passed strict clean installs (`npm ci` at root and `npm ci --prefix apps/web`), Chromium setup, Next.js production build, and the production-preview browser E2E for the Free Destiny Map. Kingsmen CI #647 passed. The browser test verifies university and funding guidance, the local-only disclosure, no app write requests, and unchanged browser storage. The web lockfile was regenerated and committed in the PR branch to include the missing `@netlify/plugin-nextjs@5.16.9` entry; the workflow now uses read-only permissions and strict `npm ci`. The expanded E2E checks all six candidate dashboard pathways and HTTP 200 responses for all five linked workspace routes. Workflow #25 reached the Next.js production build successfully but failed because the dashboard exposed two links to `/candidate/workbench` (consistent with separate responsive navigation layouts) while the test incorrectly required exactly one. The test now requires at least one link while still checking the destination returns HTTP 200. Fix commit `8ef4cd53e8fb80b06dc453021f4221bceccd04a1`; rerun and browser E2E remain unverified. Playwright is pinned to Ubuntu 24.04 because v1.60 does not support Ubuntu 26.04.

## Additional repository protection finding

The read-only `Kingsmen Main Branch Protection Evidence` workflow #3467 failed on this PR head. Its generated report returned HTTP 404 and status `BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE`; captured flags reported `protectionActive: false`, required status checks disabled/not verified, and no required source-guard/release-evidence checks. The run only observed and captured state; it did not change repository settings. Treat `main` branch protection as a P0 gate requiring owner/admin remediation and a new read-only verification.

## Public launch blockers

The existing launch gate identifies these P0 areas as incomplete:

1. Apply and verify `main` branch protection and required checks.
2. Prove PostgreSQL/Supabase Truth Vault persistence in staging.
3. Prove RLS/security role isolation in staging.
4. Prove deployed web-to-backend health and command intake.
5. Complete PayFast sandbox and ITN evidence.
6. Complete a real backup/restore drill.
7. Prove production secrets are configured outside Git, without exposing their values.
8. Prove communications provider behavior in staging.
9. Prove observability, alerting, redaction, queue/DLQ and incident handling.
10. Publish and review privacy, consent, terms and refund-policy surfaces.
11. Capture and review the full staging runtime evidence pack.
12. Produce the final assembly evidence bundle and record founder review.

The official launch gate remains the authoritative list; this status record does not override it.

## Next implementation sequence

1. PR #340's local-preview feature passed strict install, regression tests, production build and the original browser E2E in workflow #24. Expanded workflow #25 exposed a brittle assertion that expected exactly one responsive dashboard link; a fix is committed, but its rerun must pass before considering the expanded test accepted. Keep the PR unmerged until normal review and merge requirements are satisfied.
2. Resolve `main` branch protection: run #3467 could not verify active protection (HTTP 404/not found or not visible); inspect repository settings with admin authority, apply the checked-in script only after confirming its exact scope, and rerun the read-only evidence workflow.
3. Review workflow #25's expanded dashboard navigation checks; investigate any missing or broken candidate workspace route revealed by the browser test.
4. Confirm which Netlify site is the actual public candidate portal, and verify deployment repository/build settings and deployed commit.
5. Complete privacy/legal publication and safe backend/database staging prerequisites before turning any candidate intake into a real data-collection flow, then continue through remaining P0 gates.

## Timeline

A reliable completion date is **not yet measurable** because the focused workflow/build result, full runtime state and staging evidence have not been verified. The working target is a controlled private beta first, followed by the public-launch decision only after required evidence and founder review pass. Any calendar estimate remains provisional until those dependencies are measured.
