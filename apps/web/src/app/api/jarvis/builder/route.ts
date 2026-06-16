import { NextRequest, NextResponse } from "next/server";
import { approveBuilderPlan, createBuilderPlan, getBuilderPlan, listBuilderPlans } from "../../../../lib/jarvis/builderCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      plans: listBuilderPlans(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Builder status failed" }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();

    if (action === "plan") {
      const command = String(body.command || body.text || "").trim();
      if (!command) return NextResponse.json({ ok: false, error: "Missing builder command." }, { status: 400 });
      const plan = createBuilderPlan(command);
      return NextResponse.json({
        ok: true,
        action: "plan",
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
            preview: file.content.slice(0, 700),
          })),
        },
      });
    }

    if (action === "approve") {
      const planId = String(body.plan_id || "").trim();
      if (!/^KJB-\d{8}-\d{6}$/.test(planId)) {
        return NextResponse.json({ ok: false, error: "Invalid or missing plan_id." }, { status: 400 });
      }
      const proof = approveBuilderPlan(planId);
      return NextResponse.json({ ok: true, action: "approve", proof });
    }

    if (action === "read") {
      const planId = String(body.plan_id || "").trim();
      const plan = getBuilderPlan(planId);
      return NextResponse.json({ ok: true, action: "read", plan });
    }

    return NextResponse.json({ ok: true, action: "status", plans: listBuilderPlans() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Builder API failed" }, { status: 200 });
  }
}
