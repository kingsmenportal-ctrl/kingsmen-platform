import type { MobileNotificationPreference } from "./candidate-mobile-types";
import { assertChannelAllowed } from "./mobile-policy";

export function defaultMobileNotificationPreference(candidateId: string): MobileNotificationPreference {
  return {
    candidateId,
    emailEnabled: true,
    whatsappUrgentOnly: true,
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
  if (urgency === "urgent" && preference.whatsappUrgentOnly) {
    assertChannelAllowed("whatsapp_urgent", "urgent");
    return "whatsapp_urgent";
  }

  if (urgency === "backup" && preference.smsBackupEnabled) {
    assertChannelAllowed("sms_backup", "backup");
    return "sms_backup";
  }

  if (preference.emailEnabled) {
    assertChannelAllowed("email", "routine");
    return "email";
  }

  return "portal";
}