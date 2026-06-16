import { NextRequest, NextResponse } from "next/server";
import { approveBuilderPlan, createBuilderPlan, listBuilderPlans } from "../../../../lib/jarvis/builderCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WAKE_GREETING =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

function extractText(body: any): string {
  return String(body?.command || body?.text || body?.message || body?.prompt || "").trim();
}

function isBuilderPlanCommand(text: string): boolean {
  return /\b(create|build|plan|draft|generate)\b/i.test(text) && /\bN\d{2}[A-Z0-9.\-]*\b/i.test(text);
}

function formatPlanReply(plan: any): string {
  const files = plan.proposed_files
    .map((file: any) => `- ${file.path}`)
    .join("\n");

  return [
    "Builder plan created, Commander.",
    "",
    `Plan ID: ${plan.plan_id}`,
    `Module: ${plan.module_id}`,
    `Title: ${plan.title}`,
    "",
    "No files have been written yet.",
    "",
    "Proposed files:",
    files,
    "",
    "Approval command:",
    plan.approval_phrase,
  ].join("\n");
}

function formatStatusReply(plans: any[]): string {
  if (!plans.length) return "Builder Core has no plans yet, Commander.";

  return [
    "Recent Builder Core plans, Commander:",
    "",
    ...plans.slice(0, 8).map((plan) => `${plan.plan_id} | ${plan.status} | ${plan.module_id} | ${plan.title}`),
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = extractText(body);
  const lower = text.toLowerCase();

  try {
    if (!text || lower === "jarvis" || lower === "wake jarvis") {
      return NextResponse.json({
        ok: true,
        mode: "wake",
        reply: WAKE_GREETING,
      });
    }

    const approval = text.match(/^(?:jarvis[\s,]+)?approve\s+(KJB-\d{8}-\d{6})$/i);
    if (approval) {
      const proof = approveBuilderPlan(approval[1].toUpperCase());
      return NextResponse.json({
        ok: true,
        mode: "builder-approve",
        reply: [
          "Builder plan approved and executed, Commander.",
          "",
          `Final status: ${proof.final_status}`,
          `Validation passed: ${proof.validation_passed ? "YES" : "NO"}`,
          `Git commit: ${proof.git_commit_ok ? "YES" : "NO"}`,
          `Proof: ${proof.plan_id}-proof.json`,
        ].join("\n"),
        proof,
      });
    }

    if (/builder\s+status|build\s+status|plans/i.test(text)) {
      const plans = listBuilderPlans();
      return NextResponse.json({
        ok: true,
        mode: "builder-status",
        reply: formatStatusReply(plans),
        plans,
      });
    }

    if (isBuilderPlanCommand(text)) {
      const plan = createBuilderPlan(text);
      return NextResponse.json({
        ok: true,
        mode: "builder-plan",
        reply: formatPlanReply(plan),
        plan: {
          plan_id: plan.plan_id,
          status: plan.status,
          module_id: plan.module_id,
          title: plan.title,
          approval_phrase: plan.approval_phrase,
          proposed_files: plan.proposed_files.map((file) => ({
            path: file.path,
            action: file.action,
            purpose: file.purpose,
          })),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "commander-reply",
      reply: `Standing by, Commander. I heard: ${text}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      mode: "builder-error",
      reply: `Commander, Builder Core blocked this command: ${error?.message || "unknown error"}`,
      error: error?.message || "unknown error",
    }, { status: 200 });
  }
}
