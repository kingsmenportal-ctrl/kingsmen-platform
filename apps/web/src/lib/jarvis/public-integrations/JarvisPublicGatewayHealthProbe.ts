import { jarvisPublicIntegrationHudItems } from './JarvisPublicIntegrationHud';

export type JarvisPublicGatewayHealthStatus = 'green' | 'yellow' | 'red';

export type JarvisPublicGatewayHealthItem = {
  id: string;
  name: string;
  nStep: string;
  adapterId: string;
  route: string;
  status: JarvisPublicGatewayHealthStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
  reason: string;
  safeProbe: {
    method: 'GET';
    noPost: true;
    noToolExecution: true;
    noMutation: true;
    noSecretOutput: true;
  };
};

export type JarvisPublicGatewayHealthProbe = {
  ok: true;
  mode: 'jarvis_public_gateway_health_probe';
  doctrine: {
    authority: string;
    probeBoundary: string;
    noExecution: string;
  };
  summary: {
    total: number;
    green: number;
    yellow: number;
    red: number;
    checkedAt: string;
  };
  items: JarvisPublicGatewayHealthItem[];
};

type ProbeOptions = {
  origin: string;
  timeoutMs?: number;
};

function statusFromHttp(httpStatus: number | null, failed: boolean): JarvisPublicGatewayHealthStatus {
  if (failed || httpStatus === null) return 'red';
  if (httpStatus >= 200 && httpStatus < 300) return 'green';
  if (httpStatus >= 300 && httpStatus < 500) return 'yellow';
  return 'red';
}

function reasonFromStatus(status: JarvisPublicGatewayHealthStatus, httpStatus: number | null): string {
  if (status === 'green') return 'Local GET status route responded successfully.';
  if (status === 'yellow') return `Local GET route responded with review status ${httpStatus}.`;
  return 'Local GET route did not respond successfully. Start Next.js or review the route.';
}

async function probeOneGateway(item: (typeof jarvisPublicIntegrationHudItems)[number], options: Required<ProbeOptions>): Promise<JarvisPublicGatewayHealthItem> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const started = Date.now();
  let httpStatus: number | null = null;
  let failed = false;

  try {
    const url = new URL(item.liveRoute, options.origin);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'x-kingsmen-probe': 'jarvis-public-gateway-health'
      }
    });
    httpStatus = response.status;
  } catch {
    failed = true;
  } finally {
    clearTimeout(timer);
  }

  const status = statusFromHttp(httpStatus, failed);

  return {
    id: item.id,
    name: item.name,
    nStep: item.nStep,
    adapterId: item.adapterId,
    route: item.liveRoute,
    status,
    httpStatus,
    latencyMs: Date.now() - started,
    checkedAt,
    reason: reasonFromStatus(status, httpStatus),
    safeProbe: {
      method: 'GET',
      noPost: true,
      noToolExecution: true,
      noMutation: true,
      noSecretOutput: true
    }
  };
}

export async function buildJarvisPublicGatewayHealthProbe(options: ProbeOptions): Promise<JarvisPublicGatewayHealthProbe> {
  const checkedAt = new Date().toISOString();
  const safeOptions: Required<ProbeOptions> = {
    origin: options.origin,
    timeoutMs: options.timeoutMs ?? 2500
  };

  const items = await Promise.all(jarvisPublicIntegrationHudItems.map((item) => probeOneGateway(item, safeOptions)));
  const green = items.filter((item) => item.status === 'green').length;
  const yellow = items.filter((item) => item.status === 'yellow').length;
  const red = items.filter((item) => item.status === 'red').length;

  return {
    ok: true,
    mode: 'jarvis_public_gateway_health_probe',
    doctrine: {
      authority: 'Kingsmen backend and PostgreSQL evidence remain authority; this probe is a local route health readout only.',
      probeBoundary: 'GET status checks only. No POST requests, payload execution, browser automation, file scanning, document extraction, or voice command execution.',
      noExecution: 'The health probe cannot fix, commit, push, submit, pay, approve, reject, or bypass any policy gate.'
    },
    summary: {
      total: items.length,
      green,
      yellow,
      red,
      checkedAt
    },
    items
  };
}
