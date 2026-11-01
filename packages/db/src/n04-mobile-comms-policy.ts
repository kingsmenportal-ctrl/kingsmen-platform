export const N04_MOBILE_COMMS_POLICY = {
  productionReady: false,
  mobileFirst: true,
  lowDataFriendly: true,
  emailFirst: true,
  whatsappEnabled: false,
  smsEnabled: false,
  whatsappDisabled: true,
  smsDisabled: true,
  bulkWhatsAppBlocked: true,
  routineCommsEmailOnly: true
} as const;

export function assertN04MobileCommsPolicySafe() {
  if (N04_MOBILE_COMMS_POLICY.productionReady !== false) {
    throw new Error("N04 mobile/comms policy cannot claim productionReady=true");
  }
  if (N04_MOBILE_COMMS_POLICY.whatsappEnabled || N04_MOBILE_COMMS_POLICY.smsEnabled) {
    throw new Error("N04 candidate communications must remain email/portal only");
  }
  return true;
}
