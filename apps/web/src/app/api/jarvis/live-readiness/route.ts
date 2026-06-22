import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gateReports = [
  ["payfast_sandbox_itn_evidence", "PayFast sandbox ITN evidence", "reports/staging/payfast-provider-sandbox-staging-latest.json"],
  ["communications_provider_evidence", "Real communications provider proof", "reports/staging/communications-provider-staging-latest.json"],
  ["branch_protection_account_review", "Branch protection/account review", "reports/repo/main-branch-protection-apply-latest.json"],
  ["final_assembly_founder_review", "Final assembly founder review", "reports/final-assembly/final-founder-review-latest.json"]
] as const;

function readJson(relativePath: string): Record<string, unknown> | null {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function gateState([gateRef, title, reportPath]: typeof gateReports[number]) {
  const report = readJson(reportPath);
  if (!report) {
    return { gateRef, title, reportPath, exists: false, passed: false, reviewed: false, redacted: false, status: "MISSING_REPORT", nextAction: "Generate this report with real evidence." };
  }
  return {
    gateRef,
    title,
    reportPath,
    exists: true,
    passed: report.passed === true,
    reviewed: report.reviewed === true || report.stagingReviewed === true,
    redacted: report.redacted !== false,
    status: String(report.status ?? "STATUS_NOT_REPORTED"),
    nextAction: String(report.nextAction ?? "Review this gate.")
  };
}

function finalBundleComplete() {
  const bundle = readJson("reports/final-assembly/final-assembly-evidence-bundle-latest.json");
  return Boolean(bundle && bundle.totalReports === bundle.presentReports && bundle.totalReports === bundle.passedReports && bundle.totalReports === bundle.reviewedReports && bundle.totalReports === bundle.redactedReports);
}

function launchAuditClear() {
  const launch = readJson("reports/launch/kingsmen-launch-readiness-latest.json");
  return Boolean(launch && Array.isArray(launch.blockers) && launch.blockers.length === 0);
}

export async function GET(request: NextRequest) {
  const founderApprovalRef = request.nextUrl.searchParams.get("founderApprovalRef") ?? "";
  const gates = gateReports.map(gateState);
  const blockedGates = gates.filter((gate) => !(gate.exists && gate.passed && gate.reviewed && gate.redacted));
  const bundleReady = finalBundleComplete();
  const auditReady = launchAuditClear();
  const approvalReady = founderApprovalRef.trim().length > 0;
  const blockers = [
    ...blockedGates.map((gate) => `${gate.gateRef}:${gate.status}`),
    ...(bundleReady ? [] : ["final_bundle_incomplete"]),
    ...(auditReady ? [] : ["launch_audit_not_clear"]),
    ...(approvalReady ? [] : ["founder_approval_ref_missing"])
  ];
  const ready = blockers.length === 0;

  return NextResponse.json({
    ok: ready,
    status: ready ? "JARVIS_READY_FOR_CONTROLLED_SWITCH_REVIEW" : "JARVIS_LIVE_READINESS_BLOCKED",
    productionReady: false,
    publicLaunchAllowed: false,
    finalBundleComplete: bundleReady,
    launchAuditClear: auditReady,
    founderApprovalPresent: approvalReady,
    gateCount: gates.length,
    passedGateCount: gates.length - blockedGates.length,
    blockedGateCount: blockedGates.length,
    gates,
    blockers,
    generatedAtIso: new Date().toISOString(),
    nextAction: ready ? "Proceed only through controlled switch review." : "Complete all blockers with real evidence, then rerun readiness."
  });
}
