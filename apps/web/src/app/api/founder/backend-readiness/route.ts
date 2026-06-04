export async function GET() {
  return Response.json({
    schema: "kingsmen.founder-backend-readiness.v1",
    productionReady: false,
    livePaymentsAllowed: false,
    liveEmailAllowed: false,
    officialSubmissionsAllowed: false,
    rawShellAllowed: false,
    nextAction: "Use proof reports to decide next build layer.",
    checkedAt: new Date().toISOString()
  });
}