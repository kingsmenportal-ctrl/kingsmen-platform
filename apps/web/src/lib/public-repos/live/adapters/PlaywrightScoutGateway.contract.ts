export type PlaywrightScoutMode = 'metadata_fetch' | 'playwright_page_probe';

export type PlaywrightScoutDecision = 'clear' | 'manual_review' | 'blocked';

export interface PlaywrightScoutGatewayRequest {
  routeId: string;
  url: string;
  mode?: PlaywrightScoutMode;
  allowedHosts?: string[];
  expectedKeywords?: string[];
  approvalToken?: string;
}

export interface PlaywrightScoutGatewayEvidence {
  adapterId: 'PlaywrightScoutGateway';
  repository: 'microsoft/playwright';
  routeId: string;
  url: string;
  checkedAt: string;
  mode: PlaywrightScoutMode;
  decision: PlaywrightScoutDecision;
  maySubmit: false;
  mayBypassCaptcha: false;
  mayHandleOtp: false;
  mayHandlePayment: false;
}

export interface PlaywrightScoutGatewayResult {
  ok: boolean;
  decision: PlaywrightScoutDecision;
  httpStatus?: number;
  title?: string;
  detectedRiskTerms: string[];
  matchedExpectedKeywords: string[];
  warnings: string[];
  manualFallbackReason?: string;
  evidence: PlaywrightScoutGatewayEvidence;
}

export const PlaywrightScoutGatewayContract = {
  adapterId: 'PlaywrightScoutGateway',
  repository: 'microsoft/playwright',
  status: 'contract_ready',
  defaultMode: 'metadata_fetch',
  productionSubmitAllowed: false,
  requiresAllowlistedUrl: true,
  blockedActions: [
    'captcha_bypass',
    'otp_bypass',
    'payment_automation',
    'password_collection',
    'cookie_export',
    'official_application_submit',
    'form_fill_without_approval'
  ],
  allowedActions: [
    'open_allowlisted_public_url',
    'read_page_title',
    'read_safe_page_text_sample',
    'detect_risk_terms',
    'return_manual_fallback_reason',
    'create_scout_evidence'
  ],
  outputMustInclude: [
    'decision',
    'evidence',
    'detectedRiskTerms',
    'manualFallbackReason_when_needed',
    'maySubmit_false'
  ]
} as const;

export function assertPlaywrightScoutRequestSafe(request: PlaywrightScoutGatewayRequest): string[] {
  const warnings: string[] = [];
  if (!request.routeId?.trim()) warnings.push('routeId is required.');
  if (!request.url?.trim()) warnings.push('url is required.');
  if (request.url && !/^https?:\/\//i.test(request.url)) warnings.push('url must start with http:// or https://.');
  if (request.mode === 'playwright_page_probe' && !request.approvalToken) {
    warnings.push('playwright_page_probe requires approvalToken because it launches a browser probe.');
  }
  return warnings;
}
