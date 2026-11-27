import { n06WorkbenchAdapterRequired, verifyN06CandidateSession } from "@/lib/n06-candidate-session-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const session = await verifyN06CandidateSession(request);
  if (!session.ok) return session.response;

  // Authentication is necessary but not sufficient: candidate-to-auth linkage
  // and the verified route read model must exist before this endpoint can answer.
  // Do not echo caller-supplied IDs or report fabricated readiness/optimization.
  return n06WorkbenchAdapterRequired();
}
