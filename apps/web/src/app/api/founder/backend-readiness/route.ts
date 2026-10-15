import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  return founderPrivateJson({
    schema: "kingsmen.founder-backend-readiness.v1",
    productionReady: false,
    livePaymentsAllowed: false,
    liveEmailAllowed: false,
    officialSubmissionsAllowed: false,
    rawShellAllowed: false,
    authorization: "FOUNDER_VERIFIED",
    evidenceStatus: "NOT_VERIFIED_BY_THIS_ENDPOINT",
    nextAction: "Use proof reports and authenticated staging runtime evidence to decide the next build layer.",
    checkedAt: new Date().toISOString()
  });
}
