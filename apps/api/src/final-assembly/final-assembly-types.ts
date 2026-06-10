export type ReleaseStatus = "planned" | "materialized" | "validated" | "locked" | "deferred";
export type ReadinessStatus = "pending" | "passed" | "failed" | "waived" | "not_applicable";
export type LaunchGateStatus = "closed" | "open" | "blocked" | "manual_review";

export interface ReleaseModule {
  moduleKey: string;
  moduleName: string;
  phaseOrder: number;
  releaseStatus: ReleaseStatus;
  ownerBoundary: string;
  truthSource: "postgres" | "repo" | "external";
  hasValidator: boolean;
  hasReport: boolean;
}

export interface ProductionReadinessCheck {
  checkKey: string;
  checkGroup: string;
  title: string;
  description: string;
  severity: "required" | "recommended" | "watch";
  status: ReadinessStatus;
  remediation: string;
  evidenceRef?: string;
}

export interface LaunchGateDecision {
  gateKey: string;
  gateName: string;
  gateStatus: LaunchGateStatus;
  requiredBefore: string;
  decisionBy?: string;
  decisionReason?: string;
  evidenceRef?: string;
}

export interface ReleaseDoctrineSnapshot {
  activeCandidateCap: number;
  postgresTruth: boolean;
  airtableMirrorOnly: boolean;
  backendControlsState: boolean;
  n8nStatelessThinWorkers: boolean;
  emailPrimary: boolean;
  whatsappUrgentOnly: boolean;
  smsBackupOnly: boolean;
  payfastProviderBoundary: boolean;
  allSectorsOpen: boolean;
  capsLimitVolumeNotScope: boolean;
  oracleLiteRealistic: boolean;
  founderFinalAuthority: boolean;
}

export interface FinalAssemblyReadModel {
  releaseName: string;
  doctrine: ReleaseDoctrineSnapshot;
  modules: ReleaseModule[];
  checks: ProductionReadinessCheck[];
  gates: LaunchGateDecision[];
  blockers: string[];
  nextActions: string[];
}