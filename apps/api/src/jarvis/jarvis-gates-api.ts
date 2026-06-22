import fs from "node:fs";
import path from "node:path";

export interface ApiJarvisGateState {
  readonly gateRef: string;
  readonly title: string;
  readonly reportPath: string;
  readonly exists: boolean;
  readonly passed: boolean;
  readonly reviewed: boolean;
  readonly redacted: boolean;
  readonly status: string;
  readonly nextAction: string;
}

export interface ApiJarvisGateEvaluation {
  readonly ok: boolean;
  readonly status: "JARVIS_GATES_READY" | "JARVIS_GATES_BLOCKED";
  readonly gateCount: number;
  readonly passedGateCount: number;
  readonly blockedGateCount: number;
  readonly gates: readonly ApiJarvisGateState[];
  readonly blockedGates: readonly Pick<ApiJarvisGateState, "gateRef" | "title" | "status" | "nextAction">[];
  readonly generatedAtIso: string;
}

const GATES = [
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

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function bool(value: unknown): boolean {
  return value === true;
}

function gateState(repoRoot: string, gate: typeof GATES[number]): ApiJarvisGateState {
  const fullPath = path.join(repoRoot, gate.reportPath);
  const report = readJsonSafe(fullPath);

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
    passed: bool(report.passed),
    reviewed: bool(report.reviewed) || bool(report.stagingReviewed),
    redacted: report.redacted !== false,
    status: String(report.status ?? "STATUS_NOT_REPORTED"),
    nextAction: String(report.nextAction ?? "Review this gate.")
  };
}

export function evaluateApiJarvisGates(repoRoot = process.cwd()): ApiJarvisGateEvaluation {
  const gates = GATES.map((gate) => gateState(repoRoot, gate));
  const blockedGates = gates.filter((gate) => !(gate.exists && gate.passed && gate.reviewed && gate.redacted));
  const ok = blockedGates.length === 0;

  return {
    ok,
    status: ok ? "JARVIS_GATES_READY" : "JARVIS_GATES_BLOCKED",
    gateCount: gates.length,
    passedGateCount: gates.length - blockedGates.length,
    blockedGateCount: blockedGates.length,
    gates,
    blockedGates: blockedGates.map((gate) => ({
      gateRef: gate.gateRef,
      title: gate.title,
      status: gate.status,
      nextAction: gate.nextAction
    })),
    generatedAtIso: new Date().toISOString()
  };
}
