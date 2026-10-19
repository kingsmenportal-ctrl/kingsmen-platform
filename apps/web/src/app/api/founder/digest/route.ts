import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  return founderPrivateJson({
    ok: true,
    productionReady: false,
    boundary: "N08 founder daily digest route shell",
    windows: ["morning", "midday", "evening", "incident", "end_of_day"],
    founderReviewRequired: true,
    evidenceRequired: true,
    auditRequired: true,
    generatedFrom: "STATIC_POLICY_ONLY",
    note: "No operational telemetry or candidate records are aggregated by this route yet."
  });
}
