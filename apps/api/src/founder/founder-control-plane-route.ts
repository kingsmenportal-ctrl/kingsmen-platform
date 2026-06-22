import { buildFounderControlPlaneReadModel } from "./founder-control-plane-read-model";

export const FOUNDER_CONTROL_PLANE_ROUTE = "GET /api/founder/control-plane" as const;

export interface FounderControlPlaneHttpResponse {
  ok: true;
  route: typeof FOUNDER_CONTROL_PLANE_ROUTE;
  readModel: ReturnType<typeof buildFounderControlPlaneReadModel>;
}

export function buildFounderControlPlaneHttpResponse(nowIso = new Date().toISOString()): FounderControlPlaneHttpResponse {
  return {
    ok: true,
    route: FOUNDER_CONTROL_PLANE_ROUTE,
    readModel: buildFounderControlPlaneReadModel(nowIso)
  };
}

export const FOUNDER_CONTROL_PLANE_ROUTE_DOCTRINE = {
  founderReadModelOnly: true,
  noSecretsReturned: true,
  noCandidatePrivateDocumentsReturned: true,
  noProviderCredentialValuesReturned: true,
  launchBlockersMustRemainVisible: true,
  productionReadyFalseUntilFinalGate: true,
  publicLaunchAllowedFalseUntilFounderApproval: true
} as const;
