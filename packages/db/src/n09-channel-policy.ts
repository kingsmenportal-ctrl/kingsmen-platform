import type { N09Channel, N09MessagePurpose } from '../../contracts/src/n09-index';
import { N09MessagePolicyError } from './n09-message-safety-policy';

const urgentWhatsappPurposes = new Set<N09MessagePurpose>([
  'fast_submission_ready',
  'founder_urgent_alert',
  'system_health_alert',
  'security_account_backup'
]);

const smsBackupPurposes = new Set<N09MessagePurpose>([
  'security_account_backup',
  'fast_submission_ready',
  'founder_urgent_alert',
  'system_health_alert'
]);

export function n09AssertChannelAllowed(args: {
  readonly channel: N09Channel;
  readonly purpose: N09MessagePurpose;
  readonly isBulk?: boolean;
  readonly isUrgent?: boolean;
  readonly isEmergency?: boolean;
  readonly isCeremonial?: boolean;
}): void {
  if (args.channel === 'whatsapp') {
    if (args.isBulk === true) {
      throw new N09MessagePolicyError('N09_BULK_WHATSAPP_FORBIDDEN', 'WhatsApp is urgent-only and cannot be used for bulk reminders.');
    }

    const urgentAllowed = args.isUrgent === true || args.isEmergency === true || args.isCeremonial === true;
    if (!urgentAllowed || !urgentWhatsappPurposes.has(args.purpose)) {
      throw new N09MessagePolicyError('N09_WHATSAPP_URGENT_ONLY', 'WhatsApp may only be used for urgent, emergency, or safe ceremonial cases.');
    }
  }

  if (args.channel === 'sms') {
    if (args.isBulk === true) {
      throw new N09MessagePolicyError('N09_BULK_SMS_FORBIDDEN', 'SMS is backup-only and cannot be used for bulk messaging.');
    }

    const backupAllowed = args.isUrgent === true || args.isEmergency === true || smsBackupPurposes.has(args.purpose);
    if (!backupAllowed) {
      throw new N09MessagePolicyError('N09_SMS_BACKUP_ONLY', 'SMS may only be used as backup for urgent, emergency, or account/security cases.');
    }
  }
}

export function n09PreferredChannelForPurpose(purpose: N09MessagePurpose): N09Channel {
  if (purpose === 'founder_urgent_alert' || purpose === 'system_health_alert') {
    return 'control_plane';
  }
  return 'email';
}
