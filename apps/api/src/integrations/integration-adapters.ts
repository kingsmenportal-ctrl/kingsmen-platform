export interface IntegrationAdapterResult<TPayload = unknown> {
  ok: boolean;
  provider: string;
  correlationId: string;
  evidenceRef?: string;
  payload?: TPayload;
  errorCode?: string;
  message: string;
}

export interface AirtableMirrorAdapter {
  writeMirrorRecord(input: unknown): Promise<IntegrationAdapterResult>;
}

export interface N8nThinWorkerAdapter {
  postWorkflowResult(input: unknown): Promise<IntegrationAdapterResult>;
}

export interface PlaywrightScoutAdapter {
  probePortal(input: unknown): Promise<IntegrationAdapterResult<{
    portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
    mapFallbackRequired: boolean;
  }>>;
}

export interface EmailPrimaryAdapter {
  sendEmail(input: unknown): Promise<IntegrationAdapterResult>;
}

export interface PayfastAdapter {
  verifyPayment(input: unknown): Promise<IntegrationAdapterResult>;
}

export function blockedPortalToMapReason(portalHealth: string): string | null {
  if (portalHealth === "OTP_REQUIRED") return "OTP required; route to manual MAP.";
  if (portalHealth === "CAPTCHA_BLOCKED") return "CAPTCHA blocked; route to manual MAP.";
  if (portalHealth === "DOWN") return "Portal down; route to manual MAP.";
  if (portalHealth === "MANUAL_ONLY") return "Manual-only portal; route to MAP.";
  return null;
}