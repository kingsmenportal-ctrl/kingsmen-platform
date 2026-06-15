export type PublicRepoDecision =
  | 'CURRENT_CORE'
  | 'ADOPT_NOW'
  | 'ADOPT_NEXT'
  | 'WATCH'
  | 'LAB_ONLY'
  | 'REFERENCE_ONLY'
  | 'REJECTED';

export type PublicRepoRuntimeMode =
  | 'kingsmen_core'
  | 'adapter_contract'
  | 'sidecar_service'
  | 'local_lab_only'
  | 'reference_pattern_only'
  | 'blocked';

export type PublicRepoLiveStatus =
  | 'live_contract_ready'
  | 'planned_next'
  | 'study_recorded'
  | 'watch_only'
  | 'lab_only'
  | 'blocked';

export type OracleLiteWeight = 'light' | 'medium' | 'heavy' | 'unknown';

export interface PublicRepoIntegrationRecord {
  id: string;
  area: string;
  repository: string;
  decision: PublicRepoDecision;
  runtimeMode: PublicRepoRuntimeMode;
  liveStatus: PublicRepoLiveStatus;
  adapterId: string;
  productSurfaces: string[];
  kingsmenUse: string;
  productionAllowed: boolean;
  approvalRequired: boolean;
  licenseReviewRequired: boolean;
  oracleLiteWeight: OracleLiteWeight;
  boundaries: string[];
  buildTargets: string[];
  acceptance: string[];
}

const records: PublicRepoIntegrationRecord[] = [
  {
    id: 'docling',
    area: 'document_intelligence',
    repository: 'DS4SD/docling',
    decision: 'ADOPT_NOW',
    runtimeMode: 'adapter_contract',
    liveStatus: 'live_contract_ready',
    adapterId: 'DoclingAdapter',
    productSurfaces: ['N04 Candidate Portal', 'N05 Document Vault', 'Jarvis Document Smart Intake'],
    kingsmenUse: 'Extract structured draft fields from CVs, certificates, statements, PDFs, DOCX, and tables for smart-form review.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: [
      'Extraction creates draft fields only.',
      'Candidate/operator confirmation is required before truth update.',
      'Raw sensitive documents must not enter LLM traces.',
      'Document Vault remains authority for originals and evidence.'
    ],
    buildTargets: [
      'apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts',
      'apps/web/src/lib/documents/extraction/DocumentExtractionService.ts',
      'apps/web/src/app/api/documents/extract/route.ts'
    ],
    acceptance: [
      'CV upload produces draft profile fields with confidence.',
      'Low-confidence fields require review.',
      'No extracted field becomes truth without approval.'
    ]
  },
  {
    id: 'unstructured',
    area: 'document_intelligence_fallback',
    repository: 'Unstructured-IO/unstructured',
    decision: 'ADOPT_NEXT',
    runtimeMode: 'adapter_contract',
    liveStatus: 'planned_next',
    adapterId: 'UnstructuredFallbackAdapter',
    productSurfaces: ['N05 Document Vault'],
    kingsmenUse: 'Fallback extraction path when primary document parsing needs comparison or recovery.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: [
      'Fallback only, not truth authority.',
      'Compare output with primary extraction before review.',
      'No hidden document mutation.'
    ],
    buildTargets: ['apps/web/src/lib/documents/extraction/UnstructuredFallbackAdapter.contract.ts'],
    acceptance: ['Fallback output is clearly marked.', 'Conflicts create review evidence.']
  },
  {
    id: 'playwright',
    area: 'portal_scout',
    repository: 'microsoft/playwright',
    decision: 'ADOPT_NOW',
    runtimeMode: 'adapter_contract',
    liveStatus: 'live_contract_ready',
    adapterId: 'PlaywrightScoutGateway',
    productSurfaces: ['N06 Route Universe', 'Jarvis Route Scout', 'Manual Application Package'],
    kingsmenUse: 'Controlled portal/source health checks, screenshots, public page checks, and MAP evidence.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: [
      'No CAPTCHA bypass.',
      'No OTP bypass.',
      'No payment automation.',
      'Allowlisted URLs only.',
      'Uncertain portal state routes to manual fallback.'
    ],
    buildTargets: [
      'apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts',
      'apps/web/src/lib/routes/scout/RouteScoutService.ts',
      'apps/web/src/app/api/routes/scout/route.ts'
    ],
    acceptance: [
      'Scout can check an allowlisted public route.',
      'Scout records source confidence evidence.',
      'Blocked/uncertain portal creates manual-review result.'
    ]
  },
  {
    id: 'playwright-mcp',
    area: 'portal_scout_mcp',
    repository: 'microsoft/playwright-mcp',
    decision: 'ADOPT_NEXT',
    runtimeMode: 'sidecar_service',
    liveStatus: 'planned_next',
    adapterId: 'PlaywrightMcpBridge',
    productSurfaces: ['Jarvis Route Scout'],
    kingsmenUse: 'AI-readable browser interaction bridge for controlled scout tasks.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: ['Sandboxed sidecar only.', 'No unreviewed MCP tools.', 'No candidate data in browser tool logs.'],
    buildTargets: ['tools/jarvis-browser/playwright-mcp-bridge/README.md'],
    acceptance: ['MCP bridge is isolated.', 'Allowed commands are listed and policy-gated.']
  },
  {
    id: 'stagehand',
    area: 'browser_agent_reference',
    repository: 'browserbase/stagehand',
    decision: 'ADOPT_NEXT',
    runtimeMode: 'reference_pattern_only',
    liveStatus: 'planned_next',
    adapterId: 'StagehandPatternAdapter',
    productSurfaces: ['Jarvis Route Scout'],
    kingsmenUse: 'Reference natural-language browser action patterns for difficult portals.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: ['Pattern study first.', 'No direct production portal submission.', 'Route Safety gates required.'],
    buildTargets: ['docs/jarvis/public-reference-studies/stagehand-study.md'],
    acceptance: ['Useful patterns are translated into Kingsmen-owned Playwright steps.']
  },
  {
    id: 'openwakeword',
    area: 'jarvis_voice_wakeword',
    repository: 'dscripka/openWakeWord',
    decision: 'ADOPT_NOW',
    runtimeMode: 'sidecar_service',
    liveStatus: 'live_contract_ready',
    adapterId: 'JarvisWakeWordService',
    productSurfaces: ['Jarvis Voice Mode'],
    kingsmenUse: 'Local wake phrase activation for Jarvis.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'light',
    boundaries: ['Local microphone boundary only.', 'Push-to-talk fallback required.', 'No always-on production microphone by default.'],
    buildTargets: ['tools/jarvis-voice/wakeword-service/README.md', 'apps/web/src/app/api/jarvis/voice/session/route.ts'],
    acceptance: ['Wake event creates a voice session.', 'HUD shows listening state.', 'Voice command still passes policy gate.']
  },
  {
    id: 'whisper-cpp',
    area: 'jarvis_voice_stt',
    repository: 'ggml-org/whisper.cpp',
    decision: 'ADOPT_NOW',
    runtimeMode: 'sidecar_service',
    liveStatus: 'live_contract_ready',
    adapterId: 'JarvisSpeechToTextService',
    productSurfaces: ['Jarvis Voice Mode'],
    kingsmenUse: 'Local voice transcription for Jarvis commands.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: ['Do not store raw recordings by default.', 'Store transcript evidence only when policy allows.', 'Sensitive voice commands require confirmation.'],
    buildTargets: ['tools/jarvis-voice/stt-service/README.md'],
    acceptance: ['Transcript appears in HUD.', 'Transcript is passed to Jarvis kernel.', 'Sensitive action asks approval.']
  },
  {
    id: 'piper',
    area: 'jarvis_voice_tts',
    repository: 'OHF-Voice/piper1-gpl',
    decision: 'ADOPT_NEXT',
    runtimeMode: 'sidecar_service',
    liveStatus: 'planned_next',
    adapterId: 'JarvisTextToSpeechService',
    productSurfaces: ['Jarvis Voice Mode'],
    kingsmenUse: 'Local spoken Jarvis responses with browser TTS fallback.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'light',
    boundaries: ['License review required before bundling.', 'Browser TTS fallback remains available.', 'No sensitive data spoken without visible confirmation setting.'],
    buildTargets: ['tools/jarvis-voice/tts-service/README.md'],
    acceptance: ['Jarvis response can be spoken locally or via browser fallback.']
  },
  {
    id: 'langfuse',
    area: 'llm_tracing_and_evidence',
    repository: 'langfuse/langfuse',
    decision: 'ADOPT_NOW',
    runtimeMode: 'sidecar_service',
    liveStatus: 'live_contract_ready',
    adapterId: 'LangfuseTraceGateway',
    productSurfaces: ['Jarvis Kernel', 'AI Decision', 'Evidence Ledger'],
    kingsmenUse: 'Trace prompts, model outputs, tool calls, and evaluation metadata with privacy redaction.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'medium',
    boundaries: ['No secrets in traces.', 'No raw sensitive documents in traces.', 'PostgreSQL evidence remains Kingsmen authority.'],
    buildTargets: ['apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts'],
    acceptance: ['Trace event is redacted.', 'Evidence id links Jarvis output to trace metadata.']
  },
  {
    id: 'gitleaks',
    area: 'security_scan',
    repository: 'gitleaks/gitleaks',
    decision: 'ADOPT_NOW',
    runtimeMode: 'adapter_contract',
    liveStatus: 'live_contract_ready',
    adapterId: 'GitleaksSecurityGate',
    productSurfaces: ['Jarvis Builder Core', 'CI Safety'],
    kingsmenUse: 'Detect accidental secrets before commits and releases.',
    productionAllowed: true,
    approvalRequired: false,
    licenseReviewRequired: true,
    oracleLiteWeight: 'light',
    boundaries: ['Fail closed on suspected secrets.', 'Do not print secrets into Jarvis output.', 'Evidence contains redacted finding summary only.'],
    buildTargets: ['apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts', 'scripts/validators/validate-n21-live-public-repos.mjs'],
    acceptance: ['Security gate can report pass/fail without exposing secret values.']
  },
  {
    id: 'trivy',
    area: 'container_and_dependency_scan',
    repository: 'aquasecurity/trivy',
    decision: 'ADOPT_NOW',
    runtimeMode: 'adapter_contract',
    liveStatus: 'live_contract_ready',
    adapterId: 'TrivySecurityGate',
    productSurfaces: ['Jarvis Builder Core', 'CI Safety'],
    kingsmenUse: 'Scan dependencies, containers, and filesystem risk before deployment.',
    productionAllowed: true,
    approvalRequired: false,
    licenseReviewRequired: true,
    oracleLiteWeight: 'light',
    boundaries: ['Security findings create evidence.', 'Deployment is blocked until reviewed when critical risk appears.'],
    buildTargets: ['apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts'],
    acceptance: ['Critical risk blocks release path.']
  },
  {
    id: 'semgrep',
    area: 'static_analysis',
    repository: 'semgrep/semgrep',
    decision: 'ADOPT_NEXT',
    runtimeMode: 'adapter_contract',
    liveStatus: 'planned_next',
    adapterId: 'SemgrepPolicyGate',
    productSurfaces: ['Jarvis Builder Core', 'CI Safety'],
    kingsmenUse: 'Static code policy checks for unsafe patterns and data leaks.',
    productionAllowed: false,
    approvalRequired: true,
    licenseReviewRequired: true,
    oracleLiteWeight: 'light',
    boundaries: ['Policy rules must be Kingsmen-owned.', 'Findings must be reviewed before auto-fix.'],
    buildTargets: ['apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts'],
    acceptance: ['Policy finding creates review card.']
  }
];

export function listPublicRepoIntegrations(): PublicRepoIntegrationRecord[] {
  return records;
}

export function getPublicRepoIntegration(id: string): PublicRepoIntegrationRecord | undefined {
  return records.find((record) => record.id === id || record.adapterId.toLowerCase() === id.toLowerCase());
}

export function getLivePublicRepoIntegrations(): PublicRepoIntegrationRecord[] {
  return records.filter((record) => record.liveStatus === 'live_contract_ready');
}

export function summarizePublicRepoIntegrations() {
  const byStatus = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.liveStatus] = (acc[record.liveStatus] ?? 0) + 1;
    return acc;
  }, {});

  const byDecision = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.decision] = (acc[record.decision] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: records.length,
    liveContractReady: getLivePublicRepoIntegrations().length,
    byStatus,
    byDecision,
    nextLiveBuildOrder: ['docling', 'playwright', 'openwakeword', 'whisper-cpp', 'langfuse', 'gitleaks', 'trivy']
  };
}
