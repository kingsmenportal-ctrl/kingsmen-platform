import type { ApiJarvisRuntimeRequest, ApiJarvisRuntimeResult } from "./jarvis-runtime-api";

export const JARVIS_RUNTIME_CONTROL_ROUTE = "/api/jarvis/runtime-control" as const;
export const JARVIS_RUNTIME_CONTROL_METHOD = "POST" as const;

export interface JarvisRuntimeRouteContract {
  readonly method: typeof JARVIS_RUNTIME_CONTROL_METHOD;
  readonly route: typeof JARVIS_RUNTIME_CONTROL_ROUTE;
  readonly request: ApiJarvisRuntimeRequest;
  readonly response: ApiJarvisRuntimeResult;
  readonly backendAuthority: true;
  readonly evidenceLedgerRequired: true;
  readonly dryRunDefaultSafe: true;
}

export const JARVIS_RUNTIME_ROUTE_REQUIREMENTS = {
  route: JARVIS_RUNTIME_CONTROL_ROUTE,
  method: JARVIS_RUNTIME_CONTROL_METHOD,
  backendAuthority: true,
  evidenceLedgerRequired: true,
  returnsExactReason: true,
  blocksUnsafeActions: true,
  checksLaunchEvidenceState: true,
  requiresFounderApprovalWhereNeeded: true,
  allowsSafeActions: true,
  dryRunDefaultSafe: true
} as const;
