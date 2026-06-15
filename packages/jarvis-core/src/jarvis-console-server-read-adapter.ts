export interface JarvisConsoleServerReadAdapterDescriptor {
  readonly adapterRef: 'jarvis-console-server-read-adapter';
  readonly providerMode: 'read-only';
  readonly outputKind: 'founder-console-view-model';
  readonly mutationAllowed: false;
  readonly safeSummary: string;
}

export function jarvisDescribeConsoleServerReadAdapter(): JarvisConsoleServerReadAdapterDescriptor {
  return {
    adapterRef: 'jarvis-console-server-read-adapter',
    providerMode: 'read-only',
    outputKind: 'founder-console-view-model',
    mutationAllowed: false,
    safeSummary: 'Read-only console read adapter descriptor. It prepares view data only.',
  };
}

export const JARVIS_CONSOLE_SERVER_READ_ADAPTER = 'JarvisConsoleServerReadAdapter';
