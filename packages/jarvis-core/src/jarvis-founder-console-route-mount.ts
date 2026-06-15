export type JarvisFounderConsoleRouteMount = {
  routeId: string;
  path: string;
  title: string;
  readOnly: true;
  source: 'jarvis-founder-console-static-html';
  safeSummary: string;
};

export function jarvisCreateFounderConsoleRouteMount(): JarvisFounderConsoleRouteMount {
  return {
    routeId: 'jarvis-founder-console',
    path: '/founder/jarvis',
    title: 'Kingsmen Jarvis Founder Console',
    readOnly: true,
    source: 'jarvis-founder-console-static-html',
    safeSummary: 'Read-only founder console route for Jarvis HUD and validation views.',
  };
}
