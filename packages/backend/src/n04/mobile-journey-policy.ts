export function assertN04MobileJourneySafe(input: {
  mobileFirst: boolean;
  lowDataFriendly: boolean;
  candidateSafeGuidance: boolean;
  serviceRoleVisibleToBrowser?: boolean;
}) {
  if (input.mobileFirst !== true) {
    throw new Error("N04 mobile journey must be mobile-first");
  }

  if (input.lowDataFriendly !== true) {
    throw new Error("N04 mobile journey must be low-data friendly");
  }

  if (input.candidateSafeGuidance !== true) {
    throw new Error("N04 mobile journey must use candidate-safe guidance");
  }

  if (input.serviceRoleVisibleToBrowser === true) {
    throw new Error("N04 mobile journey must not expose service_role to browser");
  }

  return true;
}