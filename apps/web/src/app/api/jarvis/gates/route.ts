import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gates = [
  {
    gateRef: "payfast_sandbox_itn_evidence",
    title: "PayFast sandbox ITN evidence",
    reportPath: "reports/staging/payfast-provider-sandbox-staging-latest.json"
  },
  {
    gateRef: "communications_provider_evidence",
    title: "Real communications provider proof",
    reportPath: "reports/staging/communications-provider-staging-latest.json"
  },
  {
    gateRef: "branch_protection_account_review",
    title: "Branch protection/account review",
    reportPath: "reports/repo/main-branch-protection-apply-latest.json"
  },
  {
    gateRef: "final_assembly_founder_review",
    title: "Final assembly founder review",
    reportPath: "reports/final-assembly/final-founder-review-latest.json"
  }
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

function gateState(gate: typeof gates[number]) {
  const report = readJson(gate.reportPath);
  if (!report) {
    return {
      ...gate,
      exists: false,
      passed: false,
      reviewed: false,
      redacted: false,
      status: "MISSING_REPORT",
      nextAction: "Generate this gate report with real evidence."
    };
  }

  return {
    ...gate,
    exists: true,
    passed: report.passed === true,
    reviewed: report.reviewed === true || report.stagingReviewed === true,
    redacted: report.redacted !== false,
    status: String(report.status ?? "STATUS_NOT_REPORTED"),
    nextAction: String(report.nextAction ?? "Review this gate.")
  };
}

export async function GET() {
  const gateStates = gates.map(gateState);
  const blockedGates = gateStates.filter((gate) => !(gate.exists && gate.passed && gate.reviewed && gate.redacted));
  const ok = blockedGates.length === 0;

  return NextResponse.json({
    ok,
    status: ok ? "JARVIS_GATES_READY" : "JARVIS_GATES_BLOCKED",
    gateCount: gateStates.length,
    passedGateCount: gateStates.length - blockedGates.length,
    blockedGateCount: blockedGates.length,
    gates: gateStates,
    blockedGates: blockedGates.map((gate) => ({
      gateRef: gate.gateRef,
      title: gate.title,
      status: gate.status,
      nextAction: gate.nextAction
    })),
    generatedAtIso: new Date().toISOString()
  });
}
