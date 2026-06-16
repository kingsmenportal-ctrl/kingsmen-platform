import { createHash, randomUUID } from "node:crypto";

export type KingsmenWebCommandType =
  | "candidate.intake.received"
  | "candidate.profile.reviewed"
  | "document.uploaded"
  | "application.evaluate.requested"
  | "application.execute.requested"
  | "workflow.result.received"
  | "manual.map.requested"
  | "communication.send.requested"
  | "finance.payment.recorded"
  | "system.override.requested"
  | "system.health.requested";

export interface KingsmenWebActor {
  readonly type: "candidate" | "founder" | "operator" | "system" | "worker" | "integration";
  readonly id: string;
  readonly displayName?: string;
}

export interface KingsmenWebCommandEnvelope<TPayload = unknown> {
  readonly commandId: string;
  readonly commandType: KingsmenWebCommandType;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly actor: KingsmenWebActor;
  readonly candidateId?: string;
  readonly applicationId?: string;
  readonly source: "portal" | "control_plane" | "worker" | "jarvis" | "api" | "system";
  readonly createdAt: string;
  readonly payload: TPayload;
}

export interface KingsmenBackendBoundary {
  readonly configured: boolean;
  readonly baseUrl: string | null;
  readonly timeoutMs: number;
  readonly mode: "backend_api_only";
  readonly noLocalShell: true;
  readonly noLocalFileWrites: true;
  readonly noDirectDatabaseAccessFromWeb: true;
}

export interface KingsmenBackendJsonResult<TData = unknown> {
  readonly ok: boolean;
  readonly status: number;
  readonly data: TData | null;
  readonly error: string | null;
  readonly boundary: KingsmenBackendBoundary;
}

const BACKEND_BASE_URL_ENV = "KINGSMEN_BACKEND_BASE_URL";
const BACKEND_TIMEOUT_MS_ENV = "KINGSMEN_BACKEND_TIMEOUT_MS";
const DEFAULT_TIMEOUT_MS = 15000;

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value.trim().replace(/\/+$/, "");
}

function timeoutMsFromEnvironment(): number {
  const raw = process.env[BACKEND_TIMEOUT_MS_ENV];
  if (!raw) return DEFAULT_TIMEOUT_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 60000) return DEFAULT_TIMEOUT_MS;

  return Math.floor(parsed);
}

export function getKingsmenBackendBoundary(): KingsmenBackendBoundary {
  const baseUrl = normalizeBaseUrl(process.env[BACKEND_BASE_URL_ENV]);

  return {
    configured: baseUrl !== null,
    baseUrl,
    timeoutMs: timeoutMsFromEnvironment(),
    mode: "backend_api_only",
    noLocalShell: true,
    noLocalFileWrites: true,
    noDirectDatabaseAccessFromWeb: true
  };
}

export function createCorrelationId(prefix = "web"): string {
  return `${prefix}_${Date.now()}_${randomUUID()}`;
}

export function createIdempotencyKey(prefix: string, stableInput: unknown): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(stableInput ?? {}), "utf8")
    .digest("hex")
    .slice(0, 32);

  return `${prefix}_${digest}`;
}

export function createKingsmenWebCommandEnvelope<TPayload>(input: {
  readonly commandType: KingsmenWebCommandType;
  readonly payload: TPayload;
  readonly actor: KingsmenWebActor;
  readonly source: KingsmenWebCommandEnvelope<TPayload>["source"];
  readonly candidateId?: string;
  readonly applicationId?: string;
  readonly commandIdPrefix?: string;
  readonly idempotencyKeyPrefix: string;
  readonly idempotencyInput: unknown;
  readonly correlationId?: string;
}): KingsmenWebCommandEnvelope<TPayload> {
  const correlationId = input.correlationId ?? createCorrelationId("web_corr");
  const commandIdPrefix = input.commandIdPrefix ?? "web_cmd";

  return {
    commandId: `${commandIdPrefix}_${Date.now()}_${randomUUID()}`,
    commandType: input.commandType,
    idempotencyKey: createIdempotencyKey(input.idempotencyKeyPrefix, input.idempotencyInput),
    correlationId,
    actor: input.actor,
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    source: input.source,
    createdAt: new Date().toISOString(),
    payload: input.payload
  };
}

export async function kingsmenBackendJson<TData = unknown>(
  pathname: string,
  init: RequestInit = {}
): Promise<KingsmenBackendJsonResult<TData>> {
  const boundary = getKingsmenBackendBoundary();

  if (!boundary.configured || !boundary.baseUrl) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: `${BACKEND_BASE_URL_ENV} is not configured. Public web routes must use the backend API boundary.`,
      boundary
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), boundary.timeoutMs);

  try {
    const response = await fetch(`${boundary.baseUrl}${pathname}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {})
      },
      signal: controller.signal
    });

    const data = (await response.json().catch(() => null)) as TData | null;

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : `Backend API returned HTTP ${response.status}.`,
      boundary
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Unknown backend API boundary error.",
      boundary
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function postKingsmenCommand<TPayload, TResponse = unknown>(
  command: KingsmenWebCommandEnvelope<TPayload>
): Promise<KingsmenBackendJsonResult<TResponse>> {
  return kingsmenBackendJson<TResponse>("/api/commands", {
    method: "POST",
    body: JSON.stringify(command)
  });
}

export async function getKingsmenApiHealth<TResponse = unknown>(): Promise<KingsmenBackendJsonResult<TResponse>> {
  return kingsmenBackendJson<TResponse>("/api/system/health", {
    method: "GET"
  });
}
