import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditState = "PENDING_SECURITY_EVIDENCE" | "BLOCKED" | "REJECTED_UNTIL_REAL_EVIDENCE";

type AuditGate = {
  id: string;
  title: string;
  state: AuditState;
  launchCritical: boolean;
  requiredEvidence: string[];
  rejectionRules: string[];
  detail: string;
};

const auditGates: AuditGate[] = [
  {
    id: "main-branch-protection",
    title: "Main Branch Protection",
    state: "BLOCKED",
    launchCritical: true,
    requiredEvidence: ["main branch protected", "direct push blocked", "force push disabled", "deletion disabled", "admin bypass reviewed"],
    rejectionRules: ["reject if main can be pushed without review", "reject if force push is allowed", "reject if branch protection is missing"],
    detail: "Main branch must be protected before public launch. Jarvis cannot call the system live while release control is weak."
  },
  {
    id: "required-status-checks",
    title: "Required Reviews and Status Checks",
    state: "BLOCKED",
    launchCritical: true,
    requiredEvidence: ["required PR review", "required build check", "required validator check", "required launch audit check"],
    rejectionRules: ["reject if PR reviews are optional", "reject if build can be skipped", "reject if validators are not required"],
    detail: "Launch needs mandatory review and checks so unfinished Jarvis code cannot land as production."
  },
  {
    id: "rollback-release-gate",
    title: "Rollback and Release Gate",
    state: "PENDING_SECURITY_EVIDENCE",
    launchCritical: true,
    requiredEvidence: ["release tag", "rollback command or procedure", "restore evidence", "failed release stop condition"],
    rejectionRules: ["reject if rollback evidence is missing", "reject if failed deploy has no stop condition", "reject if release tag is absent"],
    detail: "A public launch must be reversible. Rollback evidence must be captured before live status can pass."
  },
  {
    id: "staging-evidence-pack",
    title: "Final Staging Evidence Pack",
    state: "PENDING_SECURITY_EVIDENCE",
    launchCritical: true,
    requiredEvidence: ["staging URL proof", "source validators passed", "runtime proof reports", "provider proof reports", "payment proof report", "security proof report"],
    rejectionRules: ["reject source-only evidence as live proof", "reject screenshots without route/report evidence", "reject unredacted proof packs"],
    detail: "The final staging evidence pack must contain redacted route, report, and validator proof for every launch-critical gate."
  },
  {
    id: "final-launch-audit",
    title: "Final Launch Audit",
    state: "REJECTED_UNTIL_REAL_EVIDENCE",
    launchCritical: true,
    requiredEvidence: ["all live proof gates accepted", "productionReady remains false until audit pass", "publicLaunchAllowed only after audit", "founder launch approval", "redacted closeout report"],
    rejectionRules: ["reject if any live proof gate remains blocked", "reject if publicLaunchAllowed is true before audit", "reject if founder approval is missing", "reject if raw secrets appear"],
    detail: "Final launch audit is rejected until Docker/API, providers, PayFast, provider tools, branch protection, rollback, and founder approval are proven."
  }
];

const launchBlocking = auditGates.filter((gate) => gate.launchCritical && gate.state !== "PENDING_SECURITY_EVIDENCE");

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-branch-protection-final-launch-audit.v1",
    module: "Jarvis Branch Protection Final Launch Audit",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignClosedOut: true,
    branchProtectionProofAccepted: false,
    finalLaunchAuditAccepted: false,
    rollbackProofAccepted: false,
    stagingEvidencePackAccepted: false,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    mainBranchMustBeProtected: true,
    requiredReviewsAndChecksRequired: true,
    rollbackEvidenceRequired: true,
    founderLaunchApprovalRequired: true,
    auditGates,
    launchBlockingCount: launchBlocking.length,
    launchBlocking,
    nextAction: "Capture branch protection, required checks, rollback, staging evidence pack, final launch audit, and founder approval before public launch can pass."
  });
}
