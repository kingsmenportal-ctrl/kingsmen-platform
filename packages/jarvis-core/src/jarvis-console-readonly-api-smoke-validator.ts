export interface JarvisConsoleReadOnlyApiSmokeValidatorResult {
  readonly validator: 'JarvisConsoleReadOnlyApiSmokeValidator';
  readonly passed: boolean;
  readonly routeRef: string;
  readonly missing: readonly string[];
  readonly safeSummary: string;
}

export function jarvisValidateConsoleReadOnlyApiSmoke(input: {
  readonly routeRef: string;
  readonly method: string;
  readonly readOnly: boolean;
  readonly hasResponse: boolean;
}): JarvisConsoleReadOnlyApiSmokeValidatorResult {
  const missing = [
    input.method === 'GET' ? '' : 'method:GET',
    input.readOnly ? '' : 'readOnly:true',
    input.hasResponse ? '' : 'response'
  ].filter(Boolean);

  return {
    validator: 'JarvisConsoleReadOnlyApiSmokeValidator',
    passed: missing.length === 0,
    routeRef: input.routeRef,
    missing,
    safeSummary: 'Checks read-only founder console API smoke shape.'
  };
}
