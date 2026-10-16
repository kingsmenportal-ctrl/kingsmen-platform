import { handleFounderComponentRoute } from "./components/founder-router";
import { handleCandidateComponentRoute } from "./components/candidate-router";
import { handlePayFastWebhook } from "./components/payfast-webhook";
import { processPayFastCallback } from "./components/payfast-callback";
import { SupabasePaymentCallbackStore } from "./components/supabase-payment-store";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { timingSafeEqual } from "node:crypto";

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

function authorizeApiRequest(request: IncomingMessage, response: ServerResponse): boolean {
  const runtimeEnvironment = (process.env.NODE_ENV ?? "development").toLowerCase();
  const productionLike = runtimeEnvironment === "production" || runtimeEnvironment === "staging";
  const configuredToken = process.env.KINGSMEN_API_AUTH_TOKEN ?? "";

  // Local development stays credential-free unless a token is explicitly configured.
  // Staging/production fail closed if the shared service-to-service token is absent or weak.
  if (!configuredToken) {
    if (productionLike) {
      sendError(response, 503, "API_AUTH_NOT_CONFIGURED", "API authentication is not configured for this environment.");
      return false;
    }
    return true;
  }

  if (configuredToken.length < 32) {
    sendError(response, 503, "API_AUTH_MISCONFIGURED", "API authentication configuration is invalid.");
    return false;
  }

  const authorization = request.headers.authorization ?? "";
  const match = authorization.match(/^Bearer (\S+)$/);
  const supplied = match?.[1] ?? "";
  const expectedBytes = Buffer.from(configuredToken, "utf8");
  const suppliedBytes = Buffer.from(supplied, "utf8");
  const matches = suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);

  if (!matches) {
    response.setHeader("www-authenticate", "Bearer");
    sendError(response, 401, "UNAUTHORIZED", "A valid bearer token is required.");
    return false;
  }

  return true;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    let rejectedForSize = false;

    request.on("data", (chunk: Buffer) => {
      if (rejectedForSize) return;
      body += chunk.toString("utf8");
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        // Stop retaining request data, but keep the socket alive long enough to return
        // a structured 413 response instead of resetting the client's connection.
        rejectedForSize = true;
        body = "";
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
      }
    });

    request.on("end", () => {
      if (!rejectedForSize) resolve(body);
    });
    request.on("error", (error) => {
      if (!rejectedForSize) reject(error);
    });
  });
}

async function readPayFastRawBody(request: IncomingMessage): Promise<string> {
  const contentType = (request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/x-www-form-urlencoded") throw new Error("PAYFAST_CONTENT_TYPE_INVALID");
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    request.on("data", (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > 16_384) {
        settled = true;
        chunks.length = 0;
        reject(new Error("PAYFAST_BODY_TOO_LARGE"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!settled) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", (error) => {
      if (!settled) reject(error);
    });
  });
}

function payFastConfigFromEnvironment() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? "";
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  const environment = (process.env.PAYFAST_ENVIRONMENT ?? "sandbox").toLowerCase();
  if (!merchantId || !passphrase || (environment !== "sandbox" && environment !== "live")) {
    throw new Error("PAYFAST_NOT_CONFIGURED");
  }
  if (environment === "live" && process.env.NODE_ENV !== "production") {
    throw new Error("PAYFAST_LIVE_REQUIRES_PRODUCTION");
  }
  return { merchantId, passphrase, environment: environment as "sandbox" | "live" };
}

async function handlePayFastWebhook(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const rawBody = await readPayFastRawBody(request);
    const result = await processPayFastCallback(
      rawBody,
      payFastConfigFromEnvironment(),
      new SupabasePaymentCallbackStore()
    );
    // A 200 is emitted only after the persistence RPC has committed successfully.
    sendJson(response, 200, result.body);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const clientErrors = new Set([
      "PAYFAST_BODY_TOO_LARGE", "PAYFAST_CONTENT_TYPE_INVALID", "PAYFAST_DUPLICATE_PARAMETER",
      "PAYFAST_SIGNATURE_MISSING", "PAYFAST_SIGNATURE_INVALID", "PAYFAST_PAYMENT_REFERENCE_INVALID",
      "PAYFAST_PROVIDER_PAYMENT_ID_INVALID", "PAYFAST_MERCHANT_ID_MISMATCH", "PAYFAST_PAYMENT_STATUS_INVALID",
      "PAYFAST_PAYMENT_REFERENCE_MISMATCH", "PAYFAST_AMOUNT_MISMATCH", "PAYFAST_INVOICE_NOT_FOUND",
      "PAYFAST_INVOICE_NOT_PAYABLE", "PAYFAST_CURRENCY_UNSUPPORTED", "PAYFAST_CONFIRMATION_INVALID",
      "PAYFAST_CONFIRMATION_HTTP_ERROR"
    ]);
    const unavailable = new Set([
      "PAYFAST_NOT_CONFIGURED", "PAYFAST_LIVE_REQUIRES_PRODUCTION", "PAYFAST_CONFIRMATION_UNAVAILABLE",
      "PAYMENT_DATABASE_NOT_CONFIGURED", "PAYMENT_DATABASE_URL_INVALID", "PAYMENT_DATABASE_UNAVAILABLE",
      "PAYMENT_DATABASE_SCHEMA_NOT_READY", "PAYMENT_DATABASE_WRITE_FAILED"
    ]);
    const status = clientErrors.has(code) ? 400 : unavailable.has(code) ? 503 : 500;
    sendJson(response, status, {
      ok: false,
      code: /^[A-Z0-9_]+$/.test(code) ? code : "PAYFAST_PROCESSING_FAILED",
      message: status === 400 ? "PayFast notification was rejected." :
        status === 503 ? "Payment verification or persistence is temporarily unavailable." :
        "Payment notification could not be safely committed."
    });
  }
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
  const truthVaultHealth = await truthVault.healthCheck();
  sendJson(response, 200, {
    ok: true,
    service: SERVICE_NAME,
    status: "healthy",
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
  // Readiness is deliberately stricter than liveness: volatile memory mode cannot serve
  // as a ready staging/production backend even when the HTTP process is alive.
  if (!truthVault.enabled) {
    sendJson(response, 503, {
      ok: false,
      service: SERVICE_NAME,
      status: "not_ready",
      reason: "durable_truth_vault_disabled",
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    });
    return;
  }

  try {
    const health = await truthVault.healthCheck();
    sendJson(response, health.ok ? 200 : 503, {
      ok: health.ok,
      service: SERVICE_NAME,
      status: health.ok ? "ready" : "not_ready",
      storageMode: truthVault.storageMode,
      truthVault: health,
      generatedAtIso: nowIso()
    });
  } catch {
    // Do not leak database URLs, driver details, or credentials through health endpoints.
    sendJson(response, 503, {
      ok: false,
      service: SERVICE_NAME,
      status: "not_ready",
      reason: "truth_vault_unavailable",
      storageMode: truthVault.storageMode,
      generatedAtIso: nowIso()
    });
  }
}

async function handleCandidateStatus(response: ServerResponse, candidateId: string): Promise<void> {
  if (truthVault.enabled) {
    const candidate = await truthVault.readCandidateStatus(candidateId);
    if (!candidate) {
      sendError(response, 404, "CANDIDATE_READ_MODEL_NOT_FOUND", `No candidate read model found for ${candidateId}.`);
      return;
    }

    sendJson(response, 200, { ok: true, candidate, storageMode: truthVault.storageMode, generatedAtIso: nowIso() });
    return;
  }

  const candidate = store.candidates.get(candidateId);
  if (!candidate) {
    sendError(response, 404, "CANDIDATE_READ_MODEL_NOT_FOUND", `No candidate read model found for ${candidateId}.`);
    return;
  }

  sendJson(response, 200, {
    ok: true,
    candidate,
    storageMode: truthVault.storageMode,
    generatedAtIso: nowIso()
  });
}

async function handleApplicationWorkbench(response: ServerResponse, applicationId: string): Promise<void> {
  if (truthVault.enabled) {
    const application = await truthVault.readApplicationWorkbench(applicationId);
    if (!application) {
      sendError(response, 404, "APPLICATION_WORKBENCH_NOT_FOUND", `No application workbench found for ${applicationId}.`);
      return;
    }

    sendJson(response, 200, { ok: true, application, storageMode: truthVault.storageMode, generatedAtIso: nowIso() });
    return;
  }

  const application = store.applications.get(applicationId);
  if (!application) {
    sendError(response, 404, "APPLICATION_WORKBENCH_NOT_FOUND", `No application workbench found for ${applicationId}.`);
    return;
  }

  sendJson(response, 200, {
    ok: true,
    application,
    storageMode: truthVault.storageMode,
    generatedAtIso: nowIso()
  });
}

export function createKingsmenApiServer() {
  return createServer(async (request, response) => {
    try {
      const host = request.headers.host ?? "localhost";
      const url = new URL(request.url ?? "/", `http://${host}`);
      const pathname = url.pathname;
      const method = request.method ?? "GET";

      response.setHeader("access-control-allow-origin", process.env.KINGSMEN_API_CORS_ORIGIN ?? "*");
      response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
      response.setHeader("access-control-allow-headers", "content-type,x-correlation-id,x-idempotency-key,authorization");

      if (method === "OPTIONS") {
        response.statusCode = 204;
        response.end();
        return;
      }

      if (method === "GET" && (pathname === "/" || pathname === "/health" || pathname === "/api/system/health")) {
        await handleHealth(response);
        return;
      }

      if (method === "GET" && pathname === "/ready") {
        await handleReadiness(response);
        return;
      }

      // Provider webhook: raw form body, PayFast verification, and durable atomic commit.
      // This route intentionally bypasses the shared service token; verification is its authentication.
      if (method === "POST" && pathname === "/api/webhooks/payfast/itn") {
        await handlePayFastWebhook(request, response);
        return;
      }

      // Provider ITNs are public callbacks; handler validates raw form, signature, PayFast confirmation and durable commit.
      if (await handlePayFastWebhook(request, response)) return;

      // User-context routes use the caller JWT and RLS, never the service-to-service token.
      if (await handleCandidateComponentRoute(request, response, pathname, method)) return;
      if (await handleFounderComponentRoute(request, response, pathname, method)) return;

      // Health endpoints stay public for load balancers; all application/read-model routes
      // require service authentication in staging/production.
      if (!authorizeApiRequest(request, response)) return;

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
        await handleCandidateStatus(response, candidateId);
        return;
      }

      const applicationId = getPathParam(/^\/api\/applications\/([^/]+)\/workbench$/, pathname);
      if (method === "GET" && applicationId) {
        await handleApplicationWorkbench(response, applicationId);
        return;
      }

      sendError(response, 404, "ROUTE_NOT_FOUND", `${method} ${pathname} is not a Kingsmen API route.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown server error.";
      const statusCode = message === "REQUEST_BODY_TOO_LARGE" ? 413 : message.includes("Invalid") ? 422 : 500;
      sendError(response, statusCode, "KINGSMEN_API_ERROR", message);
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
      truthVault.close().finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}

if (require.main === module) {
  startKingsmenApiServer();
}
