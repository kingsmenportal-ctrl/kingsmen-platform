import type { JarvisConsoleBackendSnapshot } from '../../contracts/src/jarvis/console-backend-read-contract';

export interface JarvisConsoleApiReadHandlerInput {
  readonly nowIso: string;
  readonly snapshot: JarvisConsoleBackendSnapshot;
}

export interface JarvisConsoleApiReadHandlerResult {
  readonly route: '/founder/jarvis/console';
  readonly method: 'GET';
  readonly readOnly: true;
  readonly statusCode: 200;
  readonly body: JarvisConsoleBackendSnapshot;
}

export function jarvisConsoleApiReadHandler(
  input: JarvisConsoleApiReadHandlerInput,
): JarvisConsoleApiReadHandlerResult {
  return {
    route: '/founder/jarvis/console',
    method: 'GET',
    readOnly: true,
    statusCode: 200,
    body: {
      ...input.snapshot,
      generatedAtIso: input.nowIso,
    },
  };
}
