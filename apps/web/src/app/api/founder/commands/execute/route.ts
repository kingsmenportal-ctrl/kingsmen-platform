import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return founderPrivateJson({ ok: false, error: "Request body exceeds the allowed size." }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return founderPrivateJson({ ok: false, error: "Request body exceeds the allowed size." }, { status: 413 });
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "A valid JSON object is required." }, { status: 400 });
  }

  const required = ["commandId", "commandName", "evidenceId", "auditId"] as const;
  for (const key of required) {
    if (typeof body[key] !== "string" || !(body[key] as string).trim() || (body[key] as string).length > 180) {
      return founderPrivateJson({
        ok: false,
        productionReady: false,
        error: "Command execution requires bounded commandId, commandName, evidenceId, and auditId values."
      }, { status: 400 });
    }
  }

  // This remains a dry-run boundary: authorization and request validation do
  // not imply the command was dispatched to an orchestrator or external system.
  return founderPrivateJson({
    ok: true,
    productionReady: false,
    boundary: "N08 founder command execution route shell",
    commandId: body.commandId,
    commandName: body.commandName,
    executed: false,
    dryRunFirst: true,
    highRiskRequiresFounderApproval: true,
    evidenceId: body.evidenceId,
    auditId: body.auditId,
    serviceRoleVisibleToBrowser: false,
    note: "No command was dispatched. Orchestrator integration and durable audit persistence are not implemented by this route."
  });
}
