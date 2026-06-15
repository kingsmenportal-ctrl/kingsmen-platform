export type JarvisPublicIntegrationReadiness = 'live_route_ready' | 'contract_ready' | 'local_runtime_required';

export type JarvisPublicIntegrationHudItem = {
  id: string;
  name: string;
  nStep: string;
  adapterId: string;
  repository: string;
  liveRoute: string;
  validator: string;
  readiness: JarvisPublicIntegrationReadiness;
  safetyBoundary: string;
  localRuntimeNote: string;
};

export type JarvisPublicIntegrationHud = {
  ok: true;
  mode: 'jarvis_public_integration_hud';
  doctrine: {
    authority: string;
    rule: string;
    noBypass: string;
  };
  summary: {
    total: number;
    liveRoutes: number;
    contractReady: number;
    localRuntimeRequired: number;
  };
  items: JarvisPublicIntegrationHudItem[];
};

export const jarvisPublicIntegrationHudItems: JarvisPublicIntegrationHudItem[] = [
  {
    id: 'docling-smart-intake',
    name: 'Docling Smart Intake',
    nStep: 'N21.2',
    adapterId: 'DoclingAdapter',
    repository: 'DS4SD/docling',
    liveRoute: '/api/jarvis/public-repos/docling-smart-intake',
    validator: 'scripts/validators/validate-n21-docling-smart-intake.mjs',
    readiness: 'live_route_ready',
    safetyBoundary: 'Draft candidate fields only; founder or operator review required before truth write.',
    localRuntimeNote: 'Docling parser sidecar is not installed by this contract; current route accepts reviewed extracted text.'
  },
  {
    id: 'playwright-scout-gateway',
    name: 'Playwright Scout Gateway',
    nStep: 'N21.3',
    adapterId: 'PlaywrightScoutGateway',
    repository: 'microsoft/playwright',
    liveRoute: '/api/jarvis/public-repos/playwright-scout',
    validator: 'scripts/validators/validate-n21-playwright-scout.mjs',
    readiness: 'live_route_ready',
    safetyBoundary: 'Safe public route scouting only; no submit, payment, OTP, CAPTCHA bypass, or credential handling.',
    localRuntimeNote: 'Metadata mode works with safe fetch; browser probe requires local Playwright browser runtime.'
  },
  {
    id: 'jarvis-voice-gateway',
    name: 'Jarvis Voice Gateway',
    nStep: 'N21.4',
    adapterId: 'JarvisVoiceGateway',
    repository: 'dscripka/openWakeWord + ggml-org/whisper.cpp + OHF-Voice/piper1-gpl',
    liveRoute: '/api/jarvis/voice/session',
    validator: 'scripts/validators/validate-n21-jarvis-voice-gateway.mjs',
    readiness: 'live_route_ready',
    safetyBoundary: 'Transcript/session orchestration only; no raw audio storage, no always-on microphone, no policy bypass.',
    localRuntimeNote: 'Browser speech can be used now; native wake word/STT/TTS binaries remain contract-only until installed.'
  },
  {
    id: 'jarvis-trace-evidence-gateway',
    name: 'Jarvis Trace Evidence Gateway',
    nStep: 'N21.5',
    adapterId: 'LangfuseTraceGateway',
    repository: 'langfuse/langfuse',
    liveRoute: '/api/jarvis/trace/evidence',
    validator: 'scripts/validators/validate-n21-jarvis-trace-evidence.mjs',
    readiness: 'live_route_ready',
    safetyBoundary: 'Redacted metadata only; external trace export disabled; PostgreSQL evidence remains authority.',
    localRuntimeNote: 'Langfuse export is intentionally disabled until privacy and deployment policy permits it.'
  },
  {
    id: 'jarvis-security-scan-gate',
    name: 'Jarvis Security Scan Gate',
    nStep: 'N21.6',
    adapterId: 'SecurityScanGate',
    repository: 'gitleaks/gitleaks + aquasecurity/trivy + semgrep/semgrep',
    liveRoute: '/api/jarvis/security/scan',
    validator: 'scripts/validators/validate-n21-jarvis-security-scan-gate.mjs',
    readiness: 'live_route_ready',
    safetyBoundary: 'Detection/report only; no raw private values; no automatic fix, commit, push, or deployment block.',
    localRuntimeNote: 'This gate classifies provided scan evidence; native scanners can be connected later under policy.'
  }
];

export function buildJarvisPublicIntegrationHud(): JarvisPublicIntegrationHud {
  const liveRoutes = jarvisPublicIntegrationHudItems.filter((item) => item.readiness === 'live_route_ready').length;
  const contractReady = jarvisPublicIntegrationHudItems.filter((item) => item.readiness === 'contract_ready').length;
  const localRuntimeRequired = jarvisPublicIntegrationHudItems.filter(
    (item) => item.readiness === 'local_runtime_required'
  ).length;

  return {
    ok: true,
    mode: 'jarvis_public_integration_hud',
    doctrine: {
      authority: 'Kingsmen backend, PostgreSQL Truth Vault, and evidence ledger remain authority.',
      rule: 'The HUD displays status and safe routes only; it does not execute tools by itself.',
      noBypass: 'No public integration may bypass policy gates, approval boundaries, or manual fallback.'
    },
    summary: {
      total: jarvisPublicIntegrationHudItems.length,
      liveRoutes,
      contractReady,
      localRuntimeRequired
    },
    items: jarvisPublicIntegrationHudItems
  };
}
