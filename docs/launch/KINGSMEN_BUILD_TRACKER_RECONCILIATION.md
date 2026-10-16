# Kingsmen Build Tracker Reconciliation — main snapshot

**Snapshot basis:** default branch `main`, commit `12fc775e8a162dfe25450249c4877151f9e6afa9`; tracker fetched from `Kingsmen_Build_Tracker.csv`. This is a path/status reconciliation, not proof that a component works.

## Summary

- Tracked rows: **188**
- Status counts: `Not_Started`: 185; `Built`: 3
- Tracker paths found in main's recursive Git tree: **36**
- Tracker paths not found in main's recursive Git tree: **152**
- Built rows whose path exists: **3 of 3**
- Reconciliation status: **BLOCKED**. Missing paths are not automatically failures—the tracker includes planned/not-started files—but rows must be classified as planned vs stale before this can be called reconciled. No tracker statuses were changed by this report.

## Open PR inventory (#70–#85)

This table is a live API snapshot; PR #71/#72 returned 404 and PR #81 is closed, not merged. PR base branches are shown as reported; several implementation PRs do not target `main` directly and therefore are not part of the default branch.

| PR | State | Base branch | Head branch | Title / interpretation |
|---|---|---|---|---|
| [#70](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/70) | open / draft | `fix/accommodation-pricing-canonical` | `feat/kingsmen-portal-visual-prototype` | Add interactive Kingsmen Portal HTML prototype |
| #71 | Not found (404) | — | — | Verify whether deleted/unavailable; no current PR data returned |
| #72 | Not found (404) | — | — | Verify whether deleted/unavailable; no current PR data returned |
| [#73](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/73) | open / draft | `main` | `fix/kingsmen-ci-real-validation-gates` | Fix Kingsmen CI to run real validation gates |
| [#74](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/74) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-a-migration-review` | [DRAFT] Harden staging reconciliation migrations |
| [#75](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/75) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-c-finance-coverage` | [DRAFT] Add finance ledger unit coverage and expose gaps |
| [#76](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/76) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-big-e-f-g-migrations` | [DRAFT] E–G candidate onboarding, compliance and performance migrations |
| [#77](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/77) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-big-h-i-k-migrations` | [DRAFT] H–I–K contracts, notifications and audit migrations |
| [#78](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/78) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-big-j-l-migrations` | [DRAFT] J–L founder RBAC and storage retention migrations |
| [#79](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/79) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-big-m-n-o-p-migrations` | [DRAFT] M–P reporting, search, billing and WhatsApp metadata |
| [#80](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/80) | open / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-q-api-wiring` | [DRAFT] Q — secure API component foundations |
| [#81](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/81) | closed / draft | `fix/kingsmen-ci-real-validation-gates` | `draft/pr-payfast-finance-tx` | Draft: PayFast finance transaction persistence |
| [#82](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/82) | open | `fix/kingsmen-ci-real-validation-gates` | `chore/kingsmen-api-ci-gate` | CI: bootstrap Kingsmen API build and test gate |
| [#83](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/83) | open / draft | `main` | `docs/kingsmen-master-completion-plan` | Docs: reconciled Kingsmen master completion plan |
| [#84](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/84) | open / draft | `main` | `docs/kingsmen-complete-logic-inventory` | Docs: complete Kingsmen logic and gap inventory |
| [#85](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/85) | open / draft | `main` | `fix/kingsmen-phase0-source-guard-ledger` | Fix Truth Vault Source Guard wiring and add component ledger |

## Every tracker row: path existence check

`Path exists` means the exact `File_Path` string appears in the recursive tree for main. A directory path can exist; existence does not imply implementation completeness. Missing rows are not marked Built or Verified.

| Phase | Module | Module name | Tracker status | File path | Path exists on main | Reconciliation action |
|---:|---|---|---|---|---|---|
| 0 | N00.1 | Foundation Reset Sub 1 | Not_Started | `kingsmen/foundation/n00-1-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.2 | Foundation Reset Sub 2 | Not_Started | `kingsmen/foundation/n00-2-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.3 | Foundation Reset Sub 3 | Not_Started | `kingsmen/foundation/n00-3-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.4 | Foundation Reset Sub 4 | Not_Started | `kingsmen/foundation/n00-4-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.5 | Foundation Reset Sub 5 | Not_Started | `kingsmen/foundation/n00-5-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.6 | Foundation Reset Sub 6 | Not_Started | `kingsmen/foundation/n00-6-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.7 | Foundation Reset Sub 7 | Not_Started | `kingsmen/foundation/n00-7-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.8 | Foundation Reset Sub 8 | Not_Started | `kingsmen/foundation/n00-8-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | N00.9 | Foundation Reset Sub 9 | Not_Started | `kingsmen/foundation/n00-9-reset.md` | No | Classify as planned/not-started or update stale path after owner review |
| 1 | N09.3.1 | n09-action-packet-bridge-policy | Built | `packages/db/src/n09-action-packet-bridge-policy.ts` | Yes | Verify runtime proof; path existence alone is insufficient |
| 1 | N09.3.2 | N09.3_Validator | Built | `scripts/validators/validate-n09-3.mjs` | Yes | Verify runtime proof; path existence alone is insufficient |
| 1 | N09.3.3 | N09.3_Manifest | Built | `manifests/modules/N09.3-communications-contracts.json` | Yes | Verify runtime proof; path existence alone is insufficient |
| 2 | CREATOR.1 | KINGSMEN_CREATOR_Core | Not_Started | `scripts/KINGSMEN_CREATOR.ps1` | Yes | Classify planned/not-started against current architecture |
| 2 | CREATOR.2 | Test_KingsmenCreator | Not_Started | `scripts/testing/Test-KingsmenCreator.ps1` | Yes | Classify planned/not-started against current architecture |
| 2 | CREATOR.3 | Creator_Validation_Report | Not_Started | `reports/creator/creator-validation-report.json` | Yes | Classify planned/not-started against current architecture |
| 2 | CREATOR.4 | Creator_Config | Not_Started | `config/creator.config.json` | Yes | Classify planned/not-started against current architecture |
| 2 | CREATOR.5 | Git_Hooks_Installer | Not_Started | `scripts/install-git-hooks.ps1` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.5 | Environment_Config | Not_Started | `config/environment/.env.template` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.5.1 | Provider_Registry | Not_Started | `config/providers/provider-registry.json` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.5.2 | Provider_Health_Check | Not_Started | `scripts/validators/validate-provider-health.mjs` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.6 | PowerShell_Phase_Runner | Not_Started | `scripts/phases/Invoke-KingsmenPhase.ps1` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.6.1 | Materialization_Index | Not_Started | `manifests/master-build-index.json` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.7 | Nginx_Config | Not_Started | `infrastructure/nginx/nginx.conf` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.7.1 | Docker_Compose_Lite | Not_Started | `docker-compose.yml` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.8 | Log_Prune_Job | Not_Started | `scripts/maintenance/prune-logs.ps1` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.8.1 | Health_Checks | Not_Started | `scripts/validators/validate-health.mjs` | Yes | Classify planned/not-started against current architecture |
| 3 | N01.9 | N01_Readiness_Gate | Not_Started | `scripts/validators/validate-n01-readiness.mjs` | Yes | Classify planned/not-started against current architecture |
| 4 | UI.1 | Next_App_Shell | Not_Started | `apps/web/package.json` | Yes | Classify planned/not-started against current architecture |
| 4 | UI.1.1 | Next_Config | Not_Started | `apps/web/next.config.mjs` | Yes | Classify planned/not-started against current architecture |
| 4 | UI.1.2 | Global_Styles | Not_Started | `apps/web/src/app/globals.css` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.1.3 | Root_Layout | Not_Started | `apps/web/src/app/layout.tsx` | Yes | Classify planned/not-started against current architecture |
| 4 | UI.2 | Candidate_Register_Page | Not_Started | `apps/web/src/app/register/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.2.1 | Candidate_Login_Page | Not_Started | `apps/web/src/app/login/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.2.2 | Candidate_Dashboard_Page | Not_Started | `apps/web/src/app/candidate/dashboard/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 4 | UI.2.3 | Candidate_Onboarding_Form | Not_Started | `apps/web/src/components/candidate/CandidateOnboardingForm.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.3 | Founder_Mobile_Page | Not_Started | `apps/web/src/app/founder/mobile/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.3.1 | Founder_Action_Card | Not_Started | `apps/web/src/components/founder/FounderActionCard.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.3.2 | UI_Smoke_Test | Not_Started | `scripts/testing/Test-FirstClickableSurface.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.3.3 | UI_Interaction_Report | Not_Started | `reports/ui/first-clickable-surface-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.1 | Api_Package | Not_Started | `apps/api/package.json` | Yes | Classify planned/not-started against current architecture |
| 5 | N02.1.1 | Api_Server | Not_Started | `apps/api/src/server.ts` | Yes | Classify planned/not-started against current architecture |
| 5 | N02.1.2 | Constitution_Loader | Not_Started | `apps/api/src/kernel/constitution-loader.ts` | Yes | Classify planned/not-started against current architecture |
| 5 | N02.2 | Command_Envelope | Not_Started | `packages/contracts/src/n02-command-envelope.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.2.1 | Command_Bus | Not_Started | `apps/api/src/kernel/command-bus.ts` | Yes | Classify planned/not-started against current architecture |
| 5 | N02.3 | Policy_Middleware | Not_Started | `apps/api/src/kernel/policy-middleware.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.4 | Auth_Magic_Link | Not_Started | `apps/api/src/auth/magic-link.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.4.1 | Auth_Routes | Not_Started | `apps/api/src/routes/auth.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.5 | Candidate_Profile_Service | Not_Started | `apps/api/src/candidate/candidate-profile.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.6 | Candidate_Routes | Not_Started | `apps/api/src/routes/candidate.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.7 | Kernel_Validation | Not_Started | `scripts/validators/validate-n02-kernel.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.7.1 | N02_Report | Not_Started | `reports/n02/n02-validation-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.1 | DB_Schema_Foundation | Not_Started | `supabase/migrations/000001_foundation.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.2 | Evidence_Ledger | Not_Started | `supabase/migrations/000002_evidence_ledger.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.3 | Audit_Log | Not_Started | `supabase/migrations/000003_audit_log.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.4 | RLS_Grants | Not_Started | `supabase/migrations/000004_rls_grants.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.5 | DB_Types | Not_Started | `packages/db/src/n03-db-types.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.6 | DB_Validation | Not_Started | `scripts/validators/validate-n03-db.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.7 | N03_Report | Not_Started | `reports/n03/n03-validation-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.1 | Candidate_Schema | Not_Started | `supabase/migrations/000005_candidate_core.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.2 | Support_Schema | Not_Started | `supabase/migrations/000006_support_finance_success.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.3 | Pricing_Config | Not_Started | `kingsmen/config/pricing.ceremonial.json` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.4 | Service_Order_Service | Not_Started | `apps/api/src/services/service-order.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.5 | Refund_Policy | Not_Started | `packages/db/src/n04-refund-policy.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.6 | Support_Service | Not_Started | `apps/api/src/services/support.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.7 | Success_Loop_Service | Not_Started | `apps/api/src/services/success-loop.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.8 | Financial_UI | Not_Started | `apps/web/src/app/candidate/finance/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 7 | N04.9 | Support_UI | Not_Started | `apps/web/src/app/candidate/support/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 7 | N04.10 | Success_UI | Not_Started | `apps/web/src/app/candidate/success/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.11 | N04_Validation | Not_Started | `scripts/validators/validate-n04-business.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.1 | Document_Schema | Not_Started | `supabase/migrations/000007_document_vault.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.2 | Document_Types | Not_Started | `packages/contracts/src/n05-document-contracts.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.3 | Storage_Signer | Not_Started | `apps/api/src/services/storage-signer.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.4 | Upload_Routes | Not_Started | `apps/api/src/routes/document-upload.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.5 | Document_Review_Service | Not_Started | `apps/api/src/services/document-review.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.6 | Candidate_Document_UI | Not_Started | `apps/web/src/app/candidate/documents/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 8 | N05.7 | Operator_Fraud_UI | Not_Started | `apps/web/src/app/operator/documents/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.8 | Document_Validator | Not_Started | `scripts/validators/validate-n05-documents.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.1 | Route_Schema | Not_Started | `supabase/migrations/000008_route_universe.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.2 | Route_Types | Not_Started | `packages/contracts/src/n06-route-contracts.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.3 | Source_Authority_Service | Not_Started | `apps/api/src/services/source-authority.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.4 | Choice_Optimizer | Not_Started | `apps/api/src/services/choice-optimizer.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.5 | Route_Workbench_Routes | Not_Started | `apps/api/src/routes/route-workbench.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.6 | Candidate_Route_UI | Not_Started | `apps/web/src/app/candidate/routes/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.7 | Operator_Route_UI | Not_Started | `apps/web/src/app/operator/routes/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.8 | Route_Validator | Not_Started | `scripts/validators/validate-n06-routes.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.1 | Airtable_Mirror_Schema | Not_Started | `supabase/migrations/000009_airtable_mirror.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.2 | Airtable_Adapter | Not_Started | `apps/api/src/integrations/airtable.adapter.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.3 | Mirror_Worker | Not_Started | `apps/workers/src/airtable-mirror.worker.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.4 | Mirror_UI | Not_Started | `apps/web/src/app/founder/mirror/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.5 | Analytics_Schema | Not_Started | `supabase/migrations/000010_analytics_learning.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.6 | Learning_Service | Not_Started | `apps/api/src/services/learning-signal.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 10 | N07.7 | Analytics_UI | Not_Started | `apps/web/src/app/founder/analytics/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.1 | Founder_Schema | Not_Started | `supabase/migrations/000011_founder_control.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.2 | Founder_Contracts | Not_Started | `packages/contracts/src/n08-founder-contracts.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.3 | Action_Packet_Service | Not_Started | `apps/api/src/services/action-packet.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.4 | Approval_Service | Not_Started | `apps/api/src/services/approval.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.4B | Founder_Routes | Not_Started | `apps/api/src/routes/founder.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.4C | Founder_Control_UI | Not_Started | `apps/web/src/app/founder/control-plane/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 11 | N08.4C.1 | Founder_Mobile_UI | Not_Started | `apps/web/src/app/founder/mobile/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 11 | N08.5 | N08_Validator | Not_Started | `scripts/validators/validate-n08-founder.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.1 | Comms_Doctrine | Not_Started | `docs/modules/N09-communications-engine-overview.md` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.2 | Comms_Schema | Not_Started | `supabase/migrations/000012_n09_communications_engine.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.3 | N09_Contracts | Not_Started | `packages/contracts/src/n09-index.ts` | Yes | Classify planned/not-started against current architecture |
| 12 | N09.4 | Template_Repository | Not_Started | `apps/api/src/repositories/n09-template.repository.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.1 | Message_Queue_Repository | Not_Started | `apps/api/src/repositories/n09-message-queue.repository.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.2 | Email_Provider_Interface | Not_Started | `apps/api/src/integrations/email-provider.interface.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.3 | No_Send_Email_Provider | Not_Started | `apps/api/src/integrations/no-send-email.provider.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.4 | Email_Runtime_Service | Not_Started | `apps/api/src/services/email-runtime.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.5 | Notification_Composer | Not_Started | `apps/api/src/services/notification-composer.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4.6 | Comms_Escalation_Engine | Not_Started | `apps/api/src/services/comms-escalation.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4B | Comms_Routes | Not_Started | `apps/api/src/routes/comms.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.4C | Candidate_Message_Centre_UI | Not_Started | `apps/web/src/app/candidate/messages/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 12 | N09.4C.1 | Founder_Comms_Health_UI | Not_Started | `apps/web/src/app/founder/comms/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.5 | N09_Validator | Not_Started | `scripts/validators/validate-n09-comms.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.1 | Payment_Schema | Not_Started | `supabase/migrations/000013_payments.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.2 | Payment_Provider_Interface | Not_Started | `apps/api/src/integrations/payment-provider.interface.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.3 | Manual_EFT_Proof_Service | Not_Started | `apps/api/src/services/manual-eft-proof.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.4 | Payment_Routes | Not_Started | `apps/api/src/routes/payment.routes.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.5 | Payment_UI | Not_Started | `apps/web/src/app/candidate/payments/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N10.6 | Finance_Operator_UI | Not_Started | `apps/web/src/app/operator/finance/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N11.1 | Playwright_Service | Not_Started | `apps/workers/src/playwright-scout.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N11.2 | MAP_Generator | Not_Started | `apps/api/src/services/map-generator.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N11.3 | MAP_UI | Not_Started | `apps/web/src/app/candidate/map/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N12.1 | Partner_Schema | Not_Started | `supabase/migrations/000014_partner_portal.sql` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N12.2 | Partner_Verification_Service | Not_Started | `apps/api/src/services/partner-verification.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N12.3 | Partner_Portal_UI | Not_Started | `apps/web/src/app/partner/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N12.4 | Candidate_Consent_UI | Not_Started | `apps/web/src/app/candidate/consent/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N13.1 | School_Outreach_Service | Not_Started | `apps/api/src/services/school-outreach.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N13.2 | School_Outreach_UI | Not_Started | `apps/web/src/app/founder/schools/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N14.1 | Opportunity_Intake_Service | Not_Started | `apps/api/src/services/opportunity-intake.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N14.2 | Opportunity_Review_UI | Not_Started | `apps/web/src/app/operator/opportunities/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N15.1 | CV_Revamp_Service | Not_Started | `apps/api/src/services/cv-revamp.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N15.2 | CV_Revamp_UI | Not_Started | `apps/web/src/app/cv-revamp/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N16.1 | Phoenix_Service | Not_Started | `apps/api/src/services/phoenix-fallback.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N16.2 | Phoenix_UI | Not_Started | `apps/web/src/app/candidate/phoenix/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N17.1 | Command_Codex | Not_Started | `docs/commands/kingsmen-command-codex.md` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N17.2 | Command_Console_UI | Not_Started | `apps/web/src/app/founder/commands/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N18.1 | Security_Audit | Not_Started | `scripts/security/Test-KingsmenSecurity.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N18.2 | Security_Report | Not_Started | `reports/security/security-audit-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N19.1 | Oracle_Deploy_Script | Not_Started | `scripts/deploy/Deploy-OracleLite.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N19.2 | Oracle_Health_Report | Not_Started | `reports/oracle/oracle-lite-health-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N20.1 | Demo_Seed | Not_Started | `scripts/seed/Seed-KingsmenDemo.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N20.2 | Interaction_Test | Not_Started | `scripts/testing/Test-N20InteractionProof.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 13 | N20.3 | Interaction_Report | Not_Started | `reports/n20/n20-interaction-proof-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.1 | Root_Package | Not_Started | `package.json` | Yes | Classify planned/not-started against current architecture |
| 0 | META.2 | Tsconfig_Base | Not_Started | `tsconfig.base.json` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.3 | GitHub_Workflow | Not_Started | `.github/workflows/validate.yml` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.4 | Env_Example | Not_Started | `.env.example` | Yes | Classify planned/not-started against current architecture |
| 0 | META.5 | Readme_Update | Not_Started | `README.md` | Yes | Classify planned/not-started against current architecture |
| 0 | META.6 | Contributing_Guide | Not_Started | `docs/CONTRIBUTING.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.7 | Architecture_Index | Not_Started | `docs/ARCHITECTURE.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.8 | Runbook | Not_Started | `docs/RUNBOOK.md` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.9 | Tracker_Validator | Not_Started | `scripts/validators/validate-tracker.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 0 | META.10 | Tracker_Report | Not_Started | `reports/tracker/tracker-validation-report.json` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.4 | Public_Home_Page | Not_Started | `apps/web/src/app/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.5 | Public_Pricing_Page | Not_Started | `apps/web/src/app/pricing/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.6 | Public_CV_Revamp_Page | Not_Started | `apps/web/src/app/cv-revamp/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.7 | Public_School_Page | Not_Started | `apps/web/src/app/schools/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.8 | Public_Partner_Page | Not_Started | `apps/web/src/app/partners/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.9 | Mobile_Nav | Not_Started | `apps/web/src/components/ui/MobileNav.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.10 | Status_Pill | Not_Started | `apps/web/src/components/ui/StatusPill.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.11 | Proof_Card | Not_Started | `apps/web/src/components/ui/ProofCard.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.12 | Route_Gate_Card | Not_Started | `apps/web/src/components/ui/RouteGateCard.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 4 | UI.13 | Package_Card | Not_Started | `apps/web/src/components/ui/PackageCard.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.8 | Session_Store | Not_Started | `apps/api/src/auth/session-store.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 5 | N02.9 | Account_Recovery | Not_Started | `apps/api/src/auth/account-recovery.service.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.8 | Migration_Runner | Not_Started | `scripts/db/run-migrations.ps1` | No | Classify as planned/not-started or update stale path after owner review |
| 6 | N03.9 | Migration_Hash_Validator | Not_Started | `scripts/validators/validate-migration-hashes.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.12 | Candidate_Profile_UI | Not_Started | `apps/web/src/app/candidate/profile/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.13 | Operator_Profile_Review_UI | Not_Started | `apps/web/src/app/operator/profile-review/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.14 | Tribunal_UI | Not_Started | `apps/web/src/app/operator/tribunal/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 7 | N04.15 | Candidate_Outcome_UI | Not_Started | `apps/web/src/app/candidate/outcomes/page.tsx` | Yes | Classify planned/not-started against current architecture |
| 8 | N05.9 | Document_Requirement_Rules | Not_Started | `packages/db/src/n05-document-requirement-rules.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 8 | N05.10 | Document_Evidence_Policy | Not_Started | `packages/db/src/n05-document-evidence-policy.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.9 | Institution_Seed_Importer | Not_Started | `scripts/seed/import-sa-institutions.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 9 | N06.10 | Route_Source_Validator | Not_Started | `scripts/validators/validate-route-sources.mjs` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.6 | WhatsApp_Urgent_Template_Policy | Not_Started | `packages/db/src/n09-whatsapp-urgent-template-policy.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 12 | N09.7 | SMS_Backup_Policy | Not_Started | `packages/db/src/n09-sms-backup-policy.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.1 | Public_Layout | Not_Started | `apps/web/src/app/(public)/layout.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.2 | About_Page | Not_Started | `apps/web/src/app/about/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.3 | All_Gates_Page | Not_Started | `apps/web/src/app/gates/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.4 | Terms_Page | Not_Started | `apps/web/src/app/terms/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.5 | Privacy_Page | Not_Started | `apps/web/src/app/privacy/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.6 | Refund_Page | Not_Started | `apps/web/src/app/refund-policy/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.7 | Contact_Page | Not_Started | `apps/web/src/app/contact/page.tsx` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.8 | SEO_Metadata | Not_Started | `apps/web/src/lib/seo.ts` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.9 | Robots_Txt | Not_Started | `apps/web/public/robots.txt` | No | Classify as planned/not-started or update stale path after owner review |
| 14 | WEB.10 | Sitemap_Generator | Not_Started | `scripts/seo/generate-sitemap.mjs` | No | Classify as planned/not-started or update stale path after owner review |

## Missing-path rows (152)

These exact paths are absent from the main tree at this snapshot. Keep them `Not_Started` unless a reviewed tracker update establishes that the intended component moved to a different canonical path.

| Module | Name | Tracker status | Missing path |
|---|---|---|---|
| N00.1 | Foundation Reset Sub 1 | Not_Started | `kingsmen/foundation/n00-1-reset.md` |
| N00.2 | Foundation Reset Sub 2 | Not_Started | `kingsmen/foundation/n00-2-reset.md` |
| N00.3 | Foundation Reset Sub 3 | Not_Started | `kingsmen/foundation/n00-3-reset.md` |
| N00.4 | Foundation Reset Sub 4 | Not_Started | `kingsmen/foundation/n00-4-reset.md` |
| N00.5 | Foundation Reset Sub 5 | Not_Started | `kingsmen/foundation/n00-5-reset.md` |
| N00.6 | Foundation Reset Sub 6 | Not_Started | `kingsmen/foundation/n00-6-reset.md` |
| N00.7 | Foundation Reset Sub 7 | Not_Started | `kingsmen/foundation/n00-7-reset.md` |
| N00.8 | Foundation Reset Sub 8 | Not_Started | `kingsmen/foundation/n00-8-reset.md` |
| N00.9 | Foundation Reset Sub 9 | Not_Started | `kingsmen/foundation/n00-9-reset.md` |
| UI.1.2 | Global_Styles | Not_Started | `apps/web/src/app/globals.css` |
| UI.2 | Candidate_Register_Page | Not_Started | `apps/web/src/app/register/page.tsx` |
| UI.2.1 | Candidate_Login_Page | Not_Started | `apps/web/src/app/login/page.tsx` |
| UI.2.3 | Candidate_Onboarding_Form | Not_Started | `apps/web/src/components/candidate/CandidateOnboardingForm.tsx` |
| UI.3 | Founder_Mobile_Page | Not_Started | `apps/web/src/app/founder/mobile/page.tsx` |
| UI.3.1 | Founder_Action_Card | Not_Started | `apps/web/src/components/founder/FounderActionCard.tsx` |
| UI.3.2 | UI_Smoke_Test | Not_Started | `scripts/testing/Test-FirstClickableSurface.ps1` |
| UI.3.3 | UI_Interaction_Report | Not_Started | `reports/ui/first-clickable-surface-report.json` |
| N02.2 | Command_Envelope | Not_Started | `packages/contracts/src/n02-command-envelope.ts` |
| N02.3 | Policy_Middleware | Not_Started | `apps/api/src/kernel/policy-middleware.ts` |
| N02.4 | Auth_Magic_Link | Not_Started | `apps/api/src/auth/magic-link.service.ts` |
| N02.4.1 | Auth_Routes | Not_Started | `apps/api/src/routes/auth.routes.ts` |
| N02.5 | Candidate_Profile_Service | Not_Started | `apps/api/src/candidate/candidate-profile.service.ts` |
| N02.6 | Candidate_Routes | Not_Started | `apps/api/src/routes/candidate.routes.ts` |
| N02.7 | Kernel_Validation | Not_Started | `scripts/validators/validate-n02-kernel.mjs` |
| N02.7.1 | N02_Report | Not_Started | `reports/n02/n02-validation-report.json` |
| N03.1 | DB_Schema_Foundation | Not_Started | `supabase/migrations/000001_foundation.sql` |
| N03.2 | Evidence_Ledger | Not_Started | `supabase/migrations/000002_evidence_ledger.sql` |
| N03.3 | Audit_Log | Not_Started | `supabase/migrations/000003_audit_log.sql` |
| N03.4 | RLS_Grants | Not_Started | `supabase/migrations/000004_rls_grants.sql` |
| N03.5 | DB_Types | Not_Started | `packages/db/src/n03-db-types.ts` |
| N03.6 | DB_Validation | Not_Started | `scripts/validators/validate-n03-db.mjs` |
| N03.7 | N03_Report | Not_Started | `reports/n03/n03-validation-report.json` |
| N04.1 | Candidate_Schema | Not_Started | `supabase/migrations/000005_candidate_core.sql` |
| N04.2 | Support_Schema | Not_Started | `supabase/migrations/000006_support_finance_success.sql` |
| N04.3 | Pricing_Config | Not_Started | `kingsmen/config/pricing.ceremonial.json` |
| N04.4 | Service_Order_Service | Not_Started | `apps/api/src/services/service-order.service.ts` |
| N04.5 | Refund_Policy | Not_Started | `packages/db/src/n04-refund-policy.ts` |
| N04.6 | Support_Service | Not_Started | `apps/api/src/services/support.service.ts` |
| N04.7 | Success_Loop_Service | Not_Started | `apps/api/src/services/success-loop.service.ts` |
| N04.10 | Success_UI | Not_Started | `apps/web/src/app/candidate/success/page.tsx` |
| N04.11 | N04_Validation | Not_Started | `scripts/validators/validate-n04-business.mjs` |
| N05.1 | Document_Schema | Not_Started | `supabase/migrations/000007_document_vault.sql` |
| N05.2 | Document_Types | Not_Started | `packages/contracts/src/n05-document-contracts.ts` |
| N05.3 | Storage_Signer | Not_Started | `apps/api/src/services/storage-signer.service.ts` |
| N05.4 | Upload_Routes | Not_Started | `apps/api/src/routes/document-upload.routes.ts` |
| N05.5 | Document_Review_Service | Not_Started | `apps/api/src/services/document-review.service.ts` |
| N05.7 | Operator_Fraud_UI | Not_Started | `apps/web/src/app/operator/documents/page.tsx` |
| N05.8 | Document_Validator | Not_Started | `scripts/validators/validate-n05-documents.mjs` |
| N06.1 | Route_Schema | Not_Started | `supabase/migrations/000008_route_universe.sql` |
| N06.2 | Route_Types | Not_Started | `packages/contracts/src/n06-route-contracts.ts` |
| N06.3 | Source_Authority_Service | Not_Started | `apps/api/src/services/source-authority.service.ts` |
| N06.4 | Choice_Optimizer | Not_Started | `apps/api/src/services/choice-optimizer.service.ts` |
| N06.5 | Route_Workbench_Routes | Not_Started | `apps/api/src/routes/route-workbench.routes.ts` |
| N06.6 | Candidate_Route_UI | Not_Started | `apps/web/src/app/candidate/routes/page.tsx` |
| N06.7 | Operator_Route_UI | Not_Started | `apps/web/src/app/operator/routes/page.tsx` |
| N06.8 | Route_Validator | Not_Started | `scripts/validators/validate-n06-routes.mjs` |
| N07.1 | Airtable_Mirror_Schema | Not_Started | `supabase/migrations/000009_airtable_mirror.sql` |
| N07.2 | Airtable_Adapter | Not_Started | `apps/api/src/integrations/airtable.adapter.ts` |
| N07.3 | Mirror_Worker | Not_Started | `apps/workers/src/airtable-mirror.worker.ts` |
| N07.4 | Mirror_UI | Not_Started | `apps/web/src/app/founder/mirror/page.tsx` |
| N07.5 | Analytics_Schema | Not_Started | `supabase/migrations/000010_analytics_learning.sql` |
| N07.6 | Learning_Service | Not_Started | `apps/api/src/services/learning-signal.service.ts` |
| N07.7 | Analytics_UI | Not_Started | `apps/web/src/app/founder/analytics/page.tsx` |
| N08.1 | Founder_Schema | Not_Started | `supabase/migrations/000011_founder_control.sql` |
| N08.2 | Founder_Contracts | Not_Started | `packages/contracts/src/n08-founder-contracts.ts` |
| N08.3 | Action_Packet_Service | Not_Started | `apps/api/src/services/action-packet.service.ts` |
| N08.4 | Approval_Service | Not_Started | `apps/api/src/services/approval.service.ts` |
| N08.4B | Founder_Routes | Not_Started | `apps/api/src/routes/founder.routes.ts` |
| N08.4C.1 | Founder_Mobile_UI | Not_Started | `apps/web/src/app/founder/mobile/page.tsx` |
| N08.5 | N08_Validator | Not_Started | `scripts/validators/validate-n08-founder.mjs` |
| N09.1 | Comms_Doctrine | Not_Started | `docs/modules/N09-communications-engine-overview.md` |
| N09.2 | Comms_Schema | Not_Started | `supabase/migrations/000012_n09_communications_engine.sql` |
| N09.4 | Template_Repository | Not_Started | `apps/api/src/repositories/n09-template.repository.ts` |
| N09.4.1 | Message_Queue_Repository | Not_Started | `apps/api/src/repositories/n09-message-queue.repository.ts` |
| N09.4.2 | Email_Provider_Interface | Not_Started | `apps/api/src/integrations/email-provider.interface.ts` |
| N09.4.3 | No_Send_Email_Provider | Not_Started | `apps/api/src/integrations/no-send-email.provider.ts` |
| N09.4.4 | Email_Runtime_Service | Not_Started | `apps/api/src/services/email-runtime.service.ts` |
| N09.4.5 | Notification_Composer | Not_Started | `apps/api/src/services/notification-composer.service.ts` |
| N09.4.6 | Comms_Escalation_Engine | Not_Started | `apps/api/src/services/comms-escalation.service.ts` |
| N09.4B | Comms_Routes | Not_Started | `apps/api/src/routes/comms.routes.ts` |
| N09.4C.1 | Founder_Comms_Health_UI | Not_Started | `apps/web/src/app/founder/comms/page.tsx` |
| N09.5 | N09_Validator | Not_Started | `scripts/validators/validate-n09-comms.mjs` |
| N10.1 | Payment_Schema | Not_Started | `supabase/migrations/000013_payments.sql` |
| N10.2 | Payment_Provider_Interface | Not_Started | `apps/api/src/integrations/payment-provider.interface.ts` |
| N10.3 | Manual_EFT_Proof_Service | Not_Started | `apps/api/src/services/manual-eft-proof.service.ts` |
| N10.4 | Payment_Routes | Not_Started | `apps/api/src/routes/payment.routes.ts` |
| N10.5 | Payment_UI | Not_Started | `apps/web/src/app/candidate/payments/page.tsx` |
| N10.6 | Finance_Operator_UI | Not_Started | `apps/web/src/app/operator/finance/page.tsx` |
| N11.1 | Playwright_Service | Not_Started | `apps/workers/src/playwright-scout.service.ts` |
| N11.2 | MAP_Generator | Not_Started | `apps/api/src/services/map-generator.service.ts` |
| N11.3 | MAP_UI | Not_Started | `apps/web/src/app/candidate/map/page.tsx` |
| N12.1 | Partner_Schema | Not_Started | `supabase/migrations/000014_partner_portal.sql` |
| N12.2 | Partner_Verification_Service | Not_Started | `apps/api/src/services/partner-verification.service.ts` |
| N12.3 | Partner_Portal_UI | Not_Started | `apps/web/src/app/partner/page.tsx` |
| N12.4 | Candidate_Consent_UI | Not_Started | `apps/web/src/app/candidate/consent/page.tsx` |
| N13.1 | School_Outreach_Service | Not_Started | `apps/api/src/services/school-outreach.service.ts` |
| N13.2 | School_Outreach_UI | Not_Started | `apps/web/src/app/founder/schools/page.tsx` |
| N14.1 | Opportunity_Intake_Service | Not_Started | `apps/api/src/services/opportunity-intake.service.ts` |
| N14.2 | Opportunity_Review_UI | Not_Started | `apps/web/src/app/operator/opportunities/page.tsx` |
| N15.1 | CV_Revamp_Service | Not_Started | `apps/api/src/services/cv-revamp.service.ts` |
| N15.2 | CV_Revamp_UI | Not_Started | `apps/web/src/app/cv-revamp/page.tsx` |
| N16.1 | Phoenix_Service | Not_Started | `apps/api/src/services/phoenix-fallback.service.ts` |
| N16.2 | Phoenix_UI | Not_Started | `apps/web/src/app/candidate/phoenix/page.tsx` |
| N17.1 | Command_Codex | Not_Started | `docs/commands/kingsmen-command-codex.md` |
| N17.2 | Command_Console_UI | Not_Started | `apps/web/src/app/founder/commands/page.tsx` |
| N18.1 | Security_Audit | Not_Started | `scripts/security/Test-KingsmenSecurity.ps1` |
| N18.2 | Security_Report | Not_Started | `reports/security/security-audit-report.json` |
| N19.1 | Oracle_Deploy_Script | Not_Started | `scripts/deploy/Deploy-OracleLite.ps1` |
| N19.2 | Oracle_Health_Report | Not_Started | `reports/oracle/oracle-lite-health-report.json` |
| N20.1 | Demo_Seed | Not_Started | `scripts/seed/Seed-KingsmenDemo.ps1` |
| N20.2 | Interaction_Test | Not_Started | `scripts/testing/Test-N20InteractionProof.ps1` |
| N20.3 | Interaction_Report | Not_Started | `reports/n20/n20-interaction-proof-report.json` |
| META.2 | Tsconfig_Base | Not_Started | `tsconfig.base.json` |
| META.3 | GitHub_Workflow | Not_Started | `.github/workflows/validate.yml` |
| META.6 | Contributing_Guide | Not_Started | `docs/CONTRIBUTING.md` |
| META.7 | Architecture_Index | Not_Started | `docs/ARCHITECTURE.md` |
| META.8 | Runbook | Not_Started | `docs/RUNBOOK.md` |
| META.9 | Tracker_Validator | Not_Started | `scripts/validators/validate-tracker.mjs` |
| META.10 | Tracker_Report | Not_Started | `reports/tracker/tracker-validation-report.json` |
| UI.4 | Public_Home_Page | Not_Started | `apps/web/src/app/page.tsx` |
| UI.5 | Public_Pricing_Page | Not_Started | `apps/web/src/app/pricing/page.tsx` |
| UI.6 | Public_CV_Revamp_Page | Not_Started | `apps/web/src/app/cv-revamp/page.tsx` |
| UI.7 | Public_School_Page | Not_Started | `apps/web/src/app/schools/page.tsx` |
| UI.8 | Public_Partner_Page | Not_Started | `apps/web/src/app/partners/page.tsx` |
| UI.9 | Mobile_Nav | Not_Started | `apps/web/src/components/ui/MobileNav.tsx` |
| UI.10 | Status_Pill | Not_Started | `apps/web/src/components/ui/StatusPill.tsx` |
| UI.11 | Proof_Card | Not_Started | `apps/web/src/components/ui/ProofCard.tsx` |
| UI.12 | Route_Gate_Card | Not_Started | `apps/web/src/components/ui/RouteGateCard.tsx` |
| UI.13 | Package_Card | Not_Started | `apps/web/src/components/ui/PackageCard.tsx` |
| N02.8 | Session_Store | Not_Started | `apps/api/src/auth/session-store.ts` |
| N02.9 | Account_Recovery | Not_Started | `apps/api/src/auth/account-recovery.service.ts` |
| N03.8 | Migration_Runner | Not_Started | `scripts/db/run-migrations.ps1` |
| N03.9 | Migration_Hash_Validator | Not_Started | `scripts/validators/validate-migration-hashes.mjs` |
| N04.12 | Candidate_Profile_UI | Not_Started | `apps/web/src/app/candidate/profile/page.tsx` |
| N04.13 | Operator_Profile_Review_UI | Not_Started | `apps/web/src/app/operator/profile-review/page.tsx` |
| N04.14 | Tribunal_UI | Not_Started | `apps/web/src/app/operator/tribunal/page.tsx` |
| N05.9 | Document_Requirement_Rules | Not_Started | `packages/db/src/n05-document-requirement-rules.ts` |
| N05.10 | Document_Evidence_Policy | Not_Started | `packages/db/src/n05-document-evidence-policy.ts` |
| N06.9 | Institution_Seed_Importer | Not_Started | `scripts/seed/import-sa-institutions.mjs` |
| N06.10 | Route_Source_Validator | Not_Started | `scripts/validators/validate-route-sources.mjs` |
| N09.6 | WhatsApp_Urgent_Template_Policy | Not_Started | `packages/db/src/n09-whatsapp-urgent-template-policy.ts` |
| N09.7 | SMS_Backup_Policy | Not_Started | `packages/db/src/n09-sms-backup-policy.ts` |
| WEB.1 | Public_Layout | Not_Started | `apps/web/src/app/(public)/layout.tsx` |
| WEB.2 | About_Page | Not_Started | `apps/web/src/app/about/page.tsx` |
| WEB.3 | All_Gates_Page | Not_Started | `apps/web/src/app/gates/page.tsx` |
| WEB.4 | Terms_Page | Not_Started | `apps/web/src/app/terms/page.tsx` |
| WEB.5 | Privacy_Page | Not_Started | `apps/web/src/app/privacy/page.tsx` |
| WEB.6 | Refund_Page | Not_Started | `apps/web/src/app/refund-policy/page.tsx` |
| WEB.7 | Contact_Page | Not_Started | `apps/web/src/app/contact/page.tsx` |
| WEB.8 | SEO_Metadata | Not_Started | `apps/web/src/lib/seo.ts` |
| WEB.9 | Robots_Txt | Not_Started | `apps/web/public/robots.txt` |
| WEB.10 | Sitemap_Generator | Not_Started | `scripts/seo/generate-sitemap.mjs` |

## Decision

The CSV and main source tree are **not yet fully reconciled**. This report identifies every row's exact path existence and the full PR range requested. A human/product owner must decide whether each missing path is planned work or a stale path before changing tracker statuses. Do not infer implementation from PRs that are open/unmerged, and do not apply migrations as part of this reconciliation.
