export async function GET() {
  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N08 founder daily digest route shell",
    windows: ["morning", "midday", "evening", "incident", "end_of_day"],
    founderReviewRequired: false,
    evidenceRequired: true,
    auditRequired: true,
    serviceRoleVisibleToBrowser: false
  });
}