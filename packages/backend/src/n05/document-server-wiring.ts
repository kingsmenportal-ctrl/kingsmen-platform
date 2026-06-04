export const N05_DOCUMENT_SERVER_ROUTES = [
  {
    method: "POST",
    path: "/api/candidate/documents/upload-url",
    boundary: "signed_upload",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "POST",
    path: "/api/candidate/documents/read-url",
    boundary: "signed_read",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "GET",
    path: "/api/candidate/documents/status",
    boundary: "candidate_safe_status",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "POST",
    path: "/api/founder/documents/review",
    boundary: "operator_review",
    candidateSafe: false,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  }
] as const;

export function assertN05DocumentServerWiringSafe() {
  for (const route of N05_DOCUMENT_SERVER_ROUTES) {
    if (route.serviceRoleVisibleToBrowser !== false) {
      throw new Error(`N05 server wiring blocked: service_role exposed at ${route.path}`);
    }

    if (route.productionReady !== false) {
      throw new Error(`N05 server wiring blocked: productionReady true at ${route.path}`);
    }
  }

  return true;
}