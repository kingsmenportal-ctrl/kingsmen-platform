import type { CandidateMobileLaw, MobileChannel, MobileExperienceSummary } from "./candidate-mobile-types";

export const CANDIDATE_MOBILE_LAWS: CandidateMobileLaw[] = [
  { key: "MOBILE_WEB_FIRST", rule: "Kingsmen uses a mobile-first responsive portal before any native app layer." },
  { key: "PUBLIC_TO_PORTAL_HANDOFF", rule: "Public website leads must be claimed into secure portal sessions with expiring tokens." },
  { key: "EMAIL_PRIMARY", rule: "Routine candidate communication remains email-first and auditable." },
  { key: "WHATSAPP_URGENT_ONLY", rule: "WhatsApp is only for urgent escalation, never routine bulk reminders." },
  { key: "SMS_BACKUP_ONLY", rule: "SMS is a backup channel only." },
  { key: "NO_FAKE_STATUS", rule: "Candidate mobile must never invent official results, admissions decisions, funding decisions, deadlines, or employer outcomes." },
  { key: "SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA", rule: "The mobile smart form reuses trusted extraction from CV/documents and only asks for missing or uncertain fields." },
  { key: "DEVICE_TRUST_REQUIRED", rule: "Sensitive actions require a trusted device/session boundary." },
  { key: "POPIA_MINIMIZATION", rule: "Mobile screens show only the minimum personal data required for the candidate task." }
];

export function buildMobileExperienceSummary(): MobileExperienceSummary {
  return {
    mobileWebFirst: true,
    nativeAppDeferred: true,
    emailPrimary: true,
    whatsappUrgentOnly: true,
    smsBackupOnly: true,
    publicToPortalHandoff: true,
    smartFormDoesNotRetypeDocumentData: true,
    noFakeStatus: true
  };
}

export function assertChannelAllowed(channel: MobileChannel, urgency: "routine" | "urgent" | "backup"): void {
  if (channel === "whatsapp_urgent" && urgency !== "urgent") {
    throw new Error("WHATSAPP_URGENT_ONLY: WhatsApp cannot be used for routine candidate mobile communication.");
  }
  if (channel === "sms_backup" && urgency !== "backup" && urgency !== "urgent") {
    throw new Error("SMS_BACKUP_ONLY: SMS cannot replace email-first communication.");
  }
}

export function assertCandidateStatusIsSafe(statusText: string): void {
  const unsafe = [
    "accepted",
    "approved by nsfas",
    "guaranteed",
    "admitted",
    "funded",
    "hired",
    "official deadline confirmed"
  ];
  const normalized = statusText.toLowerCase();
  for (const phrase of unsafe) {
    if (normalized.includes(phrase)) {
      throw new Error("NO_FAKE_STATUS: Candidate mobile cannot claim official outcomes without verified source evidence.");
    }
  }
}

export function candidateMayOverrideBackendState(): false {
  return false;
}