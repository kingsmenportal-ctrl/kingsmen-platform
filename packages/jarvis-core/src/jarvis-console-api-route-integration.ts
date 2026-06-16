export interface JarvisConsoleApiRouteIntegration {
  readonly integrationRef: string;
  readonly routePath: '/founder/jarvis/console';
  readonly method: 'GET';
  readonly readOnly: true;
  readonly providerRef: string;
  readonly responseContractRef: string;
  readonly requiredPanels: readonly string[];
  readonly safeSummary: string;
}

export function jarvisCreateConsoleApiRouteIntegration(input: {
  readonly integrationRef: string;
  readonly providerRef: string;
  readonly responseContractRef: string;
  readonly requiredPanels?: readonly string[];
}): JarvisConsoleApiRouteIntegration {
  return {
    integrationRef: input.integrationRef,
    routePath: '/founder/jarvis/console',
    method: 'GET',
    readOnly: true,
    providerRef: input.providerRef,
    responseContractRef: input.responseContractRef,
    requiredPanels: input.requiredPanels ?? [
      'hud',
      'buildSessions',
      'reviewQueue',
      'validationReports'
    ],
    safeSummary: 'Read-only founder console route integration for Jarvis HUD data.'
  };
}
