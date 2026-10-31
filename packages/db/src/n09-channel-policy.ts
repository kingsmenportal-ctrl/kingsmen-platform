import type { N09Channel, N09MessagePurpose } from '../../contracts/src/n09-index';
import { N09MessagePolicyError } from './n09-message-safety-policy';

export function n09AssertChannelAllowed(args: {
  readonly channel: N09Channel;
  readonly purpose: N09MessagePurpose;
  readonly isBulk?: boolean;
  readonly isUrgent?: boolean;
  readonly isEmergency?: boolean;
  readonly isCeremonial?: boolean;
}): void {
  if (args.channel === 'whatsapp') {
    throw new N09MessagePolicyError('N09_WHATSAPP_DISABLED', 'WhatsApp is disabled by current Kingsmen communication policy.');
  }

  if (args.channel === 'sms') {
    throw new N09MessagePolicyError('N09_SMS_DISABLED', 'SMS is disabled by current Kingsmen communication policy.');
  }
}

export function n09PreferredChannelForPurpose(purpose: N09MessagePurpose): N09Channel {
  if (purpose === 'founder_urgent_alert' || purpose === 'system_health_alert') {
    return 'control_plane';
  }
  return 'email';
}
