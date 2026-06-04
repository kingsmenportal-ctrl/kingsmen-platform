import { buildN05SignedUpload, buildN05SignedRead } from "./storage-signer-boundary";
import { assertN05CandidateOwnDocumentBoundary } from "./document-own-boundary-policy";

export async function requestN05SignedUploadGateway(input: {
  candidateId: string;
  documentTypeCode: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  auditId: string;
}) {
  assertN05CandidateOwnDocumentBoundary({
    actorType: "candidate",
    candidateId: input.candidateId,
    ownerCandidateId: input.candidateId,
    action: "upload"
  });

  return buildN05SignedUpload(input);
}

export async function requestN05SignedReadGateway(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  candidateId: string;
  ownerCandidateId: string;
  documentId: string;
  auditId: string;
}) {
  assertN05CandidateOwnDocumentBoundary({
    actorType: input.actorType,
    candidateId: input.candidateId,
    ownerCandidateId: input.ownerCandidateId,
    action: "read"
  });

  return buildN05SignedRead(input);
}