export interface JarvisFounderConsoleRealRouteFile {
  readonly routeRef: string;
  readonly path: '/founder/jarvis';
  readonly method: 'GET';
  readonly mode: 'read-only';
  readonly handlerName: 'jarvisFounderConsoleServerReadAdapter';
  readonly viewModelName: 'JarvisConsoleViewModel';
  readonly safeSummary: string;
}

export function jarvisCreateFounderConsoleRealRouteFile(): JarvisFounderConsoleRealRouteFile {
  return {
    routeRef: 'jarvis-founder-console-real-route-file',
    path: '/founder/jarvis',
    method: 'GET',
    mode: 'read-only',
    handlerName: 'jarvisFounderConsoleServerReadAdapter',
    viewModelName: 'JarvisConsoleViewModel',
    safeSummary: 'Read-only founder Jarvis console route descriptor. No production action is executed here.',
  };
}

export const JARVIS_FOUNDER_CONSOLE_REAL_ROUTE_FILE = 'JarvisFounderConsoleRealRouteFile';
