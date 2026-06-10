import type { ReleaseDoctrineSnapshot } from "./final-assembly-types";

export const RELEASE_DOCTRINE: ReleaseDoctrineSnapshot = {
  activeCandidateCap: 500,
  postgresTruth: true,
  airtableMirrorOnly: true,
  backendControlsState: true,
  n8nStatelessThinWorkers: true,
  emailPrimary: true,
  whatsappUrgentOnly: true,
  smsBackupOnly: true,
  payfastProviderBoundary: true,
  allSectorsOpen: true,
  capsLimitVolumeNotScope: true,
  oracleLiteRealistic: true,
  founderFinalAuthority: true
};

export function assertReleaseDoctrineLocked(snapshot: ReleaseDoctrineSnapshot = RELEASE_DOCTRINE): void {
  const required = [
    ["POSTGRES_TRUTH", snapshot.postgresTruth],
    ["AIRTABLE_MIRROR_ONLY", snapshot.airtableMirrorOnly],
    ["BACKEND_CONTROLS_STATE", snapshot.backendControlsState],
    ["N8N_STATELESS_THIN_WORKERS", snapshot.n8nStatelessThinWorkers],
    ["EMAIL_PRIMARY", snapshot.emailPrimary],
    ["WHATSAPP_URGENT_ONLY", snapshot.whatsappUrgentOnly],
    ["SMS_BACKUP_ONLY", snapshot.smsBackupOnly],
    ["PAYFAST_PROVIDER_BOUNDARY", snapshot.payfastProviderBoundary],
    ["CAPS_LIMIT_VOLUME_NOT_SCOPE", snapshot.capsLimitVolumeNotScope],
    ["ORACLE_LITE_DISCIPLINE", snapshot.oracleLiteRealistic],
    ["FOUNDER_FINAL_AUTHORITY", snapshot.founderFinalAuthority]
  ] as const;

  for (const [key, value] of required) {
    if (!value) throw new Error(`RELEASE_DOCTRINE_UNLOCKED: ${key} must remain true.`);
  }

  if (snapshot.activeCandidateCap !== 500) {
    throw new Error("CAP_LOCK_CHANGED: N20 release scope is 500 active operational candidates unless founder explicitly changes it.");
  }
}