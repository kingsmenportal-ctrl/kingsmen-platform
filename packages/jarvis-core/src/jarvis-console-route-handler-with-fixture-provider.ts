import { jarvisCreateConsoleResponseFixture } from './jarvis-console-response-fixture';

export interface JarvisConsoleRouteHandlerWithFixtureProviderInput {
  readonly routeRef: string;
  readonly requestedAtIso: string;
}

export function jarvisCreateConsoleRouteHandlerWithFixtureProvider(
  input: JarvisConsoleRouteHandlerWithFixtureProviderInput
) {
  const fixture = jarvisCreateConsoleResponseFixture({
    responseRef: `${input.routeRef}:fixture-response`,
    generatedAtIso: input.requestedAtIso
  });

  return {
    routeRef: input.routeRef,
    method: 'GET' as const,
    readOnly: true as const,
    response: fixture,
    safeSummary: 'Read-only Jarvis founder console route served from deterministic fixture provider.'
  };
}
