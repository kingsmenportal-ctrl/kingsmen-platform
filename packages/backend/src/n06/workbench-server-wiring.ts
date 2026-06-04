export const N06_WORKBENCH_SERVER_ROUTES = [
  {
    method: "POST",
    path: "/api/candidate/workbench/readiness",
    boundary: "candidate_readiness",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "POST",
    path: "/api/candidate/workbench/choice-optimizer",
    boundary: "choice_optimizer",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "POST",
    path: "/api/candidate/workbench/cao-optimizer",
    boundary: "cao_parent_child_optimizer",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  },
  {
    method: "GET",
    path: "/candidate/workbench",
    boundary: "candidate_portal_workbench",
    candidateSafe: true,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  }
] as const;

export function assertN06WorkbenchServerWiringSafe() {
  for (const route of N06_WORKBENCH_SERVER_ROUTES) {
    if (route.serviceRoleVisibleToBrowser !== false) {
      throw new Error(`N06 workbench wiring blocked: service_role exposed at ${route.path}`);
    }

    if (route.productionReady !== false) {
      throw new Error(`N06 workbench wiring blocked: productionReady true at ${route.path}`);
    }
  }

  return true;
}