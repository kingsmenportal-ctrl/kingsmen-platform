import type { MobileNotificationPreference } from "./candidate-mobile-types";
import { assertChannelAllowed } from "./mobile-policy";

export function defaultMobileNotificationPreference(candidateId: string): MobileNotificationPreference {
  return {
    candidateId,
    emailEnabled: true,
    whatsappUrgentOnly: false,
    smsBackupEnabled: false,
    quietHoursStart: "20:00",
    quietHoursEnd: "07:00",
    timezone: "Africa/Johannesburg"
  };
}

export function chooseMobileChannel(
  preference: MobileNotificationPreference,
  urgency: "routine" | "urgent" | "backup"
): "email" | "whatsapp_urgent" | "sms_backup" | "portal" {
  // Persisted legacy flags remain readable, but the retired channels cannot be activated.
  assertChannelAllowed("email", urgency);
  if (preference.emailEnabled) return "email";
  return "portal";
}
