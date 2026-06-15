export type JarvisConsoleProviderStatus = 'ready' | 'partial' | 'empty';

export interface JarvisConsoleDataProviderSnapshot {
  readonly providerRef: string;
  readonly status: JarvisConsoleProviderStatus;
  readonly generatedAt: string;
  readonly source: 'fixture' | 'server-read' | 'mixed-read';
  readonly hudPanels: readonly unknown[];
  readonly reviewItems: readonly unknown[];
  readonly validationReports: readonly unknown[];
  readonly buildSessions: readonly unknown[];
  readonly safeSummary: string;
}

export interface JarvisConsoleDataProviderInterface {
  readonly providerName: string;
  readonly providerMode: 'read-only';
  loadSnapshot(): Promise<JarvisConsoleDataProviderSnapshot> | JarvisConsoleDataProviderSnapshot;
}

export const JARVIS_CONSOLE_DATA_PROVIDER_INTERFACE = 'JarvisConsoleDataProviderInterface';
