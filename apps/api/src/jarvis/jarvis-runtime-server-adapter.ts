import type { IncomingMessage, ServerResponse } from "node:http";

import {
  apiJarvisDecisionToHttpStatus,
  evaluateApiJarvisRuntime,
  type ApiJarvisRuntimeRequest,
  type ApiJarvisRuntimeResult
} from "./jarvis-runtime-api";

export interface JarvisRuntimeServerStore {
  readonly set: (commandRef: string, result: { readonly result: ApiJarvisRuntimeResult; readonly receivedAtIso: string }) => void;
}

export interface JarvisRuntimeServerAdapterOptions {
  readonly readJson: (request: IncomingMessage) => Promise<unknown>;
  readonly sendJson: (response: ServerResponse, statusCode: number, body: unknown, correlationId?: string) => void;
  readonly nowIso: () => string;
  readonly storageMode: string;
  readonly store: JarvisRuntimeServerStore;
}

export async function handleJarvisRuntimeControlWithAdapter(
  request: IncomingMessage,
  response: ServerResponse,
  options: JarvisRuntimeServerAdapterOptions
): Promise<void> {
  const body = await options.readJson(request);
  const result = evaluateApiJarvisRuntime(body as ApiJarvisRuntimeRequest);
  const statusCode = apiJarvisDecisionToHttpStatus(result);

  options.store.set(result.commandRef, {
    result,
    receivedAtIso: options.nowIso()
  });

  options.sendJson(response, statusCode, {
    ...result,
    evidenceStorage: {
      attempted: true,
      accepted: true,
      storageMode: options.storageMode
    }
  }, result.correlationId);
}
