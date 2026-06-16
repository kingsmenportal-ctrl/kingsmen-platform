import { buildJarvisPublicGatewayHealthProbe, type JarvisPublicGatewayHealthItem } from './JarvisPublicGatewayHealthProbe';
import { buildJarvisPublicIntegrationHud, type JarvisPublicIntegrationHudItem } from './JarvisPublicIntegrationHud';
import { buildJarvisLocalInstallationReadiness, type JarvisLocalInstallItem } from './JarvisLocalInstallationReadiness';

export type JarvisGatewayEvidenceState = 'ready' | 'review' | 'blocked';

export type JarvisGatewayEvidenceSummaryItem = {
  id: string;
  name: string;
  nStep: string;
  adapterId: string;
  repository: string;
  liveRoute: string;
  validator: string;
  readiness: string;
  routeHealth: {
    status: JarvisPublicGatewayHealthItem['status'] | 'not_checked';
    httpStatus: number | null;
    latencyMs: number | null;
    reason: string;
  };
  localInstall: {
    installed: number;
    missing: number;
    unknown: number;
    items: Array<Pick<JarvisLocalInstallItem, 'id' | 'name' | 'status' | 'version' | 'reason'>>;
  };
  evidenceState: JarvisGatewayEvidenceState;
  safetyBoundary: string;
  localRuntimeNote: string;
};

export type JarvisPublicGatewayEvidenceSummary = {
  ok: true;
  mode: 'jarvis_public_gateway_evidence_summary';
  doctrine: {
    authority: string;
    readOnlyBoundary: string;
    noExecution: string;
    evidenceRule: string;
  };
  summary: {
    total: number;
    ready: number;
    review: number;
    blocked: number;
    greenRoutes: number;
    installedLocalRuntimes: number;
    missingLocalRuntimes: number;
    unknownLocalRuntimes: number;
    checkedAt: string;
  };
  items: JarvisGatewayEvidenceSummaryItem[];
};

type EvidenceSummaryOptions = {
  origin: string;
  timeoutMs?: number;
};

const installAliases: Record<string, string[]> = {
  'docling-smart-intake': ['docling-runtime'],
  'playwright-scout-gateway': ['playwright-browser-runtime'],
  'jarvis-voice-gateway': ['openwakeword-runtime', 'whisper-cpp-runtime', 'piper-runtime'],
  'jarvis-trace-evidence-gateway': [],
  'jarvis-security-scan-gate': ['gitleaks-runtime', 'trivy-runtime', 'semgrep-runtime']
};

function getInstallsForGateway(gatewayId: string, installs: JarvisLocalInstallItem[]) {
  const ids = installAliases[gatewayId] ?? [];
  return installs.filter((item) => ids.includes(item.id));
}

function deriveEvidenceState(
  gateway: JarvisPublicIntegrationHudItem,
  health: JarvisPublicGatewayHealthItem | undefined,
  installs: JarvisLocalInstallItem[]
): JarvisGatewayEvidenceState {
  if (health?.status === 'red') return 'blocked';
  if (health?.status === 'yellow') return 'review';
  if (gateway.readiness !== 'live_route_ready') return 'review';
  if (installs.some((item) => item.status === 'missing' || item.status === 'unknown')) return 'review';
  return 'ready';
}

export async function buildJarvisPublicGatewayEvidenceSummary(
  options: EvidenceSummaryOptions
): Promise<JarvisPublicGatewayEvidenceSummary> {
  const checkedAt = new Date().toISOString();
  const hud = buildJarvisPublicIntegrationHud();
  const [health, readiness] = await Promise.all([
    buildJarvisPublicGatewayHealthProbe({ origin: options.origin, timeoutMs: options.timeoutMs ?? 2500 }),
    buildJarvisLocalInstallationReadiness()
  ]);

  const items = hud.items.map((gateway) => {
    const healthItem = health.items.find((item) => item.id === gateway.id);
    const installItems = getInstallsForGateway(gateway.id, readiness.items);
    const evidenceState = deriveEvidenceState(gateway, healthItem, installItems);

    return {
      id: gateway.id,
      name: gateway.name,
      nStep: gateway.nStep,
      adapterId: gateway.adapterId,
      repository: gateway.repository,
      liveRoute: gateway.liveRoute,
      validator: gateway.validator,
      readiness: gateway.readiness,
      routeHealth: {
        status: healthItem?.status ?? 'not_checked',
        httpStatus: healthItem?.httpStatus ?? null,
        latencyMs: healthItem?.latencyMs ?? null,
        reason: healthItem?.reason ?? 'Route health was not checked.'
      },
      localInstall: {
        installed: installItems.filter((item) => item.status === 'installed').length,
        missing: installItems.filter((item) => item.status === 'missing').length,
        unknown: installItems.filter((item) => item.status === 'unknown').length,
        items: installItems.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          version: item.version,
          reason: item.reason
        }))
      },
      evidenceState,
      safetyBoundary: gateway.safetyBoundary,
      localRuntimeNote: gateway.localRuntimeNote
    };
  });

  return {
    ok: true,
    mode: 'jarvis_public_gateway_evidence_summary',
    doctrine: {
      authority: 'Kingsmen backend, PostgreSQL Truth Vault, and evidence ledger remain authority.',
      readOnlyBoundary: 'This evidence summary reads existing HUD, route health, and local readiness outputs only.',
      noExecution: 'No POST actions, browser missions, document extraction, voice commands, scans, installs, fixes, commits, pushes, or deployment blocks are executed by this summary.',
      evidenceRule: 'A gateway is ready only when the route is green, the route is live-ready, and required local runtime checks are installed or not applicable.'
    },
    summary: {
      total: items.length,
      ready: items.filter((item) => item.evidenceState === 'ready').length,
      review: items.filter((item) => item.evidenceState === 'review').length,
      blocked: items.filter((item) => item.evidenceState === 'blocked').length,
      greenRoutes: health.summary.green,
      installedLocalRuntimes: readiness.summary.installed,
      missingLocalRuntimes: readiness.summary.missing,
      unknownLocalRuntimes: readiness.summary.unknown,
      checkedAt
    },
    items
  };
}
