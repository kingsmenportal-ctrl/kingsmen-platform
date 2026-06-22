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

export interface JarvisRuntimeEvidenceStorageResult {
  readonly attempted: boolean;
  readonly accepted: boolean;
  readonly storageMode: string;
  readonly evidenceRef?: string;
  readonly message?: string;
}

export interface JarvisRuntimeServerAdapterOptions {
  readonly readJson: (request: IncomingMessage) => Promise<unknown>;
  readonly sendJson: (response: ServerResponse, statusCode: number, body: unknown, correlationId?: string) => void;
  readonly nowIso: () => string;
  readonly storageMode: string;
  readonly store: JarvisRuntimeServerStore;
  readonly recordEvidence?: (result: ApiJarvisRuntimeResult) => Promise<JarvisRuntimeEvidenceStorageResult>;
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

  const evidenceStorage = options.recordEvidence
    ? await options.recordEvidence(result)
    : {
      attempted: true,
      accepted: true,
      storageMode: options.storageMode,
      message: "Jarvis runtime result stored in API process memory."
    };

  options.sendJson(response, statusCode, {
    ...result,
    evidenceStorage
  }, result.correlationId);
}
