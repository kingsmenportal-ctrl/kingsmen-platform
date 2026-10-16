import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import {
  assertCommandEnvelope,
  type CommandEnvelope
} from "./kernel/command-envelope";
import { evaluateCommandPolicy, type PolicyDecision } from "./policy/policy-middleware";
import {
  assertWorkflowResult,
  type WorkflowResultEnvelope
} from "./workflows/workflow-result";
import type {
  ApplicationWorkbenchReadModel,
  CandidateReadModel
} from "./read-models/candidate-read-model";
import type { KingsmenState } from "./state/state-machine";
import { TruthVaultRepository } from "./db/truth-vault-repository";
import {
  handleJarvisRuntimeControlWithAdapter,
  type JarvisRuntimeServerStore
} from "./jarvis/jarvis-runtime-server-adapter";
import type { ApiJarvisRuntimeResult } from "./jarvis/jarvis-runtime-api";
import { closePayFastItnPool, handlePayFastItn } from "./finance/payfast-itn-route";

const MAX_BODY_BYTES = 1_000_000;
const SERVICE_NAME = "kingsmen-api";
const truthVault = TruthVaultRepository.fromEnvironment();

type JsonObject = Record<string, unknown>;

type StoredCommand = {
  command: CommandEnvelope;
  policy: PolicyDecision;
  acceptedAtIso: string;
  status: "ACCEPTED" | "PENDING_APPROVAL";
};

type StoredWorkflowResult = {
  result: WorkflowResultEnvelope;
  receivedAtIso: string;
};

type StoredJarvisRuntimeResult = {
  result: ApiJarvisRuntimeResult;
  receivedAtIso: string;
};

type ApiRuntimeStore = {
  commands: Map<string, StoredCommand>;
  idempotencyKeys: Map<string, string>;
  workflowResults: Map<string, StoredWorkflowResult>;
  jarvisRuntimeResults: Map<string, StoredJarvisRuntimeResult>;
  candidates: Map<string, CandidateReadModel>;
  applications: Map<string, ApplicationWorkbenchReadModel>;
  startedAtIso: string;
};

export type KingsmenApiServerOptions = {
  port?: number;
  host?: string;
};

const store: ApiRuntimeStore = {
  commands: new Map(),
  idempotencyKeys: new Map(),
  workflowResults: new Map(),
  jarvisRuntimeResults: new Map(),
  candidates: new Map(),
  applications: new Map(),
  startedAtIso: new Date().toISOString()
};

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

function payloadObject(command: CommandEnvelope): JsonObject {
  if (command.payload && typeof command.payload === "object" && !Array.isArray(command.payload)) {
    return command.payload as JsonObject;
  }

  return {};
}

function stateFromCommand(command: CommandEnvelope): KingsmenState {
  switch (command.commandType) {
    case "candidate.intake.received":
      return "INTAKE_PENDING";
    case "candidate.profile.reviewed":
    case "application.evaluate.requested":
      return "EVALUATION_PENDING";
    case "document.uploaded":
      return "DOCUMENT_PENDING";
    case "application.execute.requested":
      return "EXECUTION_PENDING";
    case "workflow.result.received":
      return "EXECUTION_PENDING";
    case "finance.payment.recorded":
    case "communication.send.requested":
    case "manual.map.requested":
    case "system.override.requested":
    case "system.health.requested":
      return "NEW";
    default:
      return "NEW";
  }
}

function upsertReadModelsForCommand(command: CommandEnvelope): void {
  const payload = payloadObject(command);
  const candidateId = command.candidateId ?? safeText(payload.candidateId, "");
  const applicationId = command.applicationId ?? safeText(payload.applicationId, "");
  const currentState = stateFromCommand(command);

  if (candidateId) {
    const existing = store.candidates.get(candidateId);
    store.candidates.set(candidateId, {
      candidateId,
      displayName: safeText(payload.displayName ?? payload.fullName ?? payload.name, existing?.displayName ?? "Unknown candidate"),
      email: safeText(payload.email, existing?.email ?? "unknown@example.invalid"),
      currentState,
      activePackageCode: safeText(payload.activePackageCode, existing?.activePackageCode ?? "" ) || undefined,
      profileConfidence: existing?.profileConfidence ?? "LOW",
      documentReadiness: command.commandType === "document.uploaded" ? "PARTIAL" : existing?.documentReadiness ?? "MISSING",
      applicationReadiness: command.commandType === "application.evaluate.requested" ? "READY" : existing?.applicationReadiness ?? "NOT_READY",
      lastUpdatedAt: nowIso()
    });
  }

  if (applicationId && candidateId) {
    const existing = store.applications.get(applicationId);
    store.applications.set(applicationId, {
      applicationId,
      candidateId,
      routeType: existing?.routeType ?? "UNIVERSITY",
      sourceConfidenceBand: existing?.sourceConfidenceBand ?? "D",
      currentState,
      portalHealth: existing?.portalHealth ?? "UNKNOWN",
      mapFallbackRequired: existing?.mapFallbackRequired ?? false,
      lastEvidenceRef: existing?.lastEvidenceRef,
      lastUpdatedAt: nowIso()
    });
  }
}

function upsertReadModelsForWorkflowResult(result: WorkflowResultEnvelope): void {
  if (result.candidateId) {
    const existing = store.candidates.get(result.candidateId);
    store.candidates.set(result.candidateId, {
      candidateId: result.candidateId,
      displayName: existing?.displayName ?? "Unknown candidate",
      email: existing?.email ?? "unknown@example.invalid",
      currentState: result.finalState,
      activePackageCode: existing?.activePackageCode,
      profileConfidence: existing?.profileConfidence ?? "LOW",
      documentReadiness: existing?.documentReadiness ?? "PARTIAL",
      applicationReadiness: result.status === "MANUAL_REQUIRED" ? "MANUAL_REQUIRED" : existing?.applicationReadiness ?? "NOT_READY",
      lastUpdatedAt: nowIso()
    });
  }

  if (result.applicationId && result.candidateId) {
    const existing = store.applications.get(result.applicationId);
    store.applications.set(result.applicationId, {
      applicationId: result.applicationId,
      candidateId: result.candidateId,
      routeType: existing?.routeType ?? "UNIVERSITY",
      sourceConfidenceBand: existing?.sourceConfidenceBand ?? "D",
      currentState: result.finalState,
      portalHealth: result.status === "FAILED" ? "UNKNOWN" : existing?.portalHealth ?? "UNKNOWN",
      mapFallbackRequired: result.status === "MANUAL_REQUIRED" || existing?.mapFallbackRequired === true,
      lastEvidenceRef: result.evidenceRef ?? existing?.lastEvidenceRef,
      lastUpdatedAt: nowIso()
    });
  }
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown, correlationId?: string): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("pragma", "no-cache");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-kingsmen-service", SERVICE_NAME);
  if (correlationId) response.setHeader("x-correlation-id", correlationId);
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function sendError(response: ServerResponse, statusCode: number, code: string, message: string, correlationId?: string): void {
  sendJson(response, statusCode, {
    ok: false,
    code,
    message,
    correlationId: correlationId ?? null,
    generatedAtIso: nowIso()
  }, correlationId);
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    let receivedBytes = 0;
    let exceededLimit = false;
    let settled = false;

    request.on("data", (chunk: Buffer) => {
      if (exceededLimit || settled) return;
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        exceededLimit = true;
        settled = true;
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
        // Drain the request without retaining further bytes, avoiding both
        // unbounded memory growth and an unread request stream.
        request.resume();
        return;
      }
      body += chunk.toString("utf8");
    });

    request.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(body);
    });
    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const body = await readBody(request);
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function getPathParam(pattern: RegExp, pathname: string): string | null {
  const match = pathname.match(pattern);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function handleCommand(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJson(request);
  const command = assertCommandEnvelope(body as CommandEnvelope);
  const policy = evaluateCommandPolicy(command);

  if (!policy.allowed) {
    sendJson(response, 422, {
      ok: false,
      status: "BLOCKED_BY_POLICY",
      commandId: command.commandId,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      policy,
      generatedAtIso: nowIso()
    }, command.correlationId);
    return;
  }

  const status: StoredCommand["status"] = policy.requiresApproval ? "PENDING_APPROVAL" : "ACCEPTED";
  const responseBody = {
    ok: true,
    status,
    commandId: command.commandId,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    policy,
    storageMode: truthVault.storageMode,
    warning: truthVault.enabled ? undefined : "Runtime is deployable, but durable PostgreSQL/Supabase persistence is disabled for this process.",
    generatedAtIso: nowIso()
  };

  if (truthVault.enabled) {
    const stored = await truthVault.recordCommand({ command, policy, status, responseBody });
    if (stored.replay) {
      sendJson(response, 200, {
        ...(stored.responseBody as JsonObject),
        ok: true,
        status: "IDEMPOTENT_REPLAY",
        commandId: stored.commandId,
        correlationId: command.correlationId,
        idempotencyKey: command.idempotencyKey,
        storageMode: truthVault.storageMode,
        generatedAtIso: nowIso()
      }, command.correlationId);
      return;
    }

    sendJson(response, 202, responseBody, command.correlationId);
    return;
  }

  const duplicateCommandId = store.idempotencyKeys.get(command.idempotencyKey);
  if (duplicateCommandId) {
    sendJson(response, 200, {
      ok: true,
      status: "IDEMPOTENT_REPLAY",
      commandId: duplicateCommandId,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    }, command.correlationId);
    return;
  }

  store.commands.set(command.commandId, {
    command,
    policy,
    acceptedAtIso: nowIso(),
    status
  });
  store.idempotencyKeys.set(command.idempotencyKey, command.commandId);
  upsertReadModelsForCommand(command);

  sendJson(response, 202, responseBody, command.correlationId);
}

async function handleJarvisRuntimeControl(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const jarvisStore: JarvisRuntimeServerStore = {
    set: (commandRef, result) => store.jarvisRuntimeResults.set(commandRef, result)
  };

  await handleJarvisRuntimeControlWithAdapter(request, response, {
    readJson,
    sendJson,
    nowIso,
    storageMode: truthVault.storageMode,
    store: jarvisStore
  });
}

async function handleWorkflowResult(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJson(request);
  const result = assertWorkflowResult(body as WorkflowResultEnvelope);

  const responseBody = {
    ok: true,
    status: "WORKFLOW_RESULT_ACCEPTED",
    workflowRunId: result.workflowRunId,
    workflow: result.workflow,
    correlationId: result.correlationId,
    previousState: result.previousState,
    finalState: result.finalState,
    storageMode: truthVault.storageMode,
    warning: truthVault.enabled ? undefined : "Runtime is deployable, but durable PostgreSQL/Supabase persistence is disabled for this process.",
    generatedAtIso: nowIso()
  };

  if (truthVault.enabled) {
    const stored = await truthVault.recordWorkflowResult({ result, responseBody });
    if (stored.replay) {
      sendJson(response, 200, {
        ...(stored.responseBody as JsonObject),
        ok: true,
        status: "IDEMPOTENT_WORKFLOW_REPLAY",
        workflowRunId: stored.workflowRunId,
        correlationId: result.correlationId,
        storageMode: truthVault.storageMode,
        generatedAtIso: nowIso()
      }, result.correlationId);
      return;
    }

    sendJson(response, 202, responseBody, result.correlationId);
    return;
  }

  const duplicateWorkflowRunId = store.workflowResults.get(result.workflowRunId);
  if (duplicateWorkflowRunId) {
    sendJson(response, 200, {
      ok: true,
      status: "IDEMPOTENT_WORKFLOW_REPLAY",
      workflowRunId: result.workflowRunId,
      correlationId: result.correlationId,
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    }, result.correlationId);
    return;
  }

  store.workflowResults.set(result.workflowRunId, {
    result,
    receivedAtIso: nowIso()
  });
  upsertReadModelsForWorkflowResult(result);

  sendJson(response, 202, responseBody, result.correlationId);
}

async function handleHealth(response: ServerResponse): Promise<void> {
  // Liveness must remain available while dependencies recover. Readiness is
  // reported separately so memory-only mode is never advertised as production-ready.
  let truthVaultHealth: { ok: boolean; storageMode: string; message: string };
  try {
    truthVaultHealth = await truthVault.healthCheck();
  } catch {
    truthVaultHealth = {
      ok: false,
      storageMode: truthVault.storageMode,
      message: "Truth Vault connection check failed."
    };
  }

  const ready = truthVault.enabled && truthVaultHealth.ok;
  sendJson(response, 200, {
    ok: true,
    service: SERVICE_NAME,
    status: ready ? "healthy" : "degraded",
    readiness: ready ? "ready" : "not_ready",
    storageMode: truthVault.storageMode,
    truthVault: truthVaultHealth,
    jarvisRuntime: {
      route: "POST /api/jarvis/runtime-control",
      inMemoryResults: store.jarvisRuntimeResults.size,
      backendAuthority: true
    },
    startedAtIso: store.startedAtIso,
    generatedAtIso: nowIso(),
    routes: [
      "GET /health",
      "GET /ready",
      "POST /api/finance/payfast/itn",
      "GET /api/system/health",
      "POST /api/commands",
      "POST /api/jarvis/runtime-control",
      "POST /api/workflow/result",
      "POST /api/workflow-results",
      "GET /api/candidates/:candidateId/status",
      "GET /api/applications/:applicationId/workbench"
    ]
  });
}

async function handleReadiness(response: ServerResponse): Promise<void> {
  try {
    const truthVaultHealth = await truthVault.healthCheck();
    if (!truthVault.enabled || !truthVaultHealth.ok) {
      sendJson(response, 503, {
        ok: false,
        status: "not_ready",
        code: truthVault.enabled ? "TRUTH_VAULT_UNHEALTHY" : "DURABLE_STORAGE_DISABLED",
        storageMode: truthVault.storageMode,
        truthVault: truthVaultHealth,
        generatedAtIso: nowIso()
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      status: "ready",
      storageMode: truthVault.storageMode,
      truthVault: truthVaultHealth,
      generatedAtIso: nowIso()
    });
  } catch {
    sendJson(response, 503, {
      ok: false,
      status: "not_ready",
      code: "TRUTH_VAULT_UNHEALTHY",
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    });
  }
}

async function handleCandidateStatus(response: ServerResponse, _candidateId: string): Promise<void> {
  // No verified candidate identity is attached to requests. Never expose private
  // read models by identifier alone. Re-enable only behind verified auth middleware.
  sendError(
    response,
    503,
    "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
    "Candidate authorization is not configured."
  );
}

async function handleApplicationWorkbench(response: ServerResponse, _applicationId: string): Promise<void> {
  // Application IDs are not credentials. Require verified ownership authorization
  // before any database or in-memory read can occur.
  sendError(
    response,
    503,
    "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
    "Candidate authorization is not configured."
  );
}

export function createKingsmenApiServer() {
  return createServer(async (request, response) => {
    try {
      const host = request.headers.host ?? "localhost";
      const url = new URL(request.url ?? "/", `http://${host}`);
      const pathname = url.pathname;
      const method = request.method ?? "GET";

      // CORS is opt-in: never default to wildcard access. Requests without an
      // Origin (e.g. trusted server-to-server calls) continue through normal routing.
      const requestOrigin = request.headers.origin;
      const configuredOrigin = process.env.KINGSMEN_API_CORS_ORIGIN?.trim();
      if (requestOrigin && configuredOrigin && requestOrigin === configuredOrigin) {
        response.setHeader("access-control-allow-origin", configuredOrigin);
        response.setHeader("vary", "Origin");
        response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
        response.setHeader("access-control-allow-headers", "content-type,x-correlation-id,x-idempotency-key,authorization");
      } else if (requestOrigin) {
        sendError(response, 403, "CORS_ORIGIN_NOT_ALLOWED", "This request origin is not allowed.");
        return;
      }

      if (method === "OPTIONS") {
        response.statusCode = 204;
        response.end();
        return;
      }

      if (method === "GET" && pathname === "/ready") {
        await handleReadiness(response);
        return;
      }

      if (method === "GET" && (pathname === "/" || pathname === "/health" || pathname === "/api/system/health")) {
        await handleHealth(response);
        return;
      }

      if (pathname === "/api/finance/payfast/itn") {
        if (method !== "POST") {
          response.setHeader("allow", "POST");
          sendError(response, 405, "METHOD_NOT_ALLOWED", "Only POST is supported.");
          return;
        }
        await handlePayFastItn(request, response);
        return;
      }

      if (method === "POST" && pathname === "/api/jarvis/runtime-control") {
        await handleJarvisRuntimeControl(request, response);
        return;
      }

      if (method === "POST" && pathname === "/api/commands") {
        await handleCommand(request, response);
        return;
      }

      if (method === "POST" && (pathname === "/api/workflow/result" || pathname === "/api/workflow-results")) {
        await handleWorkflowResult(request, response);
        return;
      }

      const candidateId = getPathParam(/^\/api\/candidates\/([^/]+)\/status$/, pathname);
      if (method === "GET" && candidateId) {
        // These records can contain candidate-identifying information. The API
        // currently has no verified caller-to-candidate authorization adapter,
        // so do not expose records merely because an identifier is known.
        sendError(response, 503, "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED", "Candidate status is unavailable until authenticated ownership checks are configured.");
        return;
      }

      const applicationId = getPathParam(/^\/api\/applications\/([^/]+)\/workbench$/, pathname);
      if (method === "GET" && applicationId) {
        sendError(response, 503, "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED", "Application workbench is unavailable until authenticated ownership checks are configured.");
        return;
      }

      sendError(response, 404, "ROUTE_NOT_FOUND", `${method} ${pathname} is not a Kingsmen API route.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown server error.";
      const statusCode = message === "REQUEST_BODY_TOO_LARGE" ? 413 : message.includes("Invalid") ? 422 : 500;
      if (statusCode === 500) {
        console.error(JSON.stringify({
          service: SERVICE_NAME,
          event: "request_failed",
          errorName: error instanceof Error ? error.name : "UnknownError",
          generatedAtIso: nowIso()
        }));
        sendError(response, 500, "KINGSMEN_API_ERROR", "The request could not be completed.");
      } else {
        sendError(response, statusCode, "KINGSMEN_API_ERROR", message);
      }
    }
  });
}

export function startKingsmenApiServer(options: KingsmenApiServerOptions = {}) {
  const port = options.port ?? Number(process.env.PORT ?? process.env.KINGSMEN_API_PORT ?? 8080);
  const host = options.host ?? process.env.KINGSMEN_API_HOST ?? "0.0.0.0";
  const server = createKingsmenApiServer();

  server.listen(port, host, () => {
    console.log(JSON.stringify({
      service: SERVICE_NAME,
      event: "server_started",
      host,
      port,
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    }));
  });

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(JSON.stringify({
      service: SERVICE_NAME,
      event: "server_shutdown_requested",
      signal,
      generatedAtIso: nowIso()
    }));
    server.close(() => {
      Promise.all([truthVault.close(), closePayFastItnPool()]).finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}

if (require.main === module) {
  startKingsmenApiServer();
}
