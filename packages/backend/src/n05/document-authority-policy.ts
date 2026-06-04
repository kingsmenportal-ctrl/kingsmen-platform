const CANDIDATE_FORBIDDEN_DOCUMENT_ACTIONS = new Set([
  "verify_document",
  "reject_document",
  "mark_fraud_clear",
  "mark_fraud_confirmed",
  "change_document_status_without_proof"
]);

export function assertN05DocumentAuthoritySafe(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  action: string;
  evidenceId?: string;
  proofId?: string;
  auditId?: string;
}) {
  if (!input.evidenceId || !input.auditId) {
    throw new Error("N05 document action requires evidence and auditId");
  }

  if (input.actorType === "candidate" && CANDIDATE_FORBIDDEN_DOCUMENT_ACTIONS.has(input.action)) {
    throw new Error(`N05 candidate cannot perform document authority action: ${input.action}`);
  }

  if (["verify_document", "reject_document", "mark_fraud_clear", "mark_fraud_confirmed"].includes(input.action) && !input.proofId) {
    throw new Error(`N05 document status action requires proof: ${input.action}`);
  }

  return true;
}