import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Readiness = {
  ok: boolean;
  status: string;
  blockers?: string[];
  finalBundleComplete?: boolean;
  launchAuditClear?: boolean;
  founderApprovalPresent?: boolean;
};

async function readReadiness(request: NextRequest, founderApprovalRef: string): Promise<Readiness> {
  const base = new URL(request.url);
  const url = new URL("/api/jarvis/live-readiness", base.origin);
  if (founderApprovalRef.trim()) url.searchParams.set("founderApprovalRef", founderApprovalRef.trim());
  const response = await fetch(url, { cache: "no-store" });
  return (await response.json()) as Readiness;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { founderApprovalRef?: string; requestedBy?: string; dryRun?: boolean };
  const founderApprovalRef = typeof body.founderApprovalRef === "string" ? body.founderApprovalRef.trim() : "";
  const requestedBy = typeof body.requestedBy === "string" && body.requestedBy.trim() ? body.requestedBy.trim() : "operator";
  const readiness = await readReadiness(request, founderApprovalRef);
  const dryRun = body.dryRun !== false;

  if (!readiness.ok) {
    return NextResponse.json({
      ok: false,
      status: "JARVIS_SWITCH_REQUEST_BLOCKED",
      switchAuthorized: false,
      switchExecuted: false,
      dryRun,
      requestedBy,
      founderApprovalRef: founderApprovalRef || null,
      readinessStatus: readiness.status,
      blockers: readiness.blockers ?? [],
      safeReason: "Jarvis blocked the switch request because live readiness is incomplete.",
      generatedAtIso: new Date().toISOString()
    }, { status: 423 });
  }

  return NextResponse.json({
    ok: true,
    status: dryRun ? "JARVIS_SWITCH_REQUEST_DRY_RUN_READY" : "JARVIS_SWITCH_REQUEST_READY_FOR_CONTROLLED_DEPLOYMENT",
    switchAuthorized: true,
    switchExecuted: false,
    dryRun,
    requestedBy,
    founderApprovalRef,
    readinessStatus: readiness.status,
    blockers: [],
    safeReason: dryRun
      ? "Jarvis confirms readiness in dry-run mode. No live switch was executed."
      : "Jarvis confirms readiness for controlled deployment review. This API still does not directly flip production.",
    generatedAtIso: new Date().toISOString()
  }, { status: dryRun ? 202 : 200 });
}
