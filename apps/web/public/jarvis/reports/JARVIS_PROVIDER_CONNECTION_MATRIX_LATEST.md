# JARVIS PROVIDER CONNECTION MATRIX

Rule: A provider is not considered truly live just because it appears by name.
It must have real adapter, credential boundary, runtime proof, and evidence log.

Statuses:
- NOT_FOUND_IN_REPO: no meaningful repo evidence found.
- REFERENCED_ONLY: appears in text/code but no clear adapter/env proof found.
- FOUND_NEEDS_RUNTIME_PROOF: repo evidence exists, but live connection must still be verified.

| Provider | Repo status | Hits | Files | Adapter files | Env refs |
|---|---:|---:|---:|---:|---:|
| OpenAI | FOUND_NEEDS_RUNTIME_PROOF | 232 | 45 | 0 | 86 |
| GitHub | FOUND_NEEDS_RUNTIME_PROOF | 2623 | 344 | 33 | 206 |
| Netlify | FOUND_NEEDS_RUNTIME_PROOF | 252 | 25 | 2 | 25 |
| Canva | REFERENCED_ONLY | 143 | 14 | 0 | 0 |
| Gmail | FOUND_NEEDS_RUNTIME_PROOF | 255 | 45 | 0 | 11 |
| Google Drive | FOUND_NEEDS_RUNTIME_PROOF | 273 | 50 | 0 | 10 |
| Google Calendar | FOUND_NEEDS_RUNTIME_PROOF | 735 | 106 | 0 | 2 |
| Airtable | FOUND_NEEDS_RUNTIME_PROOF | 4005 | 292 | 82 | 283 |
| Neon | FOUND_NEEDS_RUNTIME_PROOF | 164 | 15 | 0 | 8 |
| Supabase | FOUND_NEEDS_RUNTIME_PROOF | 836 | 132 | 5 | 62 |
| PayFast | FOUND_NEEDS_RUNTIME_PROOF | 3498 | 292 | 50 | 424 |
| AI Wisebase | REFERENCED_ONLY | 61 | 8 | 0 | 0 |
| B12 | REFERENCED_ONLY | 103 | 20 | 0 | 0 |
| Norton | REFERENCED_ONLY | 44 | 8 | 0 | 0 |
| Replit | REFERENCED_ONLY | 44 | 8 | 0 | 0 |
| Catalyst | REFERENCED_ONLY | 44 | 8 | 0 | 0 |
| Lovable | FOUND_NEEDS_RUNTIME_PROOF | 65 | 11 | 0 | 2 |
| Namecheap | FOUND_NEEDS_RUNTIME_PROOF | 47 | 10 | 0 | 2 |
| Softonic | REFERENCED_ONLY | 41 | 9 | 0 | 0 |
| Vivin | REFERENCED_ONLY | 50 | 10 | 0 | 0 |
| Voice Generator | FOUND_NEEDS_RUNTIME_PROOF | 49 | 3 | 10 | 7 |
| OpenClaw | FOUND_NEEDS_RUNTIME_PROOF | 3136 | 155 | 21 | 149 |
| Playwright | FOUND_NEEDS_RUNTIME_PROOF | 3494 | 251 | 15 | 82 |
| Oracle Lite | FOUND_NEEDS_RUNTIME_PROOF | 2542 | 229 | 114 | 29 |

DETAILS:

## OpenAI
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 232
Files: 45
Adapter files: 0
Env references: 86
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx
apps/web/src/app/founder/providers/jarvis-credentials/page.tsx
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx
db/seeds/n20_final_assembly_seed.sql
docs/N00-doctrine/kimi-repo-access-law.md
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE.md
docs/jarvis/JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY.md
docs/jarvis/JARVIS_LIVE_PROOF_EVIDENCE_LEDGER.md
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF.md
docs/jarvis/JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
docs/oracle/ORACLE_FREE_ACCESS_BOUNDARY.md
manifests/credentials/credentials.registry.json
manifests/jarvis/jarvis-ai-provider-credential-boundary-v1.json
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
n-provider-4/validate-chatgpt-connected-apps.mjs
packages/jarvis-core/src/jarvis-credential-orchestrator.ts
reports/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion-proof.json
runtime/airtable/airtable-runtime.example.json
scripts/agents/validate-openclaw-jarvis-boundary.mjs
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs
scripts/proof/prove-personal-jobs-14-navigation-real-use-gate-expansion.mjs
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1
scripts/validators/validate-connected-apps-provider-map.mjs
scripts/validators/validate-creator-normalize.mjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
scripts/validators/validate-merge-foundation.mjs
Adapter-like files:
None found.

## GitHub
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 2623
Files: 344
Adapter files: 33
Env references: 206
Files:
.env.example
.github/workflows/batch21c-docker-runtime-proof.yml
README.md
apps/api/src/observability/observability-types.ts
apps/api/src/ops/staging-runtime-proof-pack-boundary.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/package-lock.json
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/github/route.ts
apps/web/src/app/api/jarvis/postgresql/route.ts
apps/web/src/app/api/jarvis/v5/script-library/route.ts
apps/web/src/app/founder/launch-control/jarvis-final-source-closeout/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-runbook/page.tsx
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx
apps/web/src/app/founder/launch-control/jarvis/page.tsx
apps/web/src/app/founder/master-index/page.tsx
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx
apps/web/src/app/founder/providers/page.tsx
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx
apps/web/src/app/jarvis/components/JarvisGitHubRepoPanel.tsx
apps/web/src/app/jarvis/components/JarvisPowerShellCreatorPanel.tsx
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx
apps/web/src/app/jarvis/page.tsx
apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx
apps/web/src/lib/jarvis/real-build-lock.ts
apps/web/src/lib/jarvis/runtime/adapter-selector.ts
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/connectors/registry.ts
apps/web/src/lib/jarvis/runtime/connectors/types.ts
apps/web/src/lib/jarvis/runtime/intent-router.ts
apps/web/src/lib/jarvis/runtime/knowledge-brain.ts
apps/web/src/lib/jarvis/runtime/live-data-router.ts
apps/web/src/lib/jarvis/runtime/types.ts
config/creator.config.json
config/jarvis/jarvis-command-profile.json
config/local/oracle/README.md
db/migrations/0011_n13_observability_reports_incidents.sql
docs/KINGSMEN_JARVIS_GUARD.md
docs/N00-doctrine/jarvis-app-connector-law.md
docs/N00-doctrine/kimi-repo-access-law.md
docs/agents/AGENT_AUTHORITY_BOUNDARY.md
docs/agents/AGENT_HANDOFF_RULES.md
docs/agents/KINGSMEN_AGENT_SYSTEM.md
Adapter-like files:
.github/ISSUE_TEMPLATE/kingsmen-module.yml
.github/workflows/batch21c-docker-runtime-proof.yml
.github/workflows/kingsmen-source-guard.yml
apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts
apps/web/src/app/api/jarvis/github/route.ts
apps/web/src/app/api/jarvis/n8n-airtable-github-runtime-proof/route.ts
apps/web/src/app/jarvis/components/JarvisGitHubRepoPanel.tsx
docs/jarvis/JARVIS_GITHUB_TOOL_CONNECTOR_BOUNDARY.md
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_EVIDENCE_CAPTURE.md
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF.md
docs/jarvis/v5/script-library/NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md
docs/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.md
docs/runtime/batch21c-github-actions-docker-runtime-proof.md
manifests/jarvis/jarvis-github-tool-connector-boundary-v1.json
manifests/jarvis/jarvis-n8n-airtable-github-evidence-capture-v1.json
manifests/jarvis/jarvis-n8n-airtable-github-runtime-proof-v1.json
manifests/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.json
manifests/runtime/batch21c-github-actions-docker-runtime-proof.json
packages/contracts/src/personal-jobs-16-github-proof-index-build-ledger-founder-handover.ts
packages/jarvis-core/src/github-repo-boundary.ts
reports/github-actions/batch21c/runtime/batch21c-docker-runtime-proof.json
reports/github-actions/batch21c/validation/batch21c-docker-runtime-proof-latest.json
reports/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover-proof.json
reports/validation/personal-jobs-16-github-proof-index-build-ledger-founder-handover-latest.json
scripts/github/Set-KingsmenMainBranchProtection.ps1
scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs
scripts/proof/prove-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1
scripts/validators/validate-jarvis-github-tool-connector-boundary.mjs
scripts/validators/validate-jarvis-n8n-airtable-github-evidence-capture.mjs
scripts/validators/validate-jarvis-n8n-airtable-github-runtime-proof.mjs
scripts/validators/validate-jarvis-v5-number-18-github.mjs
scripts/validators/validate-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs

## Netlify
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 252
Files: 25
Adapter files: 2
Env references: 25
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/package-lock.json
apps/web/package.json
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-jarvis-os.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/jarvis/page.tsx
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-1/KINGSMEN_PROVIDER_MAP.md
n-provider-1/connected-tools-status-template.json
n-provider-1/install-windows-tools.ps1
n-provider-1/provider-registry.json
n-provider-1/validate-local-tools.mjs
n-provider-1/validate-provider-registry.mjs
n-provider-4/chatgpt-connected-apps-registry.json
n-provider-4/validate-chatgpt-connected-apps.mjs
netlify.toml
reports/provider/local-tool-health-report.json
reports/provider/windows-tool-health-report.json
scripts/powershell/Invoke-JarvisV5LiveDeployProof.ps1
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
apps/web/netlify/functions/jarvis-agent.cjs
netlify.toml

## Canva
Status: REFERENCED_ONLY
Hits: 143
Files: 14
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/package-lock.json
apps/web/scripts/build-jarvis-luxury.cjs
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
manifests/jarvis/public-reference-studies/openclaw-study.json
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
manifests/tools/tool-registry.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Gmail
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 255
Files: 45
Adapter files: 0
Env references: 11
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/founder/providers/page.tsx
config/jarvis/jarvis-command-profile.json
db/seeds/n08_control_plane_seed.sql
docs/N00-doctrine/jarvis-app-connector-law.md
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md
docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md
docs/master/KINGSMEN_BUILD_ORDER_AND_PROOF_RULES.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
docs/master/KINGSMEN_MASTER_LAYER_INDEX.md
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-1/KINGSMEN_PROVIDER_MAP.md
n-provider-1/connected-tools-status-template.json
n-provider-1/provider-registry.json
n-provider-1/validate-provider-registry.mjs
n-provider-4/chatgpt-connected-apps-registry.json
n-provider-4/validate-chatgpt-connected-apps.mjs
reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/proof/prove-personal-jobs-01-local-job-desk.mjs
scripts/validators/validate-25-provider-gates.mjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Google Drive
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 273
Files: 50
Adapter files: 0
Env references: 10
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/personal-jobs/apply-now/route.ts
apps/web/src/app/founder/providers/page.tsx
apps/web/src/app/jarvis/page.tsx
apps/web/src/app/personal-job-desk/apply-pack/ApplyPackBuilderClient.tsx
apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx
docs/N00-doctrine/jarvis-app-connector-law.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_18_OPEN_INTERPRETER.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_23_MINI_SWE_AGENT.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md
docs/jarvis/v5/script-library/NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
docs/master/KINGSMEN_MASTER_LAYER_INDEX.md
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
n-provider-4/validate-chatgpt-connected-apps.mjs
reports/provider/chatgpt-connected-apps-report.json
reports/runtime/free-destiny-map-controlled-next-boot-proof.json
reports/runtime/free-destiny-map-controlled-production-build-proof.json
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json
scripts/agents/personal-job-document-pack-index.mjs
scripts/agents/personal-job-opportunity-command-queue.mjs
scripts/agents/personal-job-opportunity-quality-gate.mjs
scripts/agents/personal-job-playwright-source-scout.mjs
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-25-provider-gates.mjs
scripts/validators/validate-connected-apps-provider-map.mjs
Adapter-like files:
None found.

## Google Calendar
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 735
Files: 106
Adapter files: 0
Env references: 2
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/calendar/route.ts
apps/web/src/app/jarvis/components/JarvisCalendarCommandPanel.tsx
apps/web/src/app/personal-job-desk/daily-loop/DailyLoopClient.tsx
apps/web/src/app/personal-job-desk/daily-loop/page.tsx
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx
apps/web/src/app/personal-job-desk/normalizer/ImportNormalizerClient.tsx
apps/web/src/app/personal-job-desk/outcomes/page.tsx
apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx
apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx
apps/web/src/app/personal-job-desk/runtime-click-test/RuntimeClickTestClient.tsx
config/jarvis/jarvis-command-profile.json
docs/N00-doctrine/jarvis-app-connector-law.md
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md
docs/jarvis/JARVIS_COMMAND_STANDARD.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md
docs/jarvis/v5/JARVIS_V5_SCRIPT_LIBRARY_FINAL_CLOSEOUT.md
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md
docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md
docs/jarvis/v5/script-library/NUMBER_22_WHEN_THE_COMMANDER_ASKS_ABOUT_CALENDAR.md
docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md
docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md
docs/jarvis/v5/script-library/NUMBER_35_MORNING_COMMAND_BRIEF.md
docs/jarvis/v5/script-library/NUMBER_36_MIDDAY_COMMAND_BRIEF.md
docs/jarvis/v5/script-library/NUMBER_37_EVENING_COMMAND_CLOSEOUT.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
docs/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.md
Adapter-like files:
None found.

## Airtable
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 4005
Files: 292
Adapter files: 82
Env references: 283
Files:
README.md
apps/api/src/airtable/airtable-base-registry.ts
apps/api/src/airtable/airtable-client.ts
apps/api/src/airtable/airtable-field-map.ts
apps/api/src/airtable/airtable-health.ts
apps/api/src/airtable/airtable-outbox.ts
apps/api/src/airtable/airtable-repository.ts
apps/api/src/airtable/airtable-sync-policy.ts
apps/api/src/airtable/airtable-sync-targets.ts
apps/api/src/airtable/airtable-types.ts
apps/api/src/airtable/airtable-webhook.ts
apps/api/src/airtable/index.ts
apps/api/src/control-plane/control-plane.ts
apps/api/src/final-assembly/deployment-checklist.ts
apps/api/src/final-assembly/final-assembly-types.ts
apps/api/src/final-assembly/module-registry.ts
apps/api/src/final-assembly/release-doctrine.ts
apps/api/src/finance/finance-policy.ts
apps/api/src/founder/founder-control-plane-read-model.ts
apps/api/src/governance/state-machine-governance.ts
apps/api/src/index.ts
apps/api/src/integrations/integration-adapters.ts
apps/api/src/integrations/integrations.ts
apps/api/src/kernel/constitution-loader.ts
apps/api/src/observability/observability-types.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/airtable-sync/AirtableSyncPanel.tsx
apps/web/src/airtable-sync/SyncOutboxPanel.tsx
apps/web/src/app/api/founder/airtable/health/route.ts
apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/postgresql/route.ts
apps/web/src/app/api/jarvis/v5/script-library/route.ts
apps/web/src/app/founder/launch-control/jarvis-docker-runtime-proof/page.tsx
apps/web/src/app/founder/launch-control/jarvis-final-source-closeout/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-runbook/page.tsx
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx
apps/web/src/app/founder/launch-control/jarvis/page.tsx
apps/web/src/app/founder/master-index/page.tsx
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx
apps/web/src/app/founder/providers/airtable/page.tsx
apps/web/src/app/founder/providers/jarvis-credentials/page.tsx
apps/web/src/app/founder/providers/page.tsx
Adapter-like files:
apps/api/src/airtable/airtable-base-registry.ts
apps/api/src/airtable/airtable-client.ts
apps/api/src/airtable/airtable-field-map.ts
apps/api/src/airtable/airtable-health.ts
apps/api/src/airtable/airtable-outbox.ts
apps/api/src/airtable/airtable-repository.ts
apps/api/src/airtable/airtable-sync-policy.ts
apps/api/src/airtable/airtable-sync-targets.ts
apps/api/src/airtable/airtable-types.ts
apps/api/src/airtable/airtable-webhook.ts
apps/api/src/airtable/index.ts
apps/web/src/airtable-sync/AirtableSyncPanel.tsx
apps/web/src/airtable-sync/SyncOutboxPanel.tsx
apps/web/src/app/api/founder/airtable/health/route.ts
apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts
apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts
apps/web/src/app/api/jarvis/n8n-airtable-github-runtime-proof/route.ts
apps/web/src/app/founder/providers/airtable/page.tsx
db/migrations/0005_n07_airtable_sync.sql
db/seeds/n07_airtable_sync_seed.sql
docs/jarvis/JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY.md
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_EVIDENCE_CAPTURE.md
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF.md
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md
docs/n07/N07_AIRTABLE_01_MIRROR_BOUNDARY_ASYNC_SYNC_PROVIDER_GATE.md
docs/n07/N07_AIRTABLE_02_MIRROR_JOB_QUEUE_WORKER_DLQ.md
docs/n07/N07_AIRTABLE_03_BASE_TABLE_MAPPING_TRANSFORMS_PROVIDER_HEALTH.md
docs/n07/N07_AIRTABLE_04_SYNC_API_ROUTES_FOUNDER_HEALTH_CLOSEOUT.md
manifests/jarvis/jarvis-airtable-human-mirror-boundary-v1.json
manifests/jarvis/jarvis-n8n-airtable-github-evidence-capture-v1.json
manifests/jarvis/jarvis-n8n-airtable-github-runtime-proof-v1.json
manifests/n07/airtable-sync.json
manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json
manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json
manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json
manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json
packages/backend/src/n07/airtable-consent-safe-transform.ts
packages/backend/src/n07/airtable-idempotency-policy.ts
packages/backend/src/n07/airtable-mirror-policy.ts
packages/backend/src/n07/airtable-mirror-worker.ts
packages/backend/src/n07/airtable-provider-gate.ts
packages/backend/src/n07/airtable-provider-health-read-model.ts
packages/backend/src/n07/airtable-sync-api-policy.ts
packages/backend/src/n07/airtable-sync-queue-policy.ts
packages/backend/src/n07/airtable-transform-policy.ts
packages/backend/src/n07/founder-airtable-health-view.ts
packages/contracts/src/n07-airtable-base-map-contract.ts
packages/contracts/src/n07-airtable-mirror-job-contract.ts
packages/contracts/src/n07-airtable-provider-contract.ts
packages/contracts/src/n07-airtable-table-map-contract.ts

## Neon
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 164
Files: 15
Adapter files: 0
Env references: 8
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/jarvis/page.tsx
db/seeds/n20_final_assembly_seed.sql
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Supabase
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 836
Files: 132
Adapter files: 5
Env references: 62
Files:
README.md
apps/api/src/documents/document-storage.ts
apps/api/src/observability/observability-types.ts
apps/api/src/ops/staging-runtime-proof-pack-boundary.ts
apps/api/src/server.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/supabase/route.ts
apps/web/src/app/jarvis/components/JarvisSupabasePlatformPanel.tsx
apps/web/src/founder/founder-control-plane-client.ts
apps/web/src/lib/jarvis/runtime/intent-router.ts
config/creator.config.json
config/environment/.env.template
config/jarvis/jarvis-command-profile.json
config/providers/provider-registry.json
db/migrations/0003_n05_document_vault.sql
db/migrations/0011_n13_observability_reports_incidents.sql
db/seeds/n20_final_assembly_seed.sql
docker-compose.yml
docs/N00-doctrine/jarvis-app-connector-law.md
docs/N00-doctrine/kimi-repo-access-law.md
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md
docs/api/KINGSMEN_DEPLOYABLE_API.md
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md
docs/candidate/candidate-public-free-destiny-map-entry.md
docs/candidate/free-destiny-map-intake-runtime-reachability.md
docs/finance/KINGSMEN_PAYMENT_PROOF.md
docs/intake/free-destiny-map-local-runtime-shell.md
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md
docs/jarvis/JARVIS_COMMAND_STANDARD.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_14_LEON_AI.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_25_AUTOGEN.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md
docs/jarvis/v5/script-library/NUMBER_17_WHEN_THE_COMMANDER_ASKS_ABOUT_SUPABASE.md
docs/launch/KINGSMEN_LAUNCH_READINESS.md
docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
docs/master/KINGSMEN_MASTER_LAYER_INDEX.md
docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md
Adapter-like files:
apps/web/src/app/api/jarvis/supabase/route.ts
apps/web/src/app/jarvis/components/JarvisSupabasePlatformPanel.tsx
docs/jarvis/v5/script-library/NUMBER_17_WHEN_THE_COMMANDER_ASKS_ABOUT_SUPABASE.md
packages/jarvis-core/src/supabase-platform-boundary.ts
scripts/validators/validate-jarvis-v5-number-17-supabase.mjs

## PayFast
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 3498
Files: 292
Adapter files: 50
Env references: 424
Files:
.env.example
.github/workflows/kingsmen-source-guard.yml
README.md
apps/api/src/final-assembly/deployment-checklist.ts
apps/api/src/final-assembly/final-assembly-evidence-capture-boundary.ts
apps/api/src/final-assembly/final-assembly-types.ts
apps/api/src/final-assembly/final-read-model.ts
apps/api/src/final-assembly/module-registry.ts
apps/api/src/final-assembly/readiness-engine.ts
apps/api/src/final-assembly/release-doctrine.ts
apps/api/src/final-assembly/runbook-registry.ts
apps/api/src/final-assembly/system-map.ts
apps/api/src/finance/finance-ledger.ts
apps/api/src/finance/finance-policy.ts
apps/api/src/finance/finance-types.ts
apps/api/src/finance/index.ts
apps/api/src/finance/payfast-finance-repository.ts
apps/api/src/finance/payfast-http-routes.ts
apps/api/src/finance/payfast-intent.ts
apps/api/src/finance/payfast-itn.ts
apps/api/src/finance/payfast-runtime-gate.ts
apps/api/src/finance/payfast-sandbox-proof.ts
apps/api/src/finance/payfast-signature.ts
apps/api/src/finance/payment-evidence.ts
apps/api/src/founder/founder-control-plane-read-model.ts
apps/api/src/integrations/integration-adapters.ts
apps/api/src/integrations/integrations.ts
apps/api/src/observability/observability-types.ts
apps/api/src/ops/staging-runtime-proof-pack-boundary.ts
apps/api/src/server.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/gates/route.ts
apps/web/src/app/api/jarvis/live-readiness/route.ts
apps/web/src/app/api/jarvis/payfast/route.ts
apps/web/src/app/candidate/payment-status/page.tsx
apps/web/src/app/founder/launch-control/jarvis-final-source-closeout/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx
apps/web/src/app/founder/launch-control/jarvis-live-proof-runbook/page.tsx
apps/web/src/app/founder/launch-control/jarvis-payfast-itn-proof/page.tsx
apps/web/src/app/founder/launch-control/jarvis/page.tsx
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx
apps/web/src/app/founder/providers/jarvis-credentials/page.tsx
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx
apps/web/src/app/jarvis/components/JarvisPayFastPaymentPanel.tsx
apps/web/src/app/jarvis/page.tsx
apps/web/src/app/kingsmen/page.tsx
apps/web/src/app/payments/cancel/page.tsx
Adapter-like files:
apps/api/src/finance/payfast-finance-repository.ts
apps/api/src/finance/payfast-http-routes.ts
apps/api/src/finance/payfast-intent.ts
apps/api/src/finance/payfast-itn.ts
apps/api/src/finance/payfast-runtime-gate.ts
apps/api/src/finance/payfast-sandbox-proof.ts
apps/api/src/finance/payfast-signature.ts
apps/web/src/app/api/jarvis/payfast-accepted-itn-proof/route.ts
apps/web/src/app/api/jarvis/payfast-provider-proof-queue-boundary/route.ts
apps/web/src/app/api/jarvis/payfast/route.ts
apps/web/src/app/founder/launch-control/jarvis-payfast-itn-proof/page.tsx
apps/web/src/app/jarvis/components/JarvisPayFastPaymentPanel.tsx
db/migrations/0008_n10_finance_payfast.sql
db/seeds/n10_finance_payfast_seed.sql
docs/finance/KINGSMEN_PAYFAST_CLEAN_BRANCH_SYNC_REPAIR.md
docs/finance/KINGSMEN_PAYFAST_HTTP_BOUNDARY.md
docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md
docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md
docs/finance/MAIN_SYNC_PAYFAST_BATCH_02.md
docs/finance/MAIN_SYNC_PAYFAST_BATCH_02_DONE.md
docs/finance/MAIN_SYNC_PAYFAST_CARRY_FORWARD.md
docs/jarvis/JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_CAPTURE.md
docs/jarvis/JARVIS_PAYFAST_ACCEPTED_ITN_PROOF.md
docs/jarvis/JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY.md
docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md
manifests/jarvis/jarvis-payfast-accepted-itn-evidence-capture-v1.json
manifests/jarvis/jarvis-payfast-accepted-itn-proof-v1.json
manifests/jarvis/jarvis-payfast-provider-proof-queue-boundary-v1.json
manifests/n10/finance-payfast-runtime.json
manifests/payment/payfast-live-runtime-gate-v1.json
manifests/payment/payfast-sandbox-proof-v1.json
packages/jarvis-core/src/payfast-payment-boundary.ts
reports/n10/N10_FINANCE_PAYFAST_REPORT.md
runtime/payfast/payfast-runtime.example.json
scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs
scripts/proof/prove-payfast-sandbox-boundary.mjs
scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1
scripts/validators/validate-jarvis-payfast-accepted-itn-evidence-capture.mjs
scripts/validators/validate-jarvis-payfast-accepted-itn-proof.mjs
scripts/validators/validate-jarvis-payfast-provider-proof-queue-boundary.mjs
scripts/validators/validate-jarvis-v5-number-20-payfast.mjs
scripts/validators/validate-payfast-clean-branch-sync-repair.mjs
scripts/validators/validate-payfast-clean-sync-carry-forward.mjs
scripts/validators/validate-payfast-http-boundary.mjs
scripts/validators/validate-payfast-runtime-gate-source-only.mjs
scripts/validators/validate-payfast-runtime-gate.mjs
scripts/validators/validate-payfast-sandbox-proof.mjs
scripts/validators/validate-payfast-server-mount-and-persistence.mjs

## AI Wisebase
Status: REFERENCED_ONLY
Hits: 61
Files: 8
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## B12
Status: REFERENCED_ONLY
Hits: 103
Files: 20
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
apps/web/scripts/build-static-jarvis.cjs
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/jarvis/page.tsx
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
reports/creator/creator-report-index.json
reports/oracle/oracle-action-packet-validation-report.json
reports/oracle/oracle-first-login-checklist-validation-report.json
reports/oracle/oracle-free-bootstrap-report.json
reports/oracle/oracle-prerequisites-validation-report.json
reports/oracle/oracle-runtime-install-plan-validation-report.json
reports/oracle/oracle-vm-bootstrap-plan-validation-report.json
reports/oracle/oracle-workspace-validation-report.json
reports/validation/provider-health-report.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Norton
Status: REFERENCED_ONLY
Hits: 44
Files: 8
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Replit
Status: REFERENCED_ONLY
Hits: 44
Files: 8
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Catalyst
Status: REFERENCED_ONLY
Hits: 44
Files: 8
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Lovable
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 65
Files: 11
Adapter files: 0
Env references: 2
Files:
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
scripts/validators/validate-jarvis-perfect-rebuild-number-ledger.mjs
Adapter-like files:
None found.

## Namecheap
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 47
Files: 10
Adapter files: 0
Env references: 2
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md
manifests/providers/connected-apps-provider-map.json
manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Softonic
Status: REFERENCED_ONLY
Hits: 41
Files: 9
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-connected-apps-provider-map.mjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Vivin
Status: REFERENCED_ONLY
Hits: 50
Files: 10
Adapter files: 0
Env references: 0
Files:
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
manifests/providers/connected-apps-provider-map.json
manifests/tools/connected-tool-activation-gates.json
n-provider-4/chatgpt-connected-apps-registry.json
n-provider-4/validate-chatgpt-connected-apps.mjs
scripts/powershell/jarvis-total-inventory-audit.cjs
scripts/validators/validate-connected-apps-provider-map.mjs
scripts/validators/validate-jarvis-commander-app-stack.mjs
Adapter-like files:
None found.

## Voice Generator
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 49
Files: 3
Adapter files: 10
Env references: 7
Files:
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/scripts/build-jarvis-luxury.cjs
scripts/powershell/jarvis-total-inventory-audit.cjs
Adapter-like files:
docs/agents/PJ42_10_JARVIS_VOICE_READY_COMMANDER_INTERFACE.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md
manifests/jarvis/jarvis-voice-command-safety.json
manifests/jarvis/jarvis-voice-interface-validation.json
manifests/jarvis/jarvis-voice-interface.schema.json
manifests/jarvis/jarvis-voice-state-machine.json
manifests/jarvis/public-reference-studies/kishanrajput23-desktop-voice-assistant-study.json
manifests/jarvis/public-reference-studies/openvoiceos-study.json
scripts/jarvis/validate-pj42-10-voice-interface.mjs

## OpenClaw
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 3136
Files: 155
Adapter files: 21
Env references: 149
Files:
.env.example
apps/api/src/founder/founder-control-plane-read-model.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/src/app/api/jarvis/command/route.ts
apps/web/src/app/api/jarvis/postgresql/route.ts
apps/web/src/app/api/jarvis/status/route.ts
apps/web/src/app/api/jarvis/v5/script-library/route.ts
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx
apps/web/src/app/founder/providers/page.tsx
apps/web/src/app/jarvis/JarvisHudClient.tsx
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx
apps/web/src/founder/FounderControlPlane.tsx
apps/web/src/founder/founder-control-plane-client.ts
config/jarvis/jarvis-command-profile.json
docs/agents/KINGSMEN_AGENT_SYSTEM.md
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md
docs/agents/PJ42_1_JARVIS_LAW_FILES.md
docs/constitution/reality-trained-kingsmen-constitution.md
docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md
docs/jarvis/JARVIS_AI_TOOLS_RUNTIME_READINESS.md
docs/jarvis/JARVIS_COMMAND_STANDARD.md
docs/jarvis/JARVIS_COMPLETION_BOARD.md
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md
docs/jarvis/JARVIS_FINAL_COMMAND_HUD.md
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md
docs/jarvis/JARVIS_SOURCE_COMPLETION_SEAL.md
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md
Adapter-like files:
apps/web/src/app/api/jarvis/openclaw-operator-policy-boundary/route.ts
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
kingsmen/openclaw/openclaw-operator-policy.json
manifests/agents/openclaw-jarvis-boundary.json
manifests/jarvis/jarvis-openclaw-operator-policy-boundary-v1.json
manifests/jarvis/public-reference-studies/openclaw-study.json
reports/agents/openclaw-jarvis-boundary-validation-latest.json
reports/agents/openclaw-sandbox-install-latest.json
reports/openclaw/openclaw-prepare-report.json
reports/openclaw/openclaw-safety-report.json
reports/tools/openclaw-status-report.json
scripts/agents/Install-OpenClawSandbox.ps1
scripts/agents/validate-openclaw-jarvis-boundary.mjs
scripts/openclaw/Prepare-KingsmenOpenClaw.ps1
scripts/staging/Invoke-KingsmenJarvisOpenClawOperatorPolicyBoundaryProof.ps1
scripts/validators/validate-jarvis-live-index-openclaw-runtime.mjs
scripts/validators/validate-jarvis-openclaw-operator-policy-boundary.mjs
scripts/validators/validate-openclaw-safety.mjs

## Playwright
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 3494
Files: 251
Adapter files: 15
Env references: 82
Files:
apps/api/src/control-plane/control-plane.ts
apps/api/src/founder-ops/founder-brief-builder.ts
apps/api/src/founder-ops/founder-read-model.ts
apps/api/src/founder/founder-control-plane-read-model.ts
apps/api/src/integrations/integration-adapters.ts
apps/api/src/integrations/integrations.ts
apps/api/src/kernel/constitution-loader.ts
apps/api/src/observability/observability-types.ts
apps/api/src/orchestrator/orchestrator-runtime.ts
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/package-lock.json
apps/web/package.json
apps/web/src/app/api/jarvis/agent/route.ts
apps/web/src/app/api/jarvis/postgresql/route.ts
apps/web/src/app/api/jarvis/v5/script-library/route.ts
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx
apps/web/src/app/jarvis/page.tsx
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx
apps/web/src/founder-ops/FoundationBriefPanel.tsx
apps/web/src/founder/founder-control-plane-client.ts
apps/web/src/integrations/IntegrationRuntimePanel.tsx
apps/web/src/lib/jarvis/runtime/adapter-selector.ts
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/connectors/registry.ts
apps/web/src/lib/jarvis/runtime/connectors/types.ts
apps/web/src/lib/jarvis/runtime/intent-router.ts
apps/web/src/lib/jarvis/runtime/live-data-router.ts
apps/web/src/lib/jarvis/runtime/types.ts
apps/web/src/observability/FoundationReportPanel.tsx
config/environment/.env.template
config/jarvis/jarvis-command-profile.json
config/providers/provider-registry.json
data/personal-job-desk/job-search-sources.local.example.json
data/personal-job-desk/source-scout-queue.local.example.json
db/migrations/0001_n03_truth_vault.sql
db/migrations/0004_n06_route_universe.sql
db/migrations/0011_n13_observability_reports_incidents.sql
db/migrations/0012_n14_integrations_workflow_connectors.sql
db/migrations/0014_n16_orchestrator_execution.sql
db/migrations/0015_n17_founder_command_ops.sql
db/seeds/n06_route_universe_seed.sql
db/seeds/n08_control_plane_seed.sql
Adapter-like files:
apps/web/src/app/api/jarvis/playwright-scout-map-fallback-boundary/route.ts
docs/jarvis/JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY.md
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md
docs/personal-jobs/personal-jobs-19-playwright-source-scout.md
manifests/jarvis/jarvis-playwright-scout-map-fallback-boundary-v1.json
manifests/personal-jobs/personal-jobs-19-playwright-source-scout.json
packages/contracts/src/personal-jobs-19-playwright-source-scout.ts
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json
reports/validation/personal-jobs-19-playwright-source-scout-latest.json
scripts/agents/personal-job-playwright-source-scout.mjs
scripts/agents/playwright-job-source-scout.mjs
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1
scripts/validators/validate-jarvis-playwright-scout-map-fallback-boundary.mjs
scripts/validators/validate-personal-jobs-19-playwright-source-scout.mjs

## Oracle Lite
Status: FOUND_NEEDS_RUNTIME_PROOF
Hits: 2542
Files: 229
Adapter files: 114
Env references: 29
Files:
.github/ISSUE_TEMPLATE/kingsmen-module.yml
apps/api/src/ai-decision/ai-budget-guard.ts
apps/api/src/documents/document-policy.ts
apps/api/src/final-assembly/final-read-model.ts
apps/api/src/final-assembly/module-registry.ts
apps/api/src/final-assembly/release-lock.ts
apps/api/src/final-assembly/runbook-registry.ts
apps/api/src/founder-ops/command-catalog.ts
apps/api/src/founder-ops/founder-mobile-cockpit.ts
apps/api/src/observability/capacity-monitor.ts
apps/api/src/observability/founder-report-builder.ts
apps/api/src/runtime/free-destiny-map-backend-local-server.mjs
apps/api/src/system/kingsmen-operating-system-spine.ts
apps/web/jarvis-os/jarvis-os.html
apps/web/netlify/functions/jarvis-agent.cjs
apps/web/public/founder/proof-centre/adapter.json
apps/web/public/founder/proof-centre/index.html
apps/web/src/app/founder/control-plane/digest/page.tsx
apps/web/src/app/founder/proof-centre/page.tsx
apps/web/src/app/founder/providers/airtable/page.tsx
apps/web/src/app/founder/providers/page.tsx
apps/web/src/app/jarvis/components/JarvisDeploymentCommandPanel.tsx
apps/web/src/app/jarvis/components/JarvisStrategyCommandPanel.tsx
apps/web/src/components/kingsmen/BuildProofStatusCard.tsx
apps/web/src/control-plane/CapacityGuardPanel.tsx
apps/web/src/final-assembly/SystemLockPanel.tsx
apps/web/src/observability/CapacityWatchPanel.tsx
apps/web/src/observability/ObservabilityDashboard.tsx
config/creator.config.json
config/environment/.env.template
config/providers/provider-registry.json
db/seeds/n05_runtime_config_seed.sql
db/seeds/n08_control_plane_seed.sql
db/seeds/n11_ai_decision_seed.sql
db/seeds/n12_governance_policy_seed.sql
db/seeds/n13_observability_seed.sql
db/seeds/n16_orchestrator_execution_seed.sql
db/seeds/n17_founder_command_ops_seed.sql
db/seeds/n19_candidate_mobile_seed.sql
db/seeds/n20_final_assembly_seed.sql
docker-compose.yml
docs/N00-doctrine/jarvis-app-connector-law.md
docs/N00-doctrine/kimi-repo-access-law.md
docs/agents/AGENT_RISK_REGISTER.md
docs/agents/KINGSMEN_AGENT_SYSTEM.md
docs/candidate/free-destiny-map-intake-runtime-reachability.md
docs/constitution/KINGSMEN_CONSTITUTION.md
docs/constitution/reality-trained-kingsmen-constitution.md
docs/control-plane/founder-proof-centre-runtime-reachability.md
docs/intake/free-destiny-map-intake-backend-shell.md
Adapter-like files:
config/local/oracle/README.md
docker/oracle-lite/docker-compose.local.yml
docs/oracle/ORACLE_FREE_ACCESS_BOUNDARY.md
docs/oracle/oracle-access-guide.md
docs/oracle/oracle-first-login-checklist.md
docs/oracle/oracle-founder-action-packet.md
docs/oracle/oracle-runtime-install-plan.md
docs/oracle/oracle-ssh-bootstrap-guide.md
docs/runtime/batch22-oracle-lite-handoff-prep.md
docs/runtime/batch23-oracle-vm-environment-checklist.md
docs/runtime/batch24-oracle-remote-dry-run-readiness.md
docs/runtime/batch25-approved-oracle-remote-dry-run-gate.md
docs/runtime/batch26-approved-oracle-remote-read-only-checks.md
docs/runtime/docker-oracle-lite-container-preparation.md
docs/runtime/docker-oracle-lite-controlled-build-proof.md
docs/runtime/docker-oracle-lite-controlled-runtime-proof.md
docs/runtime/docker-oracle-lite-runtime-health-hardening.md
doctrine/n00/oracle-lite-rules.json
kingsmen/oracle/access-guides/oracle-ssh-bootstrap-guide.json
kingsmen/oracle/action-packets/oracle-founder-action-packet.json
kingsmen/oracle/checklists/founder-oracle-free-checklist.json
kingsmen/oracle/cost-guard/oracle-cost-guard.json
kingsmen/oracle/oracle-free-bootstrap-plan.json
kingsmen/oracle/ssh/oracle-ssh-bootstrap-guide.json
kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json
kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json
kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json
kingsmen/oracle/workspace/oracle-workspace-config.json
manifests/n01/oracle-lite-runtime.json
manifests/oracle/oracle-free-access-boundary.json
manifests/runtime/batch22-oracle-lite-handoff-prep.json
manifests/runtime/batch23-oracle-vm-handoff-runner.json
manifests/runtime/batch24-oracle-remote-dry-run-readiness.json
manifests/runtime/batch25-approved-oracle-remote-dry-run-gate.json
manifests/runtime/batch26-approved-oracle-remote-read-only-checks.json
manifests/runtime/docker-oracle-lite-container-preparation.json
manifests/runtime/docker-oracle-lite-controlled-build-proof.json
manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json
manifests/runtime/docker-oracle-lite-runtime-health-hardening.json
packages/contracts/src/docker-oracle-lite-container-preparation.ts
packages/contracts/src/docker-oracle-lite-controlled-build.ts
packages/contracts/src/docker-oracle-lite-controlled-runtime.ts
packages/contracts/src/docker-oracle-lite-runtime-health.ts
reports/oracle/oracle-access-boundary-validation-latest.json
reports/oracle/oracle-access-guide-validation-report.json
reports/oracle/oracle-action-packet-validation-report.json
reports/oracle/oracle-firewall-plan-report.json
reports/oracle/oracle-first-login-checklist-report.json
reports/oracle/oracle-first-login-checklist-validation-report.json
reports/oracle/oracle-founder-action-packet-report.json