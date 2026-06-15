export interface JarvisConsoleRouteSmokeTestInput {
  readonly route: string;
  readonly html: string;
}

export interface JarvisConsoleRouteSmokeTestResult {
  readonly checkName: 'JarvisConsoleRouteSmokeTest';
  readonly passed: boolean;
  readonly findings: readonly string[];
}

export function jarvisConsoleRouteSmokeTest(
  input: JarvisConsoleRouteSmokeTestInput,
): JarvisConsoleRouteSmokeTestResult {
  const findings: string[] = [];

  if (input.route !== '/founder/jarvis/console') findings.push('route_mismatch');
  if (!input.html.includes('Kingsmen Jarvis Founder Console')) findings.push('missing_console_title');
  if (!input.html.includes('data-jarvis-console')) findings.push('missing_console_marker');

  return {
    checkName: 'JarvisConsoleRouteSmokeTest',
    passed: findings.length === 0,
    findings,
  };
}
