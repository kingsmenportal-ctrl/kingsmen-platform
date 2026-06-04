export function transformN07ConsentSafePartnerMirror(input: {
  candidateId: string;
  partnerId: string;
  consentGranted: boolean;
  payload: Record<string, unknown>;
}) {
  const payload: Record<string, unknown> = { ...input.payload };
  const strippedFields: string[] = [];

  if (!input.consentGranted) {
    for (const field of ["candidateName", "candidateEmail", "candidatePhone", "idNumber", "documentRef", "cvRawText"]) {
      if (field in payload) {
        delete payload[field];
        strippedFields.push(field);
      }
    }
  }

  return {
    candidateId: input.candidateId,
    partnerId: input.partnerId,
    consentGranted: input.consentGranted,
    payload,
    strippedFields,
    mirrorOnly: true,
    canGovernTruth: false,
    productionReady: false
  } as const;
}