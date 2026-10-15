import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
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
  const documentId = (body.documentId as string).trim();
  const candidateId = (body.candidateId as string).trim();
  const proofId = (body.proofId as string).trim();
  const evidenceId = (body.evidenceId as string).trim();
  const auditId = (body.auditId as string).trim();
  if (documentId === candidateId) {
    return founderPrivateJson({ ok: false, error: "Document and candidate references must be distinct.", productionReady: false }, { status: 400 });
  }
  if (typeof body.reviewStatus !== "string" || !statuses.has(body.reviewStatus as ReviewStatus)) {
    return founderPrivateJson({ ok: false, error: "Choose a supported review decision.", productionReady: false }, { status: 400 });
  }
  if (proofId === evidenceId || proofId === auditId || evidenceId === auditId) {
    return founderPrivateJson({ ok: false, error: "Proof, evidence and audit references must be distinct.", productionReady: false }, { status: 400 });
  }
  const safeNotes = typeof body.safeNotes === "string" ? body.safeNotes.trim() : "";
  if (safeNotes.length > 1200) {
    return founderPrivateJson({ ok: false, error: "Review notes must be 1,200 characters or fewer.", productionReady: false }, { status: 400 });
  }

  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return founderPrivateJson({ ok: false, error: "Authenticated database access is unavailable; no review decision was recorded.", productionReady: false }, { status: 503 });
  }

  const decisionRef = `docrev_${crypto.randomUUID()}`;
  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/rpc/record_founder_document_review`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        p_decision_ref: decisionRef,
        p_document_ref: documentId,
        p_candidate_ref: candidateId,
        p_review_status: body.reviewStatus,
        p_proof_ref: proofId,
        p_evidence_ref: evidenceId,
        p_audit_ref: auditId,
        p_reviewer_user_id: access.userId,
        p_reviewer_email: access.email,
        p_safe_notes: safeNotes
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return founderPrivateJson({ ok: false, error: "Review request timed out. Check the review queue before retrying.", productionReady: false, persistenceUnknown: true }, { status: 503 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403 || detail.includes("FOUNDER_ACCESS_REQUIRED")) {
      return founderPrivateJson({ ok: false, error: "Founder database authorization denied.", productionReady: false }, { status: 403 });
    }
    if (detail.includes("INVALID_DOCUMENT_REVIEW")) {
      return founderPrivateJson({ ok: false, error: "The database rejected the review references or decision.", productionReady: false }, { status: 400 });
    }
    if (detail.includes("DOCUMENT_NOT_FOUND")) {
      return founderPrivateJson({ ok: false, error: "That reference does not resolve to an active canonical document.", productionReady: false }, { status: 404 });
    }
    if (detail.includes("DOCUMENT_CANDIDATE_MISMATCH")) {
      return founderPrivateJson({ ok: false, error: "The selected candidate does not match the canonical document record.", productionReady: false }, { status: 409 });
    }
    if (detail.includes("PROOF_REFERENCE_NOT_FOUND")) {
      return founderPrivateJson({ ok: false, error: "The proof reference is not linked to this document.", productionReady: false }, { status: 422 });
    }
    if (detail.includes("VERIFICATION_PROOF_NOT_PASSED")) {
      return founderPrivateJson({ ok: false, error: "A verified decision requires a linked verification record with PASSED status.", productionReady: false }, { status: 422 });
    }
    if (detail.includes("EVIDENCE_REFERENCE_NOT_FOUND")) {
      return founderPrivateJson({ ok: false, error: "The evidence reference does not resolve to a supported record linked to this document.", productionReady: false }, { status: 422 });
    }
    return founderPrivateJson({ ok: false, error: "Database did not accept the review. Confirm migrations 0018 and 0019 are applied and founder role claims are configured.", productionReady: false }, { status: 503 });
  }

  let persisted: Record<string, unknown>;
  try {
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    persisted = value as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "Could not verify the database persistence response. Check the review queue before retrying.", productionReady: false, persistenceUnknown: true }, { status: 502 });
  }

  if (persisted.persisted !== true || persisted.sourceStatusChanged !== false || persisted.ownershipVerified !== true || persisted.evidenceResolved !== true) {
    return founderPrivateJson({ ok: false, error: "Database response did not satisfy the document-review safety contract.", productionReady: false, persistenceUnknown: true }, { status: 502 });
  }

  return founderPrivateJson({
    ok: true,
    productionReady: false,
    persisted: true,
    statusChanged: false,
    decision: {
      ...persisted,
      reviewerUserId: access.userId,
      safeNotes,
      persistedAt: new Date().toISOString()
    },
    boundary: "Decision and audit event were persisted transactionally after matching the document and candidate in the canonical registry and resolving linked proof/evidence records. The source document was not modified; evidence meaning still requires human review.",
    remainingRequirements: [
      "Review the linked evidence content and context; record existence alone does not establish its truth.",
      "Apply source document status changes only through the separately governed status-transition service."
    ]
  }, { status: 201 });
}
