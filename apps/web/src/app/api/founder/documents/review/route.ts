import { requireFounderAccess, founderAccessDenied, founderPrivateJson } from "@/lib/founder-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 12 * 1024;

type ReviewStatus = "verified" | "rejected" | "needs_more_info" | "fraud_review";
const statuses = new Set<ReviewStatus>(["verified", "rejected", "needs_more_info", "fraud_review"]);
const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,179}$/;

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return founderPrivateJson({ ok: false, error: "Review request exceeds the allowed size.", productionReady: false }, { status: 413 });
  }

  let raw: string;
  try { raw = await request.text(); }
  catch { return founderPrivateJson({ ok: false, error: "Review request could not be read.", productionReady: false }, { status: 400 }); }
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return founderPrivateJson({ ok: false, error: "Review request exceeds the allowed size.", productionReady: false }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "Provide a valid JSON review request.", productionReady: false }, { status: 400 });
  }

  const required = ["documentId", "candidateId", "proofId", "evidenceId", "auditId"] as const;
  for (const key of required) {
    if (typeof body[key] !== "string" || !identifier.test((body[key] as string).trim())) {
      return founderPrivateJson({ ok: false, error: `A valid ${key} is required.`, productionReady: false }, { status: 400 });
    }
  }
  if (body.documentId === body.candidateId) {
    return founderPrivateJson({ ok: false, error: "Document and candidate references must be distinct.", productionReady: false }, { status: 400 });
  }
  if (typeof body.reviewStatus !== "string" || !statuses.has(body.reviewStatus as ReviewStatus)) {
    return founderPrivateJson({ ok: false, error: "Choose a supported review decision.", productionReady: false }, { status: 400 });
  }
  if (body.proofId === body.evidenceId || body.proofId === body.auditId || body.evidenceId === body.auditId) {
    return founderPrivateJson({ ok: false, error: "Proof, evidence and audit references must be distinct.", productionReady: false }, { status: 400 });
  }
  const safeNotes = typeof body.safeNotes === "string" ? body.safeNotes.trim() : "";
  if (safeNotes.length > 1200) {
    return founderPrivateJson({ ok: false, error: "Review notes must be 1,200 characters or fewer.", productionReady: false }, { status: 400 });
  }

  return founderPrivateJson({
    ok: true,
    productionReady: false,
    persisted: false,
    statusChanged: false,
    decision: {
      documentId: body.documentId,
      candidateId: body.candidateId,
      reviewStatus: body.reviewStatus,
      proofId: body.proofId,
      evidenceId: body.evidenceId,
      auditId: body.auditId,
      safeNotes,
      reviewerUserId: access.userId,
      proposedAt: new Date().toISOString()
    },
    boundary: "Authenticated founder review proposal only. No document was fetched, verified, rejected, or modified.",
    requirementsBeforePersistence: [
      "Verify the document and candidate relationship using server-side records.",
      "Resolve proof and evidence references to immutable evidence records.",
      "Persist the decision and audit event transactionally in a protected database RPC.",
      "Enforce reviewer authority and separation of duties in the database."
    ]
  });
}
