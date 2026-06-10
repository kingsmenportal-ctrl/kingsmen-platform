import type { ReleaseModule } from "./final-assembly-types";

export const KINGSMEN_RELEASE_MODULES: ReleaseModule[] = [
  { moduleKey: "N00", moduleName: "Constitution / Doctrine Lock", phaseOrder: 0, releaseStatus: "locked", ownerBoundary: "doctrine", truthSource: "repo", hasValidator: true, hasReport: true },
  { moduleKey: "N01", moduleName: "Monorepo / Oracle Lite Runtime", phaseOrder: 1, releaseStatus: "validated", ownerBoundary: "runtime", truthSource: "repo", hasValidator: true, hasReport: true },
  { moduleKey: "N02", moduleName: "Backend API Kernel / State Machine", phaseOrder: 2, releaseStatus: "validated", ownerBoundary: "backend", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N03", moduleName: "PostgreSQL Truth Vault", phaseOrder: 3, releaseStatus: "validated", ownerBoundary: "database", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N04", moduleName: "Candidate Core / Portal", phaseOrder: 4, releaseStatus: "validated", ownerBoundary: "candidate", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N05", moduleName: "Document Vault", phaseOrder: 5, releaseStatus: "validated", ownerBoundary: "documents", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N06", moduleName: "Route Universe / Application Workbench", phaseOrder: 6, releaseStatus: "validated", ownerBoundary: "routes", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N07", moduleName: "Airtable Sync", phaseOrder: 7, releaseStatus: "validated", ownerBoundary: "mirror", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N08", moduleName: "Control Plane", phaseOrder: 8, releaseStatus: "validated", ownerBoundary: "operator", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N09", moduleName: "Communications", phaseOrder: 9, releaseStatus: "validated", ownerBoundary: "communications", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N10", moduleName: "Finance / PayFast", phaseOrder: 10, releaseStatus: "validated", ownerBoundary: "finance", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N11", moduleName: "AI Decision", phaseOrder: 11, releaseStatus: "validated", ownerBoundary: "ai_advisory", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N12", moduleName: "Governance", phaseOrder: 12, releaseStatus: "validated", ownerBoundary: "governance", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N13", moduleName: "Observability / Reports / Incidents", phaseOrder: 13, releaseStatus: "validated", ownerBoundary: "observability", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N14", moduleName: "Integrations / Workflow Connectors", phaseOrder: 14, releaseStatus: "validated", ownerBoundary: "integrations", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N15", moduleName: "Opportunity Engine / Source Intelligence", phaseOrder: 15, releaseStatus: "validated", ownerBoundary: "opportunity", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N16", moduleName: "Orchestrator / Execution Runtime", phaseOrder: 16, releaseStatus: "validated", ownerBoundary: "orchestrator", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N17", moduleName: "Founder Control Plane / Command Ops", phaseOrder: 17, releaseStatus: "validated", ownerBoundary: "founder_ops", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N18", moduleName: "Public Website / Route House Front Door", phaseOrder: 18, releaseStatus: "validated", ownerBoundary: "public_site", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N19", moduleName: "Candidate Mobile / Public-to-Portal Experience", phaseOrder: 19, releaseStatus: "validated", ownerBoundary: "candidate_mobile", truthSource: "postgres", hasValidator: true, hasReport: true },
  { moduleKey: "N20", moduleName: "Final Assembly / System Lock / Production Readiness", phaseOrder: 20, releaseStatus: "locked", ownerBoundary: "release", truthSource: "postgres", hasValidator: true, hasReport: true }
];

export function getReleaseModule(moduleKey: string): ReleaseModule | undefined {
  return KINGSMEN_RELEASE_MODULES.find((module) => module.moduleKey === moduleKey);
}

export function countLockedOrValidatedModules(): number {
  return KINGSMEN_RELEASE_MODULES.filter((module) => module.releaseStatus === "locked" || module.releaseStatus === "validated").length;
}