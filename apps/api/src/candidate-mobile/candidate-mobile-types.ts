export type MobileChannel = "email" | "whatsapp_urgent" | "sms_backup" | "portal";
export type DeviceTrustLevel = "new" | "trusted" | "restricted" | "revoked";
export type PublicPortalClaimStatus = "created" | "sent" | "claimed" | "expired" | "revoked";
export type MobileCardSeverity = "info" | "warning" | "urgent" | "success";

export interface CandidateMobileLaw {
  key: string;
  rule: string;
}

export interface CandidateMobileDevice {
  candidateId?: string;
  accountId?: string;
  deviceLabel: string;
  deviceFingerprintHash: string;
  trustLevel: DeviceTrustLevel;
  metadata?: Record<string, unknown>;
}

export interface PublicToPortalClaim {
  leadReference: string;
  candidateId?: string;
  accountId?: string;
  claimStatus: PublicPortalClaimStatus;
  claimChannel: "email" | "sms_backup" | "operator";
  expiresAt: string;
}

export interface MobileQuickAction {
  actionKey: string;
  label: string;
  description: string;
  targetModule: string;
  actionBoundary: string;
  enabled: boolean;
}

export interface MobileStatusCard {
  candidateId: string;
  cardKey: string;
  title: string;
  body: string;
  sourceModule: string;
  severity: MobileCardSeverity;
  confidenceBand: "official" | "system" | "manual_review" | "candidate_supplied";
}

export interface MobileNotificationPreference {
  candidateId: string;
  emailEnabled: boolean;
  whatsappUrgentOnly: boolean;
  smsBackupEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface MobileExperienceSummary {
  mobileWebFirst: boolean;
  nativeAppDeferred: boolean;
  emailPrimary: boolean;
  whatsappUrgentOnly: boolean;
  smsBackupOnly: boolean;
  publicToPortalHandoff: boolean;
  smartFormDoesNotRetypeDocumentData: boolean;
  noFakeStatus: boolean;
}