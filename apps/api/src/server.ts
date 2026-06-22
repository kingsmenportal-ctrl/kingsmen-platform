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
  buildPayFastCancelResponse,
  buildPayFastItnHttpResponse,
  buildPayFastReturnPendingResponse,
  buildPayFastStatusPendingResponse,
  parsePayFastFormBody
} from "./finance/payfast-http-routes";
import { PayFastFinanceRepository } from "./finance/payfast-finance-repository";

const MAX_BODY_BYTES = 1_000_000;
const SERVICE_NAME = "kingsmen-api";
const truthVault = TruthVaultRepository.fromEnvironment();
const payfastFinance = PayFastFinanceRepository.fromEnvironment();

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

type ApiRuntimeStore = {
  commands: Map<string, StoredCommand>;
  idempotencyKeys: Map<string, string>;
  workflowResults: Map<string, StoredWorkflowResult>;
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

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
      if (body.length > MAX_BODY_BYTES) {
        request.destroy();
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
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

function remoteAddress(request: IncomingMessage): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const first = raw?.split(",")[0]?.trim() || request.socket.remoteAddress || "";
  return first.replace(/^::ffff:/, "");
}

function queryMerchantReference(url: URL): string | undefined {
  return url.searchParams.get("m_payment_id") ?? url.searchParams.get("merchantReference") ?? undefined;
}

function isPayFastItnSourceVerified(request: IncomingMessage): boolean {
  if (process.env.PAYFAST_ITN_SOURCE_VERIFIED === "true") return true;

  const address = remoteAddress(request);
  const allowlist = (process.env.PAYFAST_ITN_ALLOWED_IPS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowlist.includes(address)) return true;

  const mode = process.env.PAYFAST_ITN_SOURCE_MODE ?? "strict";
  const localAddresses = new Set(["127.0.0.1", "::1", "localhost"]);
  return mode === "local_sandbox_only" && localAddresses.has(address);
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

async function handlePayFastItn(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const rawBody = await readBody(request);
  const payload = parsePayFastFormBody(rawBody);
  const merchantReference = typeof payload.m_payment_id === "string" ? payload.m_payment_id : "";

  if (!merchantReference) {
    sendError(response, 422, "PAYFAST_ITN_MISSING_MERCHANT_REFERENCE", "PayFast ITN missing m_payment_id.");
    return;
  }

  const expectation = await payfastFinance.findIntentExpectation(merchantReference);
  if (!expectation) {
    sendError(response, 404, "PAYFAST_INTENT_NOT_FOUND", `No PayFast payment intent found for ${merchantReference}.`);
    return;
  }

  const sourceVerified = isPayFastItnSourceVerified(request);
  const firstPass = buildPayFastItnHttpResponse({
    env: process.env,
    rawBody,
    expectedMerchantReference: expectation.merchantReference,
    expectedAmountCents: expectation.amountCents,
    duplicate: false,
    ipValid: sourceVerified
  });

  const duplicate = firstPass.validation ? await payfastFinance.hasItnReceipt(firstPass.validation.idempotencyKey) : false;
  const responseBody = duplicate
    ? buildPayFastItnHttpResponse({
        env: process.env,
        rawBody,
        expectedMerchantReference: expectation.merchantReference,
        expectedAmountCents: expectation.amountCents,
        duplicate: true,
        ipValid: sourceVerified
      })
    : firstPass;

  const persistence = responseBody.validation
    ? await payfastFinance.recordItnResult({ validation: responseBody.validation, payload, expectation })
    : null;

  sendJson(response, responseBody.ok ? 200 : 422, {
    ...responseBody,
    persistence,
    financeStorageMode: payfastFinance.storageMode
  });
}

async function handlePayFastReturn(response: ServerResponse, url: URL): Promise<void> {
  sendJson(response, 200, buildPayFastReturnPendingResponse({
    env: process.env,
    merchantReference: queryMerchantReference(url)
  }));
}

async function handlePayFastCancel(response: ServerResponse, url: URL): Promise<void> {
  sendJson(response, 200, buildPayFastCancelResponse({
    env: process.env,
    merchantReference: queryMerchantReference(url)
  }));
}

async function handlePayFastStatus(response: ServerResponse, merchantReference: string): Promise<void> {
  const status = await payfastFinance.readPaymentStatus(merchantReference);
  if (status) {
    sendJson(response, 200, {
      ok: true,
      status: "PAYFAST_STATUS_READ",
      payment: status,
      financeStorageMode: payfastFinance.storageMode,
      generatedAtIso: nowIso()
    });
    return;
  }

  sendJson(response, 200, {
    ...buildPayFastStatusPendingResponse({ env: process.env, merchantReference }),
    financeStorageMode: payfastFinance.storageMode
  });
}

async function handleHealth(response: ServerResponse): Promise<void> {
  const truthVaultHealth = await truthVault.healthCheck();
  const payfastFinanceHealth = await payfastFinance.healthCheck();
  sendJson(response, 200, {
    ok: true,
    service: SERVICE_NAME,
    status: "healthy",
    storageMode: truthVault.storageMode,
    truthVault: truthVaultHealth,
    payfastFinance: payfastFinanceHealth,
    startedAtIso: store.startedAtIso,
    generatedAtIso: nowIso(),
    routes: [
      "GET /health",
      "GET /api/system/health",
      "POST /api/commands",
      "POST /api/workflow/result",
      "POST /api/workflow-results",
      "POST /api/payments/payfast/itn",
      "GET /api/payments/payfast/return",
      "GET /api/payments/payfast/cancel",
      "GET /api/payments/payfast/status/:merchantReference",
      "GET /api/candidates/:candidateId/status",
      "GET /api/applications/:applicationId/workbench"
    ]
  });
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

      if (method === "POST" && pathname === "/api/commands") {
        await handleCommand(request, response);
        return;
      }

      if (method === "POST" && (pathname === "/api/workflow/result" || pathname === "/api/workflow-results")) {
        await handleWorkflowResult(request, response);
        return;
      }

      if (method === "POST" && pathname === "/api/payments/payfast/itn") {
        await handlePayFastItn(request, response);
        return;
      }

      if (method === "GET" && pathname === "/api/payments/payfast/return") {
        await handlePayFastReturn(response, url);
        return;
      }

      if (method === "GET" && pathname === "/api/payments/payfast/cancel") {
        await handlePayFastCancel(response, url);
        return;
      }

      const payfastStatusRef = getPathParam(/^\/api\/payments\/payfast\/status\/([^/]+)$/, pathname);
      if (method === "GET" && payfastStatusRef) {
        await handlePayFastStatus(response, payfastStatusRef);
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
      financeStorageMode: payfastFinance.storageMode,
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
      Promise.all([truthVault.close(), payfastFinance.close()]).finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}

if (require.main === module) {
  startKingsmenApiServer();
}
