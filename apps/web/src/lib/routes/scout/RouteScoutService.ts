import type { PlaywrightScoutDecision, PlaywrightScoutGatewayRequest, PlaywrightScoutGatewayResult, PlaywrightScoutMode } from '@/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract';
import { assertPlaywrightScoutRequestSafe } from '@/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract';

const DEFAULT_ALLOWED_HOSTS = new Set([
  'cao.ac.za',
  'www.cao.ac.za',
  'nsfas.org.za',
  'www.nsfas.org.za',
  'www.gov.za',
  'www.dhet.gov.za',
]);

const DEFAULT_ALLOWED_SUFFIXES = ['.ac.za', '.edu.za', '.gov.za'];

const RISK_TERMS = [
  'captcha',
  'recaptcha',
  'hcaptcha',
  'otp',
  'one-time pin',
  'one time pin',
  'payment',
  'card number',
  'cvv',
  'password',
  'sign in',
  'login',
  'maintenance',
  'temporarily unavailable',
];

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

function evidenceId(routeId: string) {
  return `route_scout_${routeId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'route'}_${Date.now()}`;
}

function parseUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isHostAllowed(host: string, allowedHosts?: string[]) {
  const normalized = host.toLowerCase();
  const callerAllowed = new Set((allowedHosts ?? []).map((item) => item.toLowerCase().trim()).filter(Boolean));
  if (callerAllowed.has(normalized)) return true;
  if (DEFAULT_ALLOWED_HOSTS.has(normalized)) return true;
  return DEFAULT_ALLOWED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function extractTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? clean(title.replace(/<[^>]*>/g, '')) : undefined;
}

function extractTextSample(html: string) {
  return clean(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 1200);
}

function detectTerms(text: string) {
  const lower = text.toLowerCase();
  return RISK_TERMS.filter((term) => lower.includes(term));
}

function matchExpected(text: string, expectedKeywords?: string[]) {
  const lower = text.toLowerCase();
  return (expectedKeywords ?? []).filter((keyword) => keyword && lower.includes(keyword.toLowerCase()));
}

function decide(detectedRiskTerms: string[], blocked: boolean): { decision: PlaywrightScoutDecision; manualFallbackReason?: string } {
  if (blocked) return { decision: 'blocked', manualFallbackReason: 'URL is not allowlisted for Kingsmen route scouting.' };
  if (detectedRiskTerms.length > 0) {
    return { decision: 'manual_review', manualFallbackReason: `Risk terms detected: ${detectedRiskTerms.join(', ')}.` };
  }
  return { decision: 'clear' };
}

async function metadataFetch(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'KingsmenRouteScout/1.0 safe-read' },
    });
    const html = await response.text().catch(() => '');
    return { httpStatus: response.status, title: extractTitle(html), textSample: extractTextSample(html), warnings: [] as string[] };
  } catch (error) {
    return { httpStatus: undefined, title: undefined, textSample: '', warnings: [`Fetch probe failed: ${error instanceof Error ? error.message : 'unknown error'}`] };
  } finally {
    clearTimeout(timer);
  }
}

async function playwrightProbe(url: string) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await page.title().catch(() => undefined);
      const textSample = clean(await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 1200);
      return { httpStatus: response?.status(), title, textSample, warnings: [] as string[] };
    } finally {
      await browser.close().catch(() => undefined);
    }
  } catch (error) {
    return { httpStatus: undefined, title: undefined, textSample: '', warnings: [`Playwright probe failed: ${error instanceof Error ? error.message : 'unknown error'}`] };
  }
}

export async function scoutRouteSource(request: PlaywrightScoutGatewayRequest): Promise<PlaywrightScoutGatewayResult> {
  const startedAt = new Date().toISOString();
  const warnings = assertPlaywrightScoutRequestSafe(request);
  const parsed = parseUrl(request.url);
  const mode: PlaywrightScoutMode = request.mode ?? 'metadata_fetch';

  if (!parsed) {
    return {
      ok: false,
      decision: 'blocked',
      detectedRiskTerms: [],
      matchedExpectedKeywords: [],
      warnings: [...warnings, 'URL could not be parsed safely.'],
      manualFallbackReason: 'Invalid URL.',
      evidence: {
        adapterId: 'PlaywrightScoutGateway',
        repository: 'microsoft/playwright',
        routeId: request.routeId || 'missing',
        url: request.url,
        checkedAt: startedAt,
        mode,
        decision: 'blocked',
        maySubmit: false,
        mayBypassCaptcha: false,
        mayHandleOtp: false,
        mayHandlePayment: false,
      },
    };
  }

  const allowed = isHostAllowed(parsed.hostname, request.allowedHosts);
  if (!allowed) {
    const d = decide([], true);
    return {
      ok: false,
      decision: d.decision,
      detectedRiskTerms: [],
      matchedExpectedKeywords: [],
      warnings,
      manualFallbackReason: d.manualFallbackReason,
      evidence: {
        adapterId: 'PlaywrightScoutGateway',
        repository: 'microsoft/playwright',
        routeId: request.routeId,
        url: parsed.toString(),
        checkedAt: startedAt,
        mode,
        decision: d.decision,
        maySubmit: false,
        mayBypassCaptcha: false,
        mayHandleOtp: false,
        mayHandlePayment: false,
      },
    };
  }

  const probe = mode === 'playwright_page_probe' && request.approvalToken ? await playwrightProbe(parsed.toString()) : await metadataFetch(parsed.toString());
  const combinedText = `${probe.title ?? ''} ${probe.textSample ?? ''}`;
  const detectedRiskTerms = detectTerms(combinedText);
  const matchedExpectedKeywords = matchExpected(combinedText, request.expectedKeywords);
  const d = decide(detectedRiskTerms, false);

  return {
    ok: d.decision !== 'blocked' && probe.warnings.length === 0,
    decision: probe.warnings.length > 0 ? 'manual_review' : d.decision,
    httpStatus: probe.httpStatus,
    title: probe.title,
    detectedRiskTerms,
    matchedExpectedKeywords,
    warnings: [...warnings, ...probe.warnings],
    manualFallbackReason: probe.warnings.length > 0 ? 'Scout could not verify the route automatically; use MAP/manual review.' : d.manualFallbackReason,
    evidence: {
      adapterId: 'PlaywrightScoutGateway',
      repository: 'microsoft/playwright',
      routeId: request.routeId,
      url: parsed.toString(),
      checkedAt: startedAt,
      mode,
      decision: probe.warnings.length > 0 ? 'manual_review' : d.decision,
      maySubmit: false,
      mayBypassCaptcha: false,
      mayHandleOtp: false,
      mayHandlePayment: false,
    },
  };
}
