export const N04_MOBILE_COMMS_POLICY = {
  productionReady: false,
  mobileFirst: true,
  lowDataFriendly: true,
  emailFirst: true,
  whatsappUrgentOnly: true,
  smsBackupOnly: true,
  bulkWhatsAppBlocked: true,
  routineCommsEmailOnly: true
} as const;

export function assertN04MobileCommsPolicySafe() {
  if (N04_MOBILE_COMMS_POLICY.productionReady !== false) {
    throw new Error("N04 mobile/comms policy cannot claim productionReady=true");
  }

  return true;
}