export function assertN04PortalShellSafe(input: {
  serviceRoleVisibleToBrowser: boolean;
  truthAuthorityActionsAvailableInBrowser: boolean;
  gatesHiddenByPackage: boolean;
  productionReady: boolean;
}) {
  if (input.serviceRoleVisibleToBrowser !== false) {
    throw new Error("N04 portal shell blocked: service_role must never be visible in browser");
  }

  if (input.truthAuthorityActionsAvailableInBrowser !== false) {
    throw new Error("N04 portal shell blocked: truth authority actions cannot be exposed in browser");
  }

  if (input.gatesHiddenByPackage !== false) {
    throw new Error("N04 portal shell blocked: package must not hide gates");
  }

  if (input.productionReady !== false) {
    throw new Error("N04 portal shell cannot claim productionReady=true");
  }

  return true;
}